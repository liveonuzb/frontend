import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, isArray } from "lodash";
import { toast } from "sonner";
import { useCoachGroup, useCoachGroupsMutations } from "@/modules/coach/lib/hooks/useCoachGroups";
import GroupFormDrawer from "../components/GroupFormDrawer.jsx";

const EditGroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mutations = useCoachGroupsMutations();

  const { data: groupData, isLoading } = useCoachGroup(id);
  const group =
    get(groupData, "data.data", null) || get(groupData, "data", null);

  const handleClose = () => navigate("../list");

  const handleSave = async (data) => {
    try {
      await mutations.updateResource(id, {
        name: data.name,
        description: data.description || "",
      });
      toast.success("Guruh yangilandi");
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
      mode="edit"
      group={isLoading ? null : group}
      isSubmitting={mutations.updateMutation.isPending}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default EditGroupPage;
