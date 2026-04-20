import React from "react";
import { useNavigate, useParams } from "react-router";
import { get, isArray } from "lodash";
import { toast } from "sonner";
import {
  useCoachChallenge,
  useCoachChallengesMutations,
} from "@/modules/coach/lib/hooks/useCoachChallenges";
import ChallengeFormDrawer from "../components/ChallengeFormDrawer.jsx";

const EditChallengePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mutations = useCoachChallengesMutations();

  const { data: challengeData, isLoading } = useCoachChallenge(id);
  const challenge =
    get(challengeData, "data.data", null) || get(challengeData, "data", null);

  const handleClose = () => navigate("../list");

  const handleSave = async (data) => {
    try {
      await mutations.updateResource(id, {
        title: data.title,
        description: data.description || "",
        status: data.status,
        ...(data.startDate ? { startDate: data.startDate } : {}),
        ...(data.endDate ? { endDate: data.endDate } : {}),
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
      });
      toast.success("Musobaqa yangilandi");
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
      mode="edit"
      challenge={isLoading ? null : challenge}
      isSubmitting={mutations.updateMutation.isPending}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
};

export default EditChallengePage;
