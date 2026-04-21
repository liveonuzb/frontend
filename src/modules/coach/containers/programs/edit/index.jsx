import React from "react";
import { useNavigate, useParams } from "react-router";
import ProgramFormDrawer from "../components/ProgramFormDrawer.jsx";

const EditProgramPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ProgramFormDrawer
      mode="edit"
      programId={id}
      open={true}
      onOpenChange={(open) => {
        if (!open) navigate(-1);
      }}
    />
  );
};

export default EditProgramPage;
