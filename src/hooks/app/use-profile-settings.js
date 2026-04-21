import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { usePatchQuery, usePostFileQuery, usePostQuery } from "@/hooks/api";
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

const IMAGE_DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
const IMAGE_EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const isImageDataUrl = (value) =>
  typeof value === "string" && IMAGE_DATA_URL_PATTERN.test(value);

const dataUrlToFile = (dataUrl) => {
  const match = dataUrl.match(IMAGE_DATA_URL_PATTERN);

  if (!match) {
    throw new Error("Avatar must be an image data URL.");
  }

  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const extension = IMAGE_EXTENSION_BY_MIME[mimeType] ?? "jpg";
  return new File([bytes], `avatar-${Date.now()}.${extension}`, {
    type: mimeType,
  });
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
  const avatarUploadMutation = usePostFileQuery({});

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

  const uploadAvatar = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const response = await avatarUploadMutation.mutateAsync({
        url: "/user/media/images",
        attributes: formData,
      });

      return get(response, "data.data") ?? get(response, "data");
    },
    [avatarUploadMutation],
  );

  const saveProfile = React.useCallback(
    async (payload) => {
      const nextPayload = { ...payload };

      if (isImageDataUrl(nextPayload.avatar)) {
        const uploaded = await uploadAvatar(dataUrlToFile(nextPayload.avatar));
        const avatarUrl = uploaded?.url;

        if (!avatarUrl) {
          throw new Error("Avatar upload response is missing URL");
        }

        nextPayload.avatar = avatarUrl;
      }

      const response = await profileMutation.mutateAsync({
        url: "/users/me",
        attributes: nextPayload,
      });

      return syncUser(get(response, "data"));
    },
    [profileMutation, syncUser, uploadAvatar],
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
    uploadAvatar,
    saveGeneralSettings,
    saveNotificationSettings,
    savePrivacySettings,
    changePassword,
    requestPhoneChange,
    verifyPhoneChange,
    isSavingProfile: profileMutation.isPending,
    isUploadingAvatar: avatarUploadMutation.isPending,
    isSavingGeneral: generalMutation.isPending,
    isSavingNotifications: notificationsMutation.isPending,
    isSavingPrivacy: privacyMutation.isPending,
    isSavingSecurity: securityMutation.isPending,
    isRequestingContactChange: requestContactChangeMutation.isPending,
    isVerifyingContactChange: verifyContactChangeMutation.isPending,
  };
};

export default useProfileSettings;
