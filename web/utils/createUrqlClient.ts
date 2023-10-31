import { fetchExchange } from "urql";
import { Resolver, cacheExchange } from "@urql/exchange-graphcache";

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

// cursor pagination function
const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    // : parent is the parent object, fieldArgs are the arguments passed to the field, cache is the urql cache, info is the info about the field
    const { parentKey: entityKey, fieldName } = info;
    // entityKey: Query, fieldName: posts
    const allFields = cache.inspectFields(entityKey);
    console.log("allFields: ", allFields);
    // we are inspecting all the fields in the cache currently, and we are filtering the fields that have the same fieldName as the one we are looking for
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    // if there are no fields, we return undefined
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    // we are creating a key for the field we are looking for
    const fieldKey = `${fieldName}(${JSON.stringify(fieldArgs)})`;
    // we are checking if the data is in the cache, and if it is, we are returning it. if it is not, we are returning undefined
    const isItInTheCache = cache.resolve(
      cache.resolve(entityKey, fieldKey) as string,
      "posts"
    );
    console.log("isItInTheCache: ", isItInTheCache);
    // we are telling urql that the data is partial
    info.partial = !isItInTheCache;
    let hasMore = true;

    // we are checking if the data is in the cache, and if it is, we are returning it
    const results: string[] = []; // looping through the fieldInfos and returning the results array
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[]; // we are resolving the key and posts
      const _hasMore = cache.resolve(key, "hasMore"); // we are resolving the key and hasMore
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      // console.log("data: ", hasMore, data);
      results.push(...data);
    });
    return {
      __typename: "PaginatedPosts", // we are returning the typename
      hasMore, // we are returning true for hasMore for now
      posts: results,
    };

    // const visited = new Set();
    // let result: NullArray<string> = [];
    // let prevOffset: number | null = null;

    // for (let i = 0; i < size; i++) {
    //   const { fieldKey, arguments: args } = fieldInfos[i];
    //   if (args === null || !compareArgs(fieldArgs, args)) {
    //     continue;
    //   }

    //   const links = cache.resolve(entityKey, fieldKey) as string[];
    //   const currentOffset = args[cursorArgument];

    //   if (
    //     links === null ||
    //     links.length === 0 ||
    //     typeof currentOffset !== "number"
    //   ) {
    //     continue;
    //   }

    //   const tempResult: NullArray<string> = [];

    //   for (let j = 0; j < links.length; j++) {
    //     const link = links[j];
    //     if (visited.has(link)) continue;
    //     tempResult.push(link);
    //     visited.add(link);
    //   }

    //   if (
    //     (!prevOffset || currentOffset > prevOffset) ===
    //     (mergeMode === "after")
    //   ) {
    //     result = [...result, ...tempResult];
    //   } else {
    //     result = [...tempResult, ...result];
    //   }

    //   prevOffset = currentOffset;
    // }

    // const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
    // if (hasCurrentPage) {
    //   return result;
    // } else if (!(info as any).store.schema) {
    //   return undefined;
    // } else {
    //   info.partial = true;
    //   return result;
    // }
  };
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
      // we are adding the keys to the cache
      keys: {
        PaginatedPosts: () => null,
      },
      // we are adding the cursorPagination function to the resolvers
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
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
