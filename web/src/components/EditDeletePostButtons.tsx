import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Box, IconButton } from "@chakra-ui/react";
import Link from "next/link";
import React from "react";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data: meData }] = useMeQuery();

  const [, deletePost] = useDeletePostMutation();
  if (meData?.me?.id !== creatorId) {
    return null;
  }

  return (
    <Box>
      <Link href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton
          aria-label="Edit Post"
          mr={4}
          icon={<EditIcon />}
          colorScheme="purple"
        />
      </Link>
      <IconButton
        aria-label="Delete Post"
        icon={<DeleteIcon />}
        colorScheme="purple"
        onClick={() => {
          deletePost({ id });
        }}
      />
    </Box>
  );
};
