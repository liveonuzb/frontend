import { afterEach, describe, expect, it, vi } from "vitest";
import { useCoachChallengesStore } from "./useCoachChallengesStore.js";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@/hooks/api/use-api", () => ({
  api: {
    get: mocks.apiGet,
    post: mocks.apiPost,
    patch: mocks.apiPatch,
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

vi.mock("@/providers/query", () => ({
  queryClient: {
    invalidateQueries: mocks.invalidateQueries,
  },
}));

describe("useCoachChallengesStore endpoints", () => {
  afterEach(() => {
    vi.clearAllMocks();
    useCoachChallengesStore.setState({
      challengeInvitations: [],
      inviteCandidates: [],
      error: null,
      isInvitationsLoading: false,
    });
  });

  it("fetches my challenge invitations from the backend route", async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        data: [{ id: "invitation-1" }],
      },
    });

    await useCoachChallengesStore
      .getState()
      .fetchMyInvitations("PENDING", { silent: true });

    expect(mocks.apiGet).toHaveBeenCalledWith("/challenges/invitations/me", {
      params: { status: "PENDING" },
    });
    expect(useCoachChallengesStore.getState().challengeInvitations).toEqual([
      { id: "invitation-1" },
    ]);
  });

  it("fetches invite candidates for a specific challenge", async () => {
    mocks.apiGet.mockResolvedValue({
      data: {
        data: [{ id: "user-1" }],
      },
    });

    await useCoachChallengesStore
      .getState()
      .searchInviteCandidates("challenge-1", "fazliddin");

    expect(mocks.apiGet).toHaveBeenCalledWith(
      "/challenges/challenge-1/invite-candidates",
      {
        params: { q: "fazliddin" },
      },
    );
    expect(useCoachChallengesStore.getState().inviteCandidates).toEqual([
      { id: "user-1" },
    ]);
  });

  it("sends challenge invitations to the backend invitations route", async () => {
    mocks.apiPost.mockResolvedValue({ data: { ok: true } });
    mocks.apiGet.mockResolvedValue({ data: { data: [] } });

    await useCoachChallengesStore.getState().inviteFriends("challenge-1", {
      userIds: ["user-1", "user-2"],
    });

    expect(mocks.apiPost).toHaveBeenCalledWith(
      "/challenges/challenge-1/invitations",
      {
        userIds: ["user-1", "user-2"],
      },
    );
  });

  it("responds to challenge invitations through the backend respond route", async () => {
    mocks.apiPost.mockResolvedValue({ data: { ok: true } });
    mocks.apiGet.mockResolvedValue({ data: { data: [] } });

    await useCoachChallengesStore
      .getState()
      .respondToInvitation("invitation-1", "ACCEPTED");

    expect(mocks.apiPost).toHaveBeenCalledWith(
      "/challenges/invitations/invitation-1/respond",
      { status: "ACCEPTED" },
    );
    expect(mocks.apiPatch).not.toHaveBeenCalled();
  });
});
