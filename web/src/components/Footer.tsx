import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

interface FooterProps {}

export const Footer: React.FC<FooterProps> = ({}) => {

  return (
    <Flex
      position={"fixed"}
      minWidth="100%"
      bottom={0}
      bg="tan"
      p={4}
      justify={"center"}
    >
      <Text>LiReddit© 2023</Text>
    </Flex>
  );
};
