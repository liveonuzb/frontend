import { create } from "zustand";
import { get, isArray, map, omit } from "lodash";
import { api } from "@/hooks/api/use-api";

const unwrapResponse = (response) =>
  get(response, "data.data") ?? get(response, "data") ?? response;

const unwrapList = (response) => {
  const data = unwrapResponse(response);
  const items =
    get(data, "items") ??
    get(data, "challenges") ??
    get(data, "invitations") ??
    get(data, "users") ??
    get(data, "data");

  return isArray(items) ? items : isArray(data) ? data : [];
};

const unwrapEntity = (response, key) => {
  const data = unwrapResponse(response);
  return get(data, key) ?? data;
};

const setActionFlag = (set, key, value) => {
  set((state) => ({
    actionLoading: {
      ...state.actionLoading,
      [key]: value,
    },
  }));
};

const setActionById = (set, key, id, value) => {
  set((state) => ({
    actionLoading: {
      ...state.actionLoading,
      [key]: value
        ? { ...get(state, `actionLoading.${key}`, {}), [id]: true }
        : omit(get(state, `actionLoading.${key}`, {}), [id]),
    },
  }));
};

export const useChallengeStore = create((set, getState) => ({
  challenges: [],
  challengeInvitations: [],
  inviteCandidates: [],
  challengeDetail: null,
  isLoading: false,
  isDetailLoading: false,
  isSearchingInviteCandidates: false,
  actionLoading: {
    joiningById: {},
    respondingById: {},
    creating: false,
    updating: false,
    inviting: false,
  },

  fetchChallenges: async (params = {}) => {
    set({ isLoading: true });
    try {
      const response = await api.get("/challenges", { params });
      const challenges = unwrapList(response);
      set({ challenges, isLoading: false });
      return challenges;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchChallengeDetail: async (challengeId) => {
    if (!challengeId) return null;

    set({ isDetailLoading: true });
    try {
      const response = await api.get(`/challenges/${challengeId}`);
      const challengeDetail = unwrapEntity(response, "challenge");
      set({ challengeDetail, isDetailLoading: false });
      return challengeDetail;
    } catch (error) {
      set({ isDetailLoading: false });
      throw error;
    }
  },

  clearChallengeDetail: () => set({ challengeDetail: null }),

  joinChallenge: async (challengeId) => {
    setActionById(set, "joiningById", challengeId, true);
    try {
      const response = await api.post(`/challenges/${challengeId}/join`);
      return unwrapEntity(response, "challenge");
    } finally {
      setActionById(set, "joiningById", challengeId, false);
    }
  },

  fetchMyInvitations: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get("/challenges/invitations/me", { params });
    const challengeInvitations = unwrapList(response);
    set({ challengeInvitations });
    return challengeInvitations;
  },

  searchInviteCandidates: async (challengeId, search = "") => {
    if (!challengeId) {
      set({ inviteCandidates: [] });
      return [];
    }

    set({ isSearchingInviteCandidates: true });
    try {
      const response = await api.get(
        `/challenges/${challengeId}/invite-candidates`,
        { params: { search } },
      );
      const inviteCandidates = unwrapList(response);
      set({ inviteCandidates, isSearchingInviteCandidates: false });
      return inviteCandidates;
    } catch (error) {
      set({ isSearchingInviteCandidates: false });
      throw error;
    }
  },

  inviteFriends: async (challengeId, payload = {}) => {
    setActionFlag(set, "inviting", true);
    try {
      const response = await api.post(
        `/challenges/${challengeId}/invitations`,
        payload,
      );
      await getState().fetchMyInvitations();
      return unwrapResponse(response);
    } finally {
      setActionFlag(set, "inviting", false);
    }
  },

  respondToInvitation: async (invitationId, action) => {
    setActionById(set, "respondingById", invitationId, true);
    try {
      const response = await api.post(
        `/challenges/invitations/${invitationId}/respond`,
        { action },
      );
      const updatedInvitation = unwrapEntity(response, "invitation");
      set((state) => ({
        challengeInvitations: map(state.challengeInvitations, (invitation) =>
          invitation.id === invitationId
            ? { ...invitation, ...updatedInvitation }
            : invitation,
        ),
      }));
      return updatedInvitation;
    } finally {
      setActionById(set, "respondingById", invitationId, false);
    }
  },

  createCustomChallenge: async (payload = {}) => {
    setActionFlag(set, "creating", true);
    try {
      const response = await api.post("/challenges", payload);
      const challenge = unwrapEntity(response, "challenge");
      await getState().fetchChallenges();
      return challenge;
    } finally {
      setActionFlag(set, "creating", false);
    }
  },

  updateChallenge: async (challengeId, payload = {}) => {
    setActionFlag(set, "updating", true);
    try {
      const response = await api.patch(`/challenges/${challengeId}`, payload);
      const challenge = unwrapEntity(response, "challenge");
      set((state) => ({
        challengeDetail:
          get(state, "challengeDetail.id") === challengeId
            ? { ...state.challengeDetail, ...challenge }
            : state.challengeDetail,
        challenges: map(state.challenges, (item) =>
          item.id === challengeId ? { ...item, ...challenge } : item,
        ),
      }));
      return challenge;
    } finally {
      setActionFlag(set, "updating", false);
    }
  },
}));

export default useChallengeStore;
