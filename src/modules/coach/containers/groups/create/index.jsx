import React from "react";
import { useNavigate } from "react-router";
import { isArray } from "lodash";
import { toast } from "sonner";
import { useCoachGroupsMutations } from "@/modules/coach/lib/hooks/useCoachGroups";
import GroupFormDrawer from "../components/GroupFormDrawer.jsx";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const mutations = useCoachGroupsMutations();

  const handleClose = () => navigate("../list");

  const handleSave = async (data) => {
    try {
      await mutations.createResource({
        name: data.name,
        description: data.description || "",
      });
      toast.success("Yangi guruh yaratildi");
      navigate("../list");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
      throw error;
    }
  };

  return (
    <GroupFormDrawer
      mode="create"
      group={null}
      isSubmitting={mutations.createMutation.isPending}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default CreateGroupPage;
