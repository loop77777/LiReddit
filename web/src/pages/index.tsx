import { withUrqlClient } from "next-urql";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Navbar } from "../components/NavBar";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { useDeletePostMutation, usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon, DeleteIcon } from "@chakra-ui/icons";
import { UpdootSection } from "../components/UpdootSection";

const Index = () => {
  const [variables, setVariables] = useState<{
    limit: number;
    cursor: string | null;
  }>({
    limit: 15,
    cursor: null,
  });

  console.log("variables", variables);
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  const [, deletePost] = useDeletePostMutation();

  if (!fetching && !data) {
    return <div>query failed for some reason</div>;
  }

  return (
    <Layout>
      {!data && fetching ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p /* !p ? null : */) => (
            <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
              <UpdootSection post={p} />
              <Box flex={1}>
                <Link href="/post/[id]" as={`/post/${p.id}`}>
                  <Heading fontSize="xl">{p.title}</Heading>
                </Link>
                <Text>posted by {p.creator.username}</Text>
                <Flex align={"center"}>
                  <Text mt={4}>{p.textSnippet}</Text>
                  <IconButton
                    aria-label="Delete Post"
                    ml={"auto"}
                    icon={<DeleteIcon />}
                    colorScheme="purple"
                    onClick={() => {
                      deletePost({ id: p.id });
                    }}
                  />
                </Flex>
              </Box>
            </Flex>
          ))}
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
