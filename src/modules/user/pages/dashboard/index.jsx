import React from "react";
import { Outlet } from "react-router";
import Container from "@/modules/user/containers/dashboard";

const Index = () => {
  return (
    <>
      <Container />
      <Outlet />
    </>
  );
};

export default Index;
