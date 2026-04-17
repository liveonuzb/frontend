import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { usePatchQuery } from "@/hooks/api";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";

export const ME_QUERY_KEY = ["me"];

export const PROFILE_SETTINGS_DEFAULTS = {
  language: "uz",
  timezone: "Asia/Tashkent",
  dateFormat: "dd_mm_yyyy",
  theme: "light",
  fontSize: "medium",
  sidebarState: "expanded",
  profilePublic: true,
  showActivity: false,
  allowMessages: true,
  dataSharing: false,
  emailMarketing: true,
  emailWorkout: true,
  pushMeal: true,
  pushWater: false,
  pushProgress: true,
  twoFactorEnabled: false,
};

const setMeCache = (queryClient, user) => {
  queryClient.setQueryData(ME_QUERY_KEY, { data: user });
};

const mergeUserSettings = (user, patch = {}) => {
  const nextSettings = {
    ...PROFILE_SETTINGS_DEFAULTS,
    ...(user?.settings ?? {}),
    ...patch,
  };

  return {
    ...user,
    settings: nextSettings,
    language: nextSettings.language,
    timezone: nextSettings.timezone,
    dateFormat: nextSettings.dateFormat,
  };
};

export const getRequestErrorMessage = (error, fallbackMessage) => {
  const message = get(error, "response.data.message");

  if (Array.isArray(message)) {
    return message[0] ?? fallbackMessage;
  }

  return typeof message === "string" ? message : fallbackMessage;
};

export const useProfileSettings = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const initializeUser = useAuthStore((state) => state.initializeUser);

  const profileMutation = usePatchQuery();
  const generalMutation = usePatchQuery();
  const notificationsMutation = usePatchQuery();
  const privacyMutation = usePatchQuery();
  const securityMutation = usePatchQuery();
  const requestContactChangeMutation = usePostQuery();
  const verifyContactChangeMutation = usePostQuery();

  const syncUser = React.useCallback(
    (nextUser) => {
      if (!nextUser) {
        return null;
      }

      initializeUser(nextUser);
      setMeCache(queryClient, nextUser);
      return nextUser;
    },
    [initializeUser, queryClient],
  );

  const syncSettings = React.useCallback(
    (patch) => {
      if (!user) {
        return null;
      }

      return syncUser(mergeUserSettings(user, patch));
    },
    [syncUser, user],
  );

  const settings = React.useMemo(
    () => ({
      ...PROFILE_SETTINGS_DEFAULTS,
      ...(user?.settings ?? {}),
      language:
        user?.language ??
        user?.settings?.language ??
        PROFILE_SETTINGS_DEFAULTS.language,
      timezone:
        user?.timezone ??
        user?.settings?.timezone ??
        PROFILE_SETTINGS_DEFAULTS.timezone,
      dateFormat:
        user?.dateFormat ??
        user?.settings?.dateFormat ??
        PROFILE_SETTINGS_DEFAULTS.dateFormat,
    }),
    [user],
  );

  const saveProfile = React.useCallback(
    async (payload) => {
      const response = await profileMutation.mutateAsync({
        url: "/users/me",
        attributes: payload,
      });

      return syncUser(get(response, "data"));
    },
    [profileMutation, syncUser],
  );

  const saveGeneralSettings = React.useCallback(
    async (payload) => {
      const response = await generalMutation.mutateAsync({
        url: "/users/me/settings/general",
        attributes: payload,
      });

      return syncSettings(get(response, "data"));
    },
    [generalMutation, syncSettings],
  );

  const saveNotificationSettings = React.useCallback(
    async (payload) => {
      const response = await notificationsMutation.mutateAsync({
        url: "/users/me/settings/notifications",
        attributes: payload,
      });

      return syncSettings(get(response, "data"));
    },
    [notificationsMutation, syncSettings],
  );

  const savePrivacySettings = React.useCallback(
    async (payload) => {
      const response = await privacyMutation.mutateAsync({
        url: "/users/me/settings/privacy",
        attributes: payload,
      });

      return syncSettings(get(response, "data"));
    },
    [privacyMutation, syncSettings],
  );

  const changePassword = React.useCallback(
    async (payload) => {
      const response = await securityMutation.mutateAsync({
        url: "/users/me/security/password",
        attributes: payload,
      });

      return get(response, "data");
    },
    [securityMutation],
  );

  const requestEmailChange = React.useCallback(
    async (email) => {
      const response = await requestContactChangeMutation.mutateAsync({
        url: "/users/me/contact-change/email/request",
        attributes: { email },
      });

      return get(response, "data");
    },
    [requestContactChangeMutation],
  );

  const verifyEmailChange = React.useCallback(
    async (code) => {
      const response = await verifyContactChangeMutation.mutateAsync({
        url: "/users/me/contact-change/email/verify",
        attributes: { code },
      });
      const responseData = get(response, "data");
      const nextUser = get(responseData, "user");

      if (nextUser) {
        syncUser(nextUser);
      }

      return responseData;
    },
    [syncUser, verifyContactChangeMutation],
  );

  const requestPhoneChange = React.useCallback(
    async (phone) => {
      const response = await requestContactChangeMutation.mutateAsync({
        url: "/users/me/contact-change/phone/request",
        attributes: { phone },
      });

      return get(response, "data");
    },
    [requestContactChangeMutation],
  );

  const verifyPhoneChange = React.useCallback(
    async (code) => {
      const response = await verifyContactChangeMutation.mutateAsync({
        url: "/users/me/contact-change/phone/verify",
        attributes: { code },
      });
      const responseData = get(response, "data");
      const nextUser = get(responseData, "user");

      if (nextUser) {
        syncUser(nextUser);
      }

      return responseData;
    },
    [syncUser, verifyContactChangeMutation],
  );

  return {
    user,
    settings,
    saveProfile,
    saveGeneralSettings,
    saveNotificationSettings,
    savePrivacySettings,
    changePassword,
    requestEmailChange,
    verifyEmailChange,
    requestPhoneChange,
    verifyPhoneChange,
    isSavingProfile: profileMutation.isPending,
    isSavingGeneral: generalMutation.isPending,
    isSavingNotifications: notificationsMutation.isPending,
    isSavingPrivacy: privacyMutation.isPending,
    isSavingSecurity: securityMutation.isPending,
    isRequestingContactChange: requestContactChangeMutation.isPending,
    isVerifyingContactChange: verifyContactChangeMutation.isPending,
  };
};

export default useProfileSettings;
