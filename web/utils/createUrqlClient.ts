import { fetchExchange } from "urql";
import { Cache, Resolver, cacheExchange } from "@urql/exchange-graphcache";

import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../src/generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { pipe, tap } from "wonka";
import { Exchange } from "urql";
import { gql } from "@urql/core";
import router from "next/router";
import { isServer } from "./isServer";
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
    // console.log("allFields: ", allFields);
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
  };
};

function invalidateAllPosts(cache: Cache) {
  const allFields = cache.inspectFields("Query");
  console.log("allFields: ", allFields);
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  console.log("fieldInfos: ", fieldInfos);
  fieldInfos.forEach((fi) => {
    cache.invalidate("Query", "posts", fi.arguments || {});
  });
}
// we are creating a function that will return the urql client and do ssr on the server
// we are passing the ssrExchange as a parameter
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  //  console.log("ctx: ", ctx)
  let cookie = "";
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      // we are passing the cookie to the server
      headers: cookie ? { cookie } : undefined,
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
            deletePost: (_result, args, cache, info) => {
              // we are invalidating the cache for the post that is deleted
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
            // vote mutation
            vote: (_result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId } as any
              );
              // console.log("data: ", data);
              if (data) {
                // if the user has already voted, we are returning
                if (data.voteStatus === value) return;
                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
                cache.writeFragment(
                  gql`
                    fragment _ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value } as any
                );
              }
            },
            // create post mutation, it's working fine without this. but we are adding this to update the cache for the post
            CreatePost: (_result, args, cache, info) => {
              invalidateAllPosts(cache);
            },
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
              invalidateAllPosts(cache);
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
  };
};
