import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { isServer } from "../../utils/isServer";
// import Link from "next/link";

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  // setting me query to not run on initial render
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(), // don't run this query if user is not logged in
  });
  let body = null;

  // console.log("data: ", data);
  //data is loading
  if (fetching) {
    // when data is loading, show nothing
  } else if (!data?.me) {
    //user not logged in
    body = (
      <Box>
        <Link href="/login" color={"white"} mr={3}>
          login
        </Link>
        <Link href="/register" color={"white"} mr={3}>
          register
        </Link>
      </Box>
    );
  } else {
    //user is logged in
    body = (
      <Flex>
        <Box mr={3} color={"white"}>
          {data.me.username}
        </Box>
        <Button
          mr={3}
          onClick={() => {
            logout({}); // we don't need to pass any options
          }}
          isLoading={logoutFetching}
          variant="link"
          colorScheme="purple"
        >
          logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
      {/* purple */}
      <Box ml={"auto"}>
        {body}
        {/* <DarkModeSwitch /> */}
      </Box>
    </Flex>
  );
};
