import React from "react";
import { useNavigate } from "react-router";
import ProgramFormDrawer from "../components/ProgramFormDrawer.jsx";

const CreateProgramPage = () => {
  const navigate = useNavigate();

  return (
    <ProgramFormDrawer
      mode="create"
      open={true}
      onOpenChange={(open) => {
        if (!open) navigate(-1);
      }}
    />
  );
};

export default CreateProgramPage;
