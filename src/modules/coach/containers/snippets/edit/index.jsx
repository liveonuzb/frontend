import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, isArray } from "lodash";
import { toast } from "sonner";
import { useCoachSnippet, useCoachSnippetsMutations } from "@/modules/coach/lib/hooks/useCoachSnippets";
import SnippetFormDrawer from "../components/SnippetFormDrawer.jsx";

const EditSnippetPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mutations = useCoachSnippetsMutations();

  const { data: snippetData, isLoading } = useCoachSnippet(id);
  const snippet =
    get(snippetData, "data.data", null) || get(snippetData, "data", null);

  const handleClose = () => navigate("../list");

  const handleSave = async (data) => {
    try {
      await mutations.updateResource(id, {
        title: data.title,
        content: data.content,
        tags: data.tags ?? [],
      });
      toast.success("Shablon yangilandi");
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
      mode="edit"
      snippet={isLoading ? null : snippet}
      isSubmitting={mutations.updateMutation.isPending}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default EditSnippetPage;
