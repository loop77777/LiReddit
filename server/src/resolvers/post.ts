import { In } from "typeorm";
import { Post } from "../entities/Post";
import {
  Query,
  Resolver,
  Arg,
  Mutation,
  InputType,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
} from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import AppDataSource from "../datasource";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post]) // to get the posts
  posts: Post[];
  @Field() // to get the hasMore
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  //? field resolver to get the creator of the post
  @FieldResolver(() => String) // to get the text snippet
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User) // to get the creator of the post
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });
    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    //? check if user has already voted
    const updoot = await Updoot.findOne({
      where: { postId, userId: req.session.userId },
    });

    if (updoot && updoot.value !== realValue) {
      //? user has voted on the post before and is changing his vote
      // transaction to update the updoot and post table
      await AppDataSource.transaction(async (tm) => {
        await tm.query(
          `
          update updoot
          set value = ${realValue}
          where "postId" = ${postId} and "userId" = ${userId};
        `
        );
        await tm.query(
          `
          update post
          set points = points + ${2 * realValue}
          where id = ${postId};
        `
        );
      });
    } else if (!updoot) {
      //? user has never voted on the post before
      await AppDataSource.transaction(async (tm) => {
        await tm.query(
          `
          insert into updoot ("userId", "postId", value)
          values (${userId}, ${postId}, ${realValue});
        `
        );
        await tm.query(
          `
          update post
          set points = points + ${realValue}
          where id = ${postId};
        `
        );
      });
    }

    return true;
  }

  //? query to get all posts - pagination
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit); // limit the number of posts to 50, +1 to check if there are more posts
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    //? raw sql query
    const posts = await AppDataSource.query(
      `
      select p.*
      from post p
      ${cursor ? `where p."createdAt" < $2` : ""}
      order by p."createdAt" DESC
      limit $1
    `,
      replacements
    );

    //? query builder
    // const qb = AppDataSource.getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"') // to get the creator of the post
    //   .orderBy('p."createdAt"', "DESC") // in postgresql, column name is case sensitive
    //   .take(realLimitPlusOne);
    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    // }

    // const posts = await qb.getMany();

    // console.log("posts: ", posts);
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  //? query to get a post by id
  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  //? mutation to create a post
  @Mutation(() => Post)
  @UseMiddleware(isAuth) // to check if user is logged in
  async CreatePost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  //? mutation to update a post
  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth) // to check if user is logged in
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await AppDataSource.createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  //? mutation to delete a post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth) // to check if user is logged in
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // non cascade way
    // const post = await Post.findOne({ where: { id } }); // find the post
    // if (!post) {
    //   return false;
    // }

    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorized");
    // }

    // await Updoot.delete({ postId: id }); // delete the updoots of the post
    // await Post.delete({ id }); // delete the post, only if the user is the creator of the post

    await Post.delete({ id, creatorId: req.session.userId }); // delete the post, only if the user is the creator of the post
    return true;
  }
}
