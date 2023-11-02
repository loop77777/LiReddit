import { ChakraProvider } from "@chakra-ui/react";

import theme from "../theme";
import { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider
      theme={theme}
      toastOptions={{
        defaultOptions: {
          colorScheme: "purple",
          duration: 3000,
          isClosable: true,
        },
      }}
    >
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
