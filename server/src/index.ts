import "reflect-metadata"; // to use type-graphql, both mikro-orm and type-orm use this
// mikro-orm imports
// import { MikroORM } from "@mikro-orm/core";
// import microConfig from "./mikro-orm.config";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
// typeorm imports
// connection is deprecated,changed to datasource
import AppDataSource from "./datasource";
import { Post } from "./entities/Post";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
// main function
const main = async () => {
  // typeorm config
  // initialize datasoruce, connection is deprecated

  await AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
  // delete all posts
  // await Post.delete({});
  await AppDataSource.runMigrations();

  // mikro-orm config
  // *const orm = await MikroORM.init(microConfig);
  // await orm.em.nativeDelete(User, {}); // to delete all of the users
  // setting up migrations and keep tracks for migrations
  //* await orm.getMigrator().up();
  const app = express();
  const RedisStore = connectRedis(session);
  // upgrading redis to ioredis to use async/await
  const redis = new Redis();
  // setting cors on express, we can set on appolo aswell.
  // setting on appolo will set on it's route and we want to set it on all of our route's so we set on express
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }), // disableTouch: true means that session will not expire by ttl
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false,
    })
  );
  // initialize apollo server with graphql endpoint
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // context is a special object that is accessible by all resolvers
    // if show errors of type different, remove myContext
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }), // added redis to access it in resolvers
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
  //   create post using mikro-orm, and persist it to db
  //   const post = await orm.em.create(Post, { title: "my first post" });
  //   await orm.em.persistAndFlush(post);
  //   const posts = await orm.em.find(Post, {})
  //   console.log(posts)
};

main().catch((err) => {
  console.error(err);
});
