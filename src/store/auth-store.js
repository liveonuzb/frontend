import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { includes } from "lodash";
import { normalizeRoles } from "@/lib/roles";

const defaultRoles = [];
const rolePriority = ["SUPER_ADMIN", "COACH", "USER"];

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
  pendingVerification: null,
  passwordReset: null,
  isHydrated: false,
};

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
        const nextRoles = normalizeRoles(authData?.roles ?? authData?.user?.roles);
        const currentRole = get().activeRole;

        set(() => ({
          isAuthenticated: true,
          token: authData?.accessToken ?? null,
          refreshToken: authData?.refreshToken ?? null,
          user: authData?.user ?? null,
          roles: nextRoles,
          activeRole: getNextActiveRole(nextRoles, currentRole),
          onboardingCompleted: Boolean(authData?.user?.onboardingCompleted),
          pendingVerification: null,
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

      setPendingVerification: (payload) => {
        set(() => ({
          pendingVerification: payload,
        }));
      },

      clearPendingVerification: () => {
        set(() => ({
          pendingVerification: null,
        }));
      },

      setPasswordReset: (payload) => {
        set(() => ({
          passwordReset: payload,
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
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      migrate: (persistedState, version) => {
        if (version !== 3) {
          return initialState;
        }

        return persistedState;
      },
    },
  ),
);

export default useAuthStore;
