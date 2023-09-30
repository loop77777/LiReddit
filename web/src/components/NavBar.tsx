import { Box, Button, Flex, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { DarkModeSwitch } from "../components/DarkModeSwitch";

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  const [{ data, fetching }] = useMeQuery();
  let body = null;

  console.log("data: ", data);
  //data is loading
  if (fetching) {
    // when data is loading, show nothing
  } else if (!data?.me) {
    //user not logged in
    body = (
      <>
        <Link href="/login" mr={3} color={"white"}>
          login
        </Link>
        <Link href="/register" mr={3} color={"white"}>
          register
        </Link>
      </>
    );
  } else {
    //user is logged in
    body = (
      <Flex>
        <Box mr={3} color={"white"}>
          {data.me.username}
        </Box>
        <Button
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
    <Flex bg="tan" p={4}>
      {/* purple */}
      <Box ml={"auto"}>
        {body}
        <DarkModeSwitch />
      </Box>
    </Flex>
  );
};
