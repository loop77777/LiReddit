import { Box, Button, CircularProgress, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import Link from "next/link";
import { useState } from "react";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { Layout } from "../components/Layout";
import { UpdootSection } from "../components/UpdootSection";
import { useMeQuery, usePostsQuery } from "../generated/graphql";

const Index = () => {
  const [variables, setVariables] = useState<{
    limit: number;
    cursor: string | null;
  }>({
    limit: 15,
    cursor: null,
  });

  const [{ data, error, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return (
      <Flex align={"center"} direction={"column"}>
        <div>query failed for some reason</div>
        <div>{error?.message}</div>
      </Flex>
    );
  }

  return (
    <Layout>
      {!data && fetching ? (
        <Flex justify={"center"}>
          <CircularProgress isIndeterminate color="purple.500" />
        </Flex>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map(
            (
              p /* !p ? null : (if get error on delete,otherwise it's working fine) */
            ) => (
              <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
                <UpdootSection post={p} />
                <Box flex={1}>
                  <Link href="/post/[id]" as={`/post/${p.id}`}>
                    <Heading fontSize="xl">{p.title}</Heading>
                  </Link>
                  <Text>posted by {p.creator.username}</Text>
                  <Flex align={"center"}>
                    <Text mt={4}>{p.textSnippet}</Text>
                    <Box ml={"auto"}>
                      <EditDeletePostButtons
                        id={p.id}
                        creatorId={p.creator.id}
                      />
                    </Box>
                  </Flex>
                </Box>
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                ...variables,
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              });
            }}
            isLoading={fetching}
            m={"auto"}
            my={8}
            mb={12}
            colorScheme="purple"
            variant={"outline"}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
