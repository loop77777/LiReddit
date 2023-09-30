import { Cache, QueryInput } from "@urql/exchange-graphcache";

// we are making an helper function to easy cast the type of the cache
// we are making a generic type for the result and the query
// this function will allow us to properly cast the type
export function betterUpdateQuery<Result, Query>(
  cache: Cache,
  // qi is the query input, the query we want to update
  qi: QueryInput,
  result: any,
  // fn is the function that will update the cache
  fn: (r: Result, q: Query) => Query
) {
  // we are using any because we don't know the type of the data
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
