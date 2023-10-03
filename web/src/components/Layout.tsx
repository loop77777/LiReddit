import React from "react";
import { Wrapper, WrapperVariant } from "./Wrapper";
import { Navbar } from "./NavBar";

interface LayoutProps {
  variant?: WrapperVariant;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, variant }) => {
  return (
    <>
      <Navbar />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  );
};
