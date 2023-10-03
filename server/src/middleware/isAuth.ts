import { MiddlewareFn } from "type-graphql";
// this middleware will run before the resolver
import { MyContext } from "../types";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  // if user is not logged in
  if (!context.req.session.userId) {
    throw new Error("not authenticated");
  }
  return next();
};
