import { fetchExchange } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";

import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../src/generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import router from "next/router";
// global error handler
const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    // ops$ is an observable
    return pipe(
      // pipe function chains together the series of observable operators
      forward(ops$), // forward the ops$ observable to the next operator on errorExchange
      tap(({ error }) => {
        // tap contains the errors property
        if (error?.message.includes("not authenticated")) {
          router.replace("/login");
        }
      })
    );
  };

// we are creating a function that will return the urql client and do ssr on the server
// we are passing the ssrExchange as a parameter
export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    cacheExchange({
      updates: {
        Mutation: {
          // login mutation
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  };
                }
              }
            );
          },
          // register mutation
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  };
                }
              }
            );
          },
          // logout mutation
          logout: (_result, args, cache, info) => {
            // we are updating the cache to set the me to null
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              // we are returning an empty object
              () => ({ me: null })
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
});
