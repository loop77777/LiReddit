import { withUrqlClient } from "next-urql";
import React from "react";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { Layout } from "../../components/Layout";
import { CircularProgress, Flex, Heading, Text } from "@chakra-ui/react";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";
import { EditDeletePostButtons } from "../../components/EditDeletePostButtons";

const Post = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl();

  if (fetching) {
    return (
      <Layout>
        <Flex justify={"center"}>
          <CircularProgress isIndeterminate color="purple.500" />
        </Flex>
      </Layout>
    );
  }
  if (error) {
    console.log(error.message);
    return (
      <Layout>
        <Flex justify={"center"}>{error.message}</Flex>
      </Layout>
    );
  }
  if (!data?.post) {
    return (
      <Layout>
        <Flex justify={"center"}>Could not find post</Flex>
      </Layout>
    );
  }
  return (
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      <Text mb={4}>{data.post.text}</Text>
      <EditDeletePostButtons
        id={data.post.id}
        creatorId={data.post.creator.id}
      />
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
