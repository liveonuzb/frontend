const trimSlashes = (value) =>
  String(value ?? "").replace(/^\/+|\/+$/g, "");

export const USER_ONBOARDING_BASE_PATH = "/user/onboarding";
export const COACH_ONBOARDING_BASE_PATH = "/coach/onboarding";

export const getUserOnboardingPath = (step = "") => {
  const normalizedStep = trimSlashes(step).replace(/^coach\/?/, "");
  return normalizedStep
    ? `${USER_ONBOARDING_BASE_PATH}/${normalizedStep}`
    : USER_ONBOARDING_BASE_PATH;
};

export const getUserOnboardingReportPath = () =>
  `${USER_ONBOARDING_BASE_PATH}/report`;

export const getCoachOnboardingPath = (step = "") => {
  const normalizedStep = trimSlashes(step).replace(/^coach\/?/, "");
  return normalizedStep
    ? `${COACH_ONBOARDING_BASE_PATH}/${normalizedStep}`
    : COACH_ONBOARDING_BASE_PATH;
};

export const getOnboardingPathFromStep = (step = "") => {
  const normalizedStep = trimSlashes(step);
  return normalizedStep.startsWith("coach/")
    ? getCoachOnboardingPath(normalizedStep)
    : getUserOnboardingPath(normalizedStep);
};

export const getChatBasePath = (role) =>
  role === "COACH" ? "/coach/chat" : "/user/chat";

export const getChatPath = (role, chatId = "", search = "") => {
  const normalizedChatId = trimSlashes(chatId);
  const normalizedSearch = search
    ? search.startsWith("?")
      ? search
      : `?${search}`
    : "";
  const basePath = getChatBasePath(role);

  if (!normalizedChatId) {
    return `${basePath}${normalizedSearch}`;
  }

  return `${basePath}/${encodeURIComponent(normalizedChatId)}${normalizedSearch}`;
};
