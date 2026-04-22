import React from "react";
import { useNavigate, useParams } from "react-router";
import { get } from "lodash";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import AchievementFormDrawer from "../form-drawer";
import {
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  buildAchievementPayload,
  getAdminAchievementQueryKey,
  normalizeAchievementForm,
  resolveAchievementApiErrorMessage,
} from "../api";

const EditAchievementPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = React.useState(null);

  const { data, isLoading } = useGetQuery({
    url: `/admin/achievements/${id}`,
    queryProps: {
      queryKey: getAdminAchievementQueryKey(id),
      enabled: Boolean(id),
    },
  });

  const mutation = usePatchQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });

  const achievement = get(data, "data", null);

  React.useEffect(() => {
    if (achievement) {
      setFormData(normalizeAchievementForm(achievement));
    }
  }, [achievement]);

  const handleFieldChange = React.useCallback((field, value) => {
    setFormData((current) => ({
      ...(current ?? normalizeAchievementForm()),
      [field]: value,
    }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!id || !formData) {
      return;
    }

    try {
      await mutation.mutateAsync({
        url: `/admin/achievements/${id}`,
        attributes: buildAchievementPayload(formData),
      });
      toast.success("Achievement yangilandi.");
      navigate("/admin/achievements/list", { replace: true });
    } catch (error) {
      if (error instanceof Error && !error?.response) {
        toast.error(error.message);
        return;
      }

      toast.error(
        resolveAchievementApiErrorMessage(
          error,
          "Achievementni yangilab bo'lmadi.",
        ),
      );
    }
  }, [formData, id, mutation, navigate]);

  return (
    <AchievementFormDrawer
      open
      onOpenChange={(open) => {
        if (!open) {
          navigate("/admin/achievements/list", { replace: true });
        }
      }}
      title="Achievementni tahrirlash"
      description="Achievementning asosiy maydonlarini yangilang."
      formData={formData ?? normalizeAchievementForm()}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      isLoading={isLoading && !formData}
      submitLabel="Saqlash"
    />
  );
};

export default EditAchievementPage;
