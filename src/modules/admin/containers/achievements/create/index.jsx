import React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import AchievementFormDrawer from "../form-drawer";
import {
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  buildAchievementPayload,
  createEmptyAchievementForm,
  resolveAchievementApiErrorMessage,
} from "../api";

const CreateAchievementPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState(createEmptyAchievementForm);
  const mutation = usePostQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });

  const handleFieldChange = React.useCallback((field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    try {
      await mutation.mutateAsync({
        url: "/admin/achievements",
        attributes: buildAchievementPayload(formData),
      });
      toast.success("Achievement yaratildi.");
      navigate("/admin/achievements/list", { replace: true });
    } catch (error) {
      if (error instanceof Error && !error?.response) {
        toast.error(error.message);
        return;
      }

      toast.error(
        resolveAchievementApiErrorMessage(
          error,
          "Achievement yaratib bo'lmadi.",
        ),
      );
    }
  }, [formData, mutation, navigate]);

  return (
    <AchievementFormDrawer
      open
      onOpenChange={(open) => {
        if (!open) {
          navigate("/admin/achievements/list", { replace: true });
        }
      }}
      title="Yangi achievement"
      description="Achievement ma'lumotlarini kiriting."
      formData={formData}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      submitLabel="Yaratish"
    />
  );
};

export default CreateAchievementPage;
