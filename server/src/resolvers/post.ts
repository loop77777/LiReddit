import { Post } from "../entities/Post";
import { Query, Resolver, Arg, Mutation } from "type-graphql";

@Resolver()
export class PostResolver {
  //? query to get all posts
  @Query(() => [Post])
  async posts(): Promise<Post[]> {
    return Post.find();
  }

  //? query to get a post by id
  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  //? mutation to create a post
  @Mutation(() => Post)
  async CreatePost(@Arg("title") title: string): Promise<Post> {
    return Post.create({ title }).save();
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
