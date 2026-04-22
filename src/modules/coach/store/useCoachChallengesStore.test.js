import { afterEach, describe, expect, it, vi } from "vitest";
import { useCoachChallengesStore } from "./useCoachChallengesStore.js";

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock("@/hooks/api/use-api", () => ({
  api: {
    get: mocks.apiGet,
    post: vi.fn(),
    patch: vi.fn(),
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
});
