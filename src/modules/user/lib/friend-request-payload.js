export const buildFriendRequestPayload = ({ targetUserId, message } = {}) => {
  const normalizedTargetUserId = String(targetUserId ?? "").trim();
  const normalizedMessage = String(message ?? "").trim();
  const payload = {
    targetUserId: normalizedTargetUserId,
  };

  if (normalizedMessage) {
    payload.message = normalizedMessage;
  }

  return payload;
};
