import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import React from "react";
import Link from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { DarkModeSwitch } from "../components/DarkModeSwitch";
import { isServer } from "../../utils/isServer";
import { useRouter } from "next/router";

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({}) => {
  const toast = useToast();
  const router = useRouter();
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
      <Flex>
        <Box mr={3}>
          <Link href="/login" color={"white"}>
            login
          </Link>
        </Box>
        <Box mr={3}>
          <Link href="/register" color={"white"}>
            register
          </Link>
        </Box>
      </Flex>
    );
  } else {
    //user is logged in
    body = (
      <Flex align={"center"}>
        <Button mr={5} colorScheme="purple">
          <Link href="/create-post">create post</Link>
        </Button>
        <Box mr={3} color={"white"}>
          {data.me.username}
        </Box>
        <Button
          mr={3}
          onClick={async () => {
            await logout({}); // we don't need to pass any options
            router.reload(); // reload the page
            toast({
              title: "Logged out successfully",
              status: "success",
            });
          }}
          isLoading={logoutFetching}
          variant="outline"
          colorScheme="purple"
        >
          logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
      <Flex flex={1} m={"auto"} maxW={800} align={"center"}>
        <Link href="/">
          <Box fontSize="xl" fontWeight="bold">
            LiReddit
          </Box>
        </Link>
        <Flex ml={"auto"} alignItems={"center"}>
          {body}
          <DarkModeSwitch />
        </Flex>
      </Flex>
    </Flex>
  );
};
