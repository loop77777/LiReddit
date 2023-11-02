import { withUrqlClient } from "next-urql";
import React from "react";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { Layout } from "../../components/Layout";
import { Heading, Text } from "@chakra-ui/react";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";
import { EditDeletePostButtons } from "../../components/EditDeletePostButtons";

const Post = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl();

  if (fetching) {
    return <Layout>Loading...</Layout>;
  }
  if (error) {
    console.log(error.message);
    return <Layout>{error.message}</Layout>;
  }
  if (!data?.post) {
    return <Layout>Could not find post</Layout>;
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
