import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

export default {
  // setting up migrations and patterns as [tj]s files
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
    // disableForeignKeys: false,
    //  wrap: false,
  },

  entities: [User, Post],
  dbName: "lireddit",
  user: "postgres",
  password: "deeppostgres",
  type: "postgresql",

  debug: !__prod__,
  // explicit setting type as parameter
} as Parameters<typeof MikroORM.init>[0];
