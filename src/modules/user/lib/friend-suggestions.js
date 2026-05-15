const getUserName = (user) => {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user?.name || user?.username || "Foydalanuvchi";
};

const normalizeSuggestionUser = (user, overrides = {}) => ({
  ...user,
  id: user?.id,
  name: getUserName(user),
  username: user?.username ?? null,
  avatarUrl: user?.avatarUrl ?? user?.avatar ?? null,
  friendshipStatus: user?.friendshipStatus ?? null,
  requestId: null,
  ...overrides,
});

export const buildFriendSuggestionRows = ({
  suggestions = [],
  sourceUsers,
  outgoingRequests = [],
  friends = [],
  incomingRequests = [],
  includeOutgoingRows = true,
} = {}) => {
  const sourceItems = sourceUsers ?? suggestions;
  const friendIds = new Set(friends.map((friend) => friend?.id).filter(Boolean));
  const incomingIds = new Set(
    incomingRequests
      .map((request) => request?.requester?.id)
      .filter(Boolean),
  );
  const outgoingByUserId = new Map(
    outgoingRequests
      .filter((request) => request?.addressee?.id)
      .map((request) => [request.addressee.id, request]),
  );
  const rowsById = new Map();

  const addRow = (user, overrides = {}) => {
    if (!user?.id || friendIds.has(user.id) || incomingIds.has(user.id)) {
      return;
    }

    if (!rowsById.has(user.id)) {
      rowsById.set(user.id, normalizeSuggestionUser(user, overrides));
    }
  };

  if (includeOutgoingRows) {
    outgoingRequests.forEach((request) => {
      addRow(request?.addressee, {
        friendshipStatus: "request_sent",
        requestId: request?.id ?? null,
      });
    });
  }

  sourceItems.forEach((user) => {
    const outgoingRequest = outgoingByUserId.get(user?.id);
    const friendshipStatus =
      outgoingRequest || user?.friendshipStatus === "request_sent"
        ? "request_sent"
        : user?.friendshipStatus ?? null;

    if (
      friendshipStatus === "friends" ||
      friendshipStatus === "request_received"
    ) {
      return;
    }

    addRow(user, {
      friendshipStatus,
      requestId: outgoingRequest?.id ?? user?.requestId ?? null,
    });
  });

  return Array.from(rowsById.values());
};
