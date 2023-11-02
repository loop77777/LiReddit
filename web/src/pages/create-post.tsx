import React, { useEffect } from "react";
import { Button, Box, useToast } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { useRouter } from "next/router";
import { InputField } from "../components/InputField";
import { useCreatePostMutation, useMeQuery } from "../generated/graphql";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { Layout } from "../components/Layout";
import { useIsAuth } from "../../utils/useIsAuth";

const CreatePost: React.FC<{}> = ({}) => {
  const toast = useToast();
  const router = useRouter();
  // if user is not logged in, redirect to login page
  useIsAuth();
  const [, createPost] = useCreatePostMutation();
  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          if (!values.title || !values.text) {
            toast({
              title: "Please fill all the fields",
              status: "error",
            });
            return;
          }
          const { error } = await createPost({ input: values });
          if (!error) {
            router.push("/");
            toast({
              title: "Post created successfully",
              status: "success",
            });
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                name="text"
                placeholder="text..."
                label="Body"
                textarea
              />
            </Box>
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              colorScheme="purple"
            >
              create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
