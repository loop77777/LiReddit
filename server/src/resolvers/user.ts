import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import AppDataSource from "../datasource";

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

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user wants to see someone else's email
    return "";
  }

  //? change password mutation
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    // get the user id from redis
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    // parse the user id
    const userIdNum = parseInt(userId);
    // update the user
    const user = await User.findOne({ where: { id: userIdNum } });
    // if an user with the given id doesn't exist
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    // update the user
    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );
    // remove the token from redis
    await redis.del(key);
    // log in the user after changing the password
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // the email is not in the database
      return true;
    }
    const token = v4(); //? generate a unique token
    redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "EX",
      1000 * 60 * 60 * 24 * 3
    ); //* 3 days
    sendEmail(
      email,
      `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`
    );
    return true;
  }

  //? query to get the current user
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // console.log("session:", req.session);
    // if not logged in
    if (!req.session.userId) {
      return null;
    }
    return User.findOne({ where: { id: req.session.userId } });
  }

  //? register mutation
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // validate the input
    const errors = validateRegister(options);
    //* separated out the errors on validation as an array
    if (errors) {
      return { errors };
    }
    // noerror
    const hashedPassword = await argon2.hash(options.password);
    // const user = em.create(User, {
    //   username: options.username,
    //   email: options.email,
    //   password: hashedPassword,
    // });
    //? now using typeorm query builder
    let user; //? it is used instead of const user for query builders
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
      //* using typeorm query builder
      // User.create({}).save(); //? this is the same as the below query
      const result = await AppDataSource.createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*")
        .execute();
      // console.log("result:", result);
      user = result.raw[0];
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
    // adding two arguments to login mutation, before it was usernamepasswordinput as options
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx()
    { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      return {
        // returning errors as field errors
        errors: [
          {
            field: "usernameOrEmail",
            message: "user doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
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
