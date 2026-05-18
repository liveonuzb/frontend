import { filter, forEach, map, trim } from "lodash";
const getUserName = (user) => {
  const fullName = trim(filter([user?.firstName, user?.lastName], Boolean)
    .join(" "));

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
  const friendIds = new Set(filter(map(friends, (friend) => friend?.id), Boolean));
  const incomingIds = new Set(
    filter(map(incomingRequests, (request) => request?.requester?.id), Boolean),
  );
  const outgoingByUserId = new Map(
    map(filter(outgoingRequests, (request) => request?.addressee?.id), (request) => [request.addressee.id, request]),
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
    forEach(outgoingRequests, (request) => {
      addRow(request?.addressee, {
        friendshipStatus: "request_sent",
        requestId: request?.id ?? null,
      });
    });
  }

  forEach(sourceItems, (user) => {
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
