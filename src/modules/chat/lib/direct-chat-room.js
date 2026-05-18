import { api } from "@/hooks/api/use-api.js";
import { getApiResponseData } from "@/lib/api-response.js";

import { trim } from "lodash";

export const findOrCreateDirectChatRoom = async (targetUserId) => {
  const userId = trim(String(targetUserId ?? ""));

  if (!userId) {
    throw new Error("Target user id is required.");
  }

  const response = await api.post("/chat/rooms", { userId });
  const payload = getApiResponseData(response, response?.data);
  const roomId = payload?.roomId;

  if (!roomId) {
    throw new Error("Chat room id was not returned.");
  }

  return roomId;
};
