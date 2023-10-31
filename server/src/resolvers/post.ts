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

  //? query to get all posts - pagination
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit); // limit the number of posts to 50, +1 to check if there are more posts
    const realLimitPlusOne = realLimit + 1;
    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"createdAt"', "DESC") // in postgresql, column name is case sensitive
      .take(realLimitPlusOne);
    if (cursor) {
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }

    const posts = await qb.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  //? query to get a post by id
  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | null> {
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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    // 2 sql queries
    const post = await Post.findOne({ where: { id } }); // find the post
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      Post.update({ id }, { title }); // update the post
    }
    return post;
  }

  //? mutation to delete a post
  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    await Post.delete({ id }); // delete the post
    return true;
  }
}
