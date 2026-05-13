import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { includes } from "lodash";
import { normalizeRoles } from "@/lib/roles";

const defaultRoles = [];
const rolePriority = [
  "SUPER_ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT",
  "FINANCE",
  "GROWTH",
  "READONLY_ADMIN",
  "COACH",
  "USER",
];

const getNextActiveRole = (roles, currentRole) => {
  if (currentRole && includes(roles, currentRole)) {
    return currentRole;
  }

  const prioritizedRole = rolePriority.find((role) => includes(roles, role));
  if (prioritizedRole) {
    return prioritizedRole;
  }

  return roles[0] ?? null;
};

const initialState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null,
  roles: defaultRoles,
  activeRole: null,
  onboardingCompleted: false,
  onboardingFlowStatus: null,
  onboardingNextPath: null,
  latestPersonalizationJobId: null,
  latestPlanGenerationJobId: null,
  pendingVerification: null,
  authPhoneFlow: null,
  passwordReset: null,
  isHydrated: false,
};

const authStorageKey = "auth-storage";
const noopAuthStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const getAuthStorage = () => {
  if (typeof window === "undefined") {
    return noopAuthStorage;
  }

  try {
    window.localStorage?.removeItem(authStorageKey);
  } catch {
    // Ignore storage access errors in restricted browser contexts.
  }

  return window.sessionStorage;
};

const sanitizePendingVerification = (payload) =>
  payload
    ? {
        channel: payload.channel ?? null,
        purpose: payload.purpose ?? null,
        phone: payload.phone ?? null,
        expiresAt: payload.expiresAt ?? null,
      }
    : null;

const sanitizeAuthPhoneFlow = (payload) =>
  payload
    ? {
        phone: payload.phone,
        flow: payload.flow,
        referralCode: payload.referralCode ?? null,
      }
    : null;

const sanitizePasswordReset = (payload) =>
  payload
    ? {
        resetToken: payload.resetToken ?? null,
        expiresAt: payload.expiresAt ?? null,
        phone: payload.phone ?? null,
      }
    : null;

const persistAuthState = (state) => ({
  isAuthenticated: state.isAuthenticated,
  token: state.token,
  refreshToken: state.refreshToken,
  user: state.user,
  roles: state.roles,
  activeRole: state.activeRole,
  onboardingCompleted: state.onboardingCompleted,
  onboardingFlowStatus: state.onboardingFlowStatus,
  onboardingNextPath: state.onboardingNextPath,
  latestPersonalizationJobId: state.latestPersonalizationJobId,
  latestPlanGenerationJobId: state.latestPlanGenerationJobId,
});

const useAuthStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      logout: () => {
        set((state) => ({
          ...initialState,
          isHydrated: state.isHydrated,
        }));
      },

      initializeAuth: (token, refreshToken, roles) => {
        if (!token || !refreshToken) {
          set(() => ({
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            roles: [],
            activeRole: null,
          }));
          return;
        }

        const nextRoles = normalizeRoles(roles ?? get().roles);
        const currentRole = get().activeRole;
        const nextActiveRole = getNextActiveRole(nextRoles, currentRole);

        set(() => ({
          isAuthenticated: true,
          token,
          refreshToken,
          roles: nextRoles,
          activeRole: nextActiveRole,
        }));
      },

      completeAuthentication: (authData) => {
        const nextRoles = normalizeRoles(
          authData?.roles ?? authData?.user?.roles,
        );
        const currentRole = get().activeRole;

        set(() => ({
          isAuthenticated: true,
          token: authData?.accessToken ?? null,
          refreshToken: authData?.refreshToken ?? null,
          user: authData?.user ?? null,
          roles: nextRoles,
          activeRole: getNextActiveRole(nextRoles, currentRole),
          onboardingCompleted: Boolean(authData?.user?.onboardingCompleted),
          onboardingFlowStatus: authData?.user?.onboardingFlowStatus ?? null,
          onboardingNextPath: authData?.user?.onboardingNextPath ?? null,
          latestPersonalizationJobId:
            authData?.user?.latestPersonalizationJobId ?? null,
          latestPlanGenerationJobId:
            authData?.user?.latestPlanGenerationJobId ?? null,
          pendingVerification: null,
          authPhoneFlow: null,
          passwordReset: null,
        }));
      },

      initializeUser: (userData) => {
        const hasUserRoles = Array.isArray(userData?.roles);
        const nextRoles = normalizeRoles(
          hasUserRoles ? userData.roles : get().roles,
        );

        set(() => ({
          user: userData,
          roles: nextRoles,
          activeRole: getNextActiveRole(nextRoles, get().activeRole),
          onboardingCompleted: Boolean(userData?.onboardingCompleted),
          onboardingFlowStatus: userData?.onboardingFlowStatus ?? null,
          onboardingNextPath: userData?.onboardingNextPath ?? null,
          latestPersonalizationJobId:
            userData?.latestPersonalizationJobId ?? null,
          latestPlanGenerationJobId:
            userData?.latestPlanGenerationJobId ?? null,
        }));
      },

      setRoles: (roles) => {
        const normalizedRoles = normalizeRoles(roles);
        const currentRole = get().activeRole;
        const nextActiveRole = getNextActiveRole(normalizedRoles, currentRole);

        set(() => ({
          roles: normalizedRoles,
          activeRole: nextActiveRole,
        }));
      },

      setActiveRole: (role) => {
        set(() => ({
          activeRole: role,
        }));
      },

      setOnboardingCompleted: (completed) => {
        set((state) => ({
          onboardingCompleted: completed,
          user: state.user
            ? {
                ...state.user,
                onboardingCompleted: completed,
              }
            : state.user,
        }));
      },

      setOnboardingFlow: (payload = {}) => {
        set((state) => ({
          onboardingFlowStatus:
            payload.onboardingFlowStatus ??
            payload.flowStatus ??
            payload.status ??
            state.onboardingFlowStatus,
          onboardingNextPath:
            payload.onboardingNextPath ??
            payload.nextPath ??
            state.onboardingNextPath,
          latestPersonalizationJobId:
            payload.latestPersonalizationJobId ??
            payload.personalizationJobId ??
            state.latestPersonalizationJobId,
          latestPlanGenerationJobId:
            payload.latestPlanGenerationJobId ??
            payload.planGenerationJobId ??
            state.latestPlanGenerationJobId,
          user: state.user
            ? {
                ...state.user,
                onboardingFlowStatus:
                  payload.onboardingFlowStatus ??
                  payload.flowStatus ??
                  payload.status ??
                  state.user.onboardingFlowStatus,
                onboardingNextPath:
                  payload.onboardingNextPath ??
                  payload.nextPath ??
                  state.user.onboardingNextPath,
                latestPersonalizationJobId:
                  payload.latestPersonalizationJobId ??
                  payload.personalizationJobId ??
                  state.user.latestPersonalizationJobId,
                latestPlanGenerationJobId:
                  payload.latestPlanGenerationJobId ??
                  payload.planGenerationJobId ??
                  state.user.latestPlanGenerationJobId,
              }
            : state.user,
        }));
      },

      setPendingVerification: (payload) => {
        set(() => ({
          pendingVerification: sanitizePendingVerification(payload),
        }));
      },

      clearPendingVerification: () => {
        set(() => ({
          pendingVerification: null,
        }));
      },

      setAuthPhoneFlow: (payload) => {
        set(() => ({
          authPhoneFlow: sanitizeAuthPhoneFlow(payload),
        }));
      },

      clearAuthPhoneFlow: () => {
        set(() => ({
          authPhoneFlow: null,
        }));
      },

      setPasswordReset: (payload) => {
        set(() => ({
          passwordReset: sanitizePasswordReset(payload),
        }));
      },

      clearPasswordReset: () => {
        set(() => ({
          passwordReset: null,
        }));
      },

      setHydrated: (value) => {
        set(() => ({
          isHydrated: value,
        }));
      },
    }),
    {
      name: authStorageKey,
      storage: createJSONStorage(getAuthStorage),
      version: 4,
      partialize: persistAuthState,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      migrate: (persistedState, version) => {
        if (version !== 4) {
          return initialState;
        }

        return persistedState;
      },
    },
  ),
);

export default useAuthStore;
