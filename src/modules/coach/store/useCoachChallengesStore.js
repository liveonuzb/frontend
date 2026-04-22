import { create } from "zustand";
import { api } from "@/hooks/api/use-api";
import { toast } from "sonner";
import { map, filter, find, join } from "lodash";
import { queryClient } from "@/providers/query";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const extractCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const resolveApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return join(message, ", ");
  }

  return message || fallback;
};

export const useCoachChallengesStore = create((set, get) => ({
  challenges: [],
  challengeDetail: null,
  challengeInvitations: [],
  inviteCandidates: [],
  isLoading: false,
  isInvitationsLoading: false,
  isDetailLoading: false,
  actionLoading: {
    creating: false,
    updating: false,
    inviting: false,
    joiningById: {},
    respondingById: {},
  },
  error: null,

  fetchChallenges: async (params = {}, options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const response = await api.get("/challenges", { params });
      set({ challenges: extractCollection(response?.data) });
    } catch (error) {
      console.error("Error fetching challenges:", error);
      set({ error: error.message || "Xatolik yuz berdi" });
      toast.error("Musobaqalarni yuklashda xatolik");
    } finally {
      if (!silent) {
        set({ isLoading: false });
      }
    }
  },

  fetchChallengeDetail: async (id) => {
    if (!id) return null;
    set({ isDetailLoading: true, error: null });
    try {
      const response = await api.get(`/challenges/${id}`);
      const detail = response?.data || null;
      set({ challengeDetail: detail });
      return detail;
    } catch (error) {
      console.error("Error fetching challenge detail:", error);
      set({
        error: error.message || "Xatolik yuz berdi",
        challengeDetail: null,
      });
      toast.error(resolveApiErrorMessage(error, "Challenge topilmadi"));
      return null;
    } finally {
      set({ isDetailLoading: false });
    }
  },

  clearChallengeDetail: () => {
    set({ challengeDetail: null });
  },

  createCustomChallenge: async (data, imageFile, onSuccess) => {
    set((state) => ({
      error: null,
      actionLoading: {
        ...state.actionLoading,
        creating: true,
      },
    }));
    let uploadedImageId = null;
    try {
      const payload = { ...data };

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await api.post("/challenges/images", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedImageId = uploadResponse?.data?.id ?? null;
        if (uploadedImageId) {
          payload.imageId = uploadedImageId;
        }
      }

      await api.post("/challenges", payload);
      toast.success("Maxsus musobaqa yaratildi!");
      await Promise.all([
        get().fetchChallenges({}, { silent: true }),
        get().fetchMyInvitations("PENDING", { silent: true }),
      ]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating custom challenge:", error);
      if (uploadedImageId) {
        try {
          await api.delete(`/challenges/images/${uploadedImageId}`);
        } catch {
          // no-op cleanup attempt
        }
      }
      toast.error(resolveApiErrorMessage(error, "Musobaqa yaratib bo'lmadi"));
      set({ error: error.message });
      throw error;
    } finally {
      set((state) => ({
        actionLoading: {
          ...state.actionLoading,
          creating: false,
        },
      }));
    }
  },

  updateChallenge: async (id, data, onSuccess) => {
    set((state) => ({
      error: null,
      actionLoading: { ...state.actionLoading, updating: true },
    }));
    try {
      await api.patch(`/challenges/${id}`, data);
      await get().fetchChallenges({}, { silent: true });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating challenge:", error);
      toast.error(
        resolveApiErrorMessage(error, "Challengeni yangilab bo'lmadi"),
      );
      set({ error: error.message });
      throw error;
    } finally {
      set((state) => ({
        actionLoading: { ...state.actionLoading, updating: false },
      }));
    }
  },

  joinChallenge: async (id, onSuccess) => {
    if (!id) {
      return;
    }

    const previousState = {
      challenges: ensureArray(get().challenges),
      challengeDetail: get().challengeDetail,
    };

    set((state) => ({
      error: null,
      challenges: map(ensureArray(state.challenges), (challenge) =>
        challenge.id === id ? { ...challenge, isJoined: true } : challenge,
      ),
      challengeDetail:
        state.challengeDetail?.id === id
          ? {
              ...state.challengeDetail,
              isJoined: true,
            }
          : state.challengeDetail,
      actionLoading: {
        ...state.actionLoading,
        joiningById: {
          ...state.actionLoading.joiningById,
          [id]: true,
        },
      },
    }));

    try {
      await api.post(`/challenges/${id}/join`);
      toast.success("Siz musobaqaga muvaffaqiyatli qo'shildingiz!");
      void Promise.all([
        get().fetchChallenges({}, { silent: true }),
        get().fetchMyInvitations("PENDING", { silent: true }),
        invalidateGamificationQueries(queryClient),
      ]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error(resolveApiErrorMessage(error, "Qo'shilishda xatolik"));
      set({
        error: error.message,
        challenges: previousState.challenges,
        challengeDetail: previousState.challengeDetail,
      });
      throw error;
    } finally {
      set((state) => ({
        actionLoading: {
          ...state.actionLoading,
          joiningById: {
            ...state.actionLoading.joiningById,
            [id]: false,
          },
        },
      }));
    }
  },

  fetchMyInvitations: async (status, options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      set({ isInvitationsLoading: true, error: null });
    } else {
      set({ error: null });
    }

    try {
      const response = await api.get("/challenges/invitations/me", {
        params: status ? { status } : undefined,
      });
      set({ challengeInvitations: extractCollection(response?.data) });
    } catch (error) {
      console.error("Error fetching challenge invitations:", error);
      set({ error: error.message || "Xatolik yuz berdi" });
      toast.error("Taklifnomalarni yuklashda xatolik");
    } finally {
      if (!silent) {
        set({ isInvitationsLoading: false });
      }
    }
  },

  fetchInviteCandidates: async (challengeId, query = "") => {
    if (!challengeId) {
      set({ inviteCandidates: [] });
      return;
    }

    try {
      const response = await api.get(
        `/challenges/${challengeId}/invite-candidates`,
        {
          params: query ? { q: query } : undefined,
        },
      );
      const payload = response?.data?.data ?? response?.data;
      set({ inviteCandidates: extractCollection(payload) });
    } catch (error) {
      console.error("Error fetching challenge invite candidates:", error);
      toast.error("Nomzodlarni yuklashda xatolik");
    }
  },

  clearInviteCandidates: () => {
    set({ inviteCandidates: [] });
  },

  searchInviteCandidates: async (challengeId, query = "") =>
    get().fetchInviteCandidates(challengeId, query),

  inviteUsersToChallenge: async ({ challengeId, userIds = [] }, onSuccess) => {
    set((state) => ({
      error: null,
      actionLoading: {
        ...state.actionLoading,
        inviting: true,
      },
    }));

    try {
      await api.post(`/challenges/${challengeId}/invite`, { userIds });
      toast.success("Taklifnomalar yuborildi");
      await Promise.all([
        get().fetchChallenges({}, { silent: true }),
        get().fetchMyInvitations("PENDING", { silent: true }),
      ]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error inviting users to challenge:", error);
      toast.error(resolveApiErrorMessage(error, "Taklif yuborilmadi"));
      set({ error: error.message });
      throw error;
    } finally {
      set((state) => ({
        actionLoading: {
          ...state.actionLoading,
          inviting: false,
        },
      }));
    }
  },

  inviteFriends: async (challengeId, payload = {}, onSuccess) =>
    get().inviteUsersToChallenge(
      {
        challengeId,
        ...payload,
      },
      onSuccess,
    ),

  respondToInvitation: async (invitationId, status, onSuccess) => {
    if (!invitationId) {
      return;
    }

    set((state) => ({
      error: null,
      actionLoading: {
        ...state.actionLoading,
        respondingById: {
          ...state.actionLoading.respondingById,
          [invitationId]: true,
        },
      },
    }));

    try {
      await api.patch(`/challenges/invitations/${invitationId}/respond`, {
        status,
      });
      toast.success(
        status === "ACCEPTED"
          ? "Taklif qabul qilindi"
          : "Taklif rad etildi",
      );
      await Promise.all([
        get().fetchMyInvitations("PENDING", { silent: true }),
        get().fetchChallenges({}, { silent: true }),
        ...(status === "ACCEPTED"
          ? [invalidateGamificationQueries(queryClient)]
          : []),
      ]);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast.error(resolveApiErrorMessage(error, "Javob yuborilmadi"));
      set({ error: error.message });
      throw error;
    } finally {
      set((state) => ({
        actionLoading: {
          ...state.actionLoading,
          respondingById: {
            ...state.actionLoading.respondingById,
            [invitationId]: false,
          },
        },
      }));
    }
  },

  getInvitationById: (invitationId) =>
    find(get().challengeInvitations, { id: invitationId }) || null,

  getPendingInvitations: () =>
    filter(get().challengeInvitations, { status: "PENDING" }),
}));

export const useChallengeStore = useCoachChallengesStore;

export default useCoachChallengesStore;
