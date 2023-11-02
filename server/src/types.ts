import { Request, Response } from "express";
import session from "express-session";
import Redis from "ioredis";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
declare module "express-session" {
  export interface SessionData {
    userId: any;
  }
}
export type MyContext = {
  req: Request & {
    session: session.Session;
  };
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>; // cool trick to get the type of the return value of a function
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
