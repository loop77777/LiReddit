import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import express from "express";
import { COOKIE_NAME } from "../constants";
import session from "express-session";
import { EntityManager } from "@mikro-orm/postgresql";

@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  //? query to get the current user
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    // console.log("session:", req.session);
    // if not logged in
    if (!req.session.userId) {
      return null;
    }
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  //? register mutation
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "length must be greater than 2",
          },
        ],
      };
    }
    if (options.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be greater than 2",
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    // let user //? it is used instead of const user for query builder
    try {
      //* no need to use query builder here
      // because we are not doing any complex queries
      // just persisting the user and flushing the changes to the database
      // but for demo purposes we are using query builder
      // the first result is the user object
      //  const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert({
      //    username: options.username,
      //    password: hashedPassword,
      // mikro orm will automatically add created_at and updated_at fields
      // knex doesn't have this feature,it does'nt know which column to add
      // so we need to add it manually
      //   created_at: new Date(),
      //   updated_at: new Date(),
      // }).returning("*");
      // user = result[0]; //? that's it we are done, the query builder will return the user object
      await em.persistAndFlush(user);
    } catch (err) {
      //duplicate username error
      // || err.detail.includes("already exists")
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }
    //store user id session
    //this will set a cookie on user
    //keep them logged in
    req.session.userId = user.id;

    return { user };
  }

  //? login mutation
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx()
    { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        // returning errors as field errors
        errors: [
          {
            field: "username",
            message: "username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }
    req.session.userId = user.id;
    return {
      user,
    };
  }

  //? logout mutation
  // destroy the redis session and clear the cookie
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
