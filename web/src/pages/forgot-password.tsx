import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { Button, Box, useToast } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";

const forgotPassword: React.FC<{}> = ({}) => {
  const toast = useToast();
  const [complete, setComplete] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values) => {
          if (!values.email) {
            return;
          }
          await forgotPassword(values);
          setComplete(true);
          toast({
            title: "Check your email for the link to reset your password",
            status: "success",
          });
        }}
      >
        {({ isSubmitting }) =>
          complete ? (
            <Box>
              if an account with that email exists, we sent you an email
            </Box>
          ) : (
            <Form>
              <Box mt={4}>
                <InputField
                  name="email"
                  placeholder="enter your email"
                  label="Email"
                  type="email"
                />
              </Box>
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                colorScheme="purple"
              >
                forgot password
              </Button>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(forgotPassword);
