import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";

const AppDataSource = new DataSource({
  type: "postgres",
  database: "lireddit2",
  username: "postgres",
  password: "deeppostgres",
  logging: true,
  migrations: [path.join(__dirname, "/migrations/*")],
  synchronize: true, // to create tables automatically, no need to run migrations now. false in production
  entities: [Post, User, Updoot],
});

export default AppDataSource;
