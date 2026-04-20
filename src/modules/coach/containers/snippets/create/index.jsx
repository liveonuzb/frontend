import React from "react";
import { useNavigate } from "react-router";
import { isArray } from "lodash";
import { toast } from "sonner";
import { useCoachSnippetsMutations } from "@/modules/coach/lib/hooks/useCoachSnippets";
import SnippetFormDrawer from "../components/SnippetFormDrawer.jsx";

const CreateSnippetPage = () => {
  const navigate = useNavigate();
  const mutations = useCoachSnippetsMutations();

  const handleClose = () => navigate("../list");

  const handleSave = async (data) => {
    try {
      await mutations.createResource({
        title: data.title,
        content: data.content,
        tags: data.tags ?? [],
      });
      toast.success("Yangi shablon yaratildi");
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
    <SnippetFormDrawer
      mode="create"
      snippet={null}
      isSubmitting={mutations.createMutation.isPending}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default CreateSnippetPage;
