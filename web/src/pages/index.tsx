import { withUrqlClient } from "next-urql";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Navbar } from "../components/NavBar";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { Link } from "@chakra-ui/react";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <Layout>
      <Link href="/create-post">create post</Link>
      <br />
      {!data ? (
        <div>loading...</div>
      ) : (
        data.posts.map((p) => <div key={p.id}>{p.title}</div>)
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
