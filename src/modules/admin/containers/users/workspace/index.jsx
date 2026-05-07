import React from "react";
import { useParams } from "react-router";
import PageTransition from "@/components/page-transition";
import UserDetailView from "../detail/user-detail-view.jsx";

const Index = () => {
  const { id } = useParams();

  return (
    <PageTransition>
      <UserDetailView userId={id} surface="page" />
    </PageTransition>
  );
};

export default Index;
