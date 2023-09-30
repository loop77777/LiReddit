import { withUrqlClient } from "next-urql";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { Navbar } from "../components/NavBar";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    // Dark Mode Switch
    <>
      <Navbar />
      {!data ? (
        <div>loading...</div>
      ) : (
        data.posts.map((p) => <div key={p.id}>{p.title}</div>)
      )}
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);