import { trim } from "lodash";
export const buildFriendRequestPayload = ({ targetUserId, message } = {}) => {
  const normalizedTargetUserId = trim(String(targetUserId ?? ""));
  const normalizedMessage = trim(String(message ?? ""));
  const payload = {
    targetUserId: normalizedTargetUserId,
  };

  if (normalizedMessage) {
    payload.message = normalizedMessage;
  }

  return payload;
};
