import { join } from "lodash";
import { api } from "@/hooks/api/use-api";

export const CHALLENGES_QUERY_KEY = ["admin", "challenges"];

export const getChallengeQueryKey = (id) => ["admin", "challenge", String(id)];

export const resolveChallengeApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return join(message, ", ");
  }

  return message || fallback;
};

export const uploadChallengeImage = async (imageFile) => {
  if (!imageFile) {
    return null;
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  const uploadResponse = await api.post("/admin/challenge-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const uploadedImageId = uploadResponse.data?.id ?? null;

  if (!uploadedImageId) {
    throw new Error("Rasm yuklangandan keyin imageId olinmadi");
  }

  return uploadedImageId;
};

export const cleanupChallengeImage = async (imageId) => {
  if (!imageId) {
    return;
  }

  try {
    await api.delete(`/admin/challenge-images/${imageId}`);
  } catch {
    // orphan image cleanup best-effort
  }
};
