import React from "react";
import { useNavigate } from "react-router";
import { isArray } from "lodash";
import { toast } from "sonner";
import { useCoachChallengesMutations } from "@/modules/coach/lib/hooks/useCoachChallenges";
import ChallengeFormDrawer from "../components/ChallengeFormDrawer.jsx";

const CreateChallengePage = () => {
  const navigate = useNavigate();
  const mutations = useCoachChallengesMutations();

  const handleClose = () => navigate("../list");

  const handleSave = async (data) => {
    try {
      await mutations.createResource({
        title: data.title,
        description: data.description || "",
        status: data.status,
        ...(data.startDate ? { startDate: data.startDate } : {}),
        ...(data.endDate ? { endDate: data.endDate } : {}),
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
      });
      toast.success("Yangi musobaqa yaratildi");
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
    <ChallengeFormDrawer
      mode="create"
      challenge={null}
      isSubmitting={mutations.createMutation.isPending}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default CreateChallengePage;
