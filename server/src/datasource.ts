import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

const AppDataSource = new DataSource({
  type: "postgres",
  database: "lireddit2",
  username: "postgres",
  password: "deeppostgres",
  logging: true,
  synchronize: true, // to create tables automatically, no need to run migrations now. false in production
  entities: [Post, User],
});

export default AppDataSource;
