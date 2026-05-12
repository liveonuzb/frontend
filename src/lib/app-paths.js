const trimSlashes = (value) =>
  String(value ?? "").replace(/^\/+|\/+$/g, "");

export const USER_ONBOARDING_BASE_PATH = "/user/onboarding";
export const COACH_ONBOARDING_BASE_PATH = "/coach/onboarding";

export const ONBOARDING_FLOW_STATUS = {
  draft: "DRAFT",
  submitted: "SUBMITTED",
  personalizing: "PERSONALIZING",
  personalizationReady: "PERSONALIZATION_READY",
  personalizationFailed: "PERSONALIZATION_FAILED",
  resultConfirmed: "RESULT_CONFIRMED",
  planGenerating: "PLAN_GENERATING",
  planReady: "PLAN_READY",
  planFailed: "PLAN_FAILED",
  activated: "ACTIVATED",
};

export const getUserOnboardingPath = (step = "") => {
  const normalizedStep = trimSlashes(step).replace(/^coach\/?/, "");
  return normalizedStep
    ? `${USER_ONBOARDING_BASE_PATH}/${normalizedStep}`
    : USER_ONBOARDING_BASE_PATH;
};

export const getUserOnboardingReportPath = () =>
  `${USER_ONBOARDING_BASE_PATH}/report`;

export const getUserOnboardingPersonalizingPath = (jobId = "") => {
  const normalizedJobId = trimSlashes(jobId);
  return normalizedJobId
    ? `${USER_ONBOARDING_BASE_PATH}/metabolism-calculating/${encodeURIComponent(normalizedJobId)}`
    : `${USER_ONBOARDING_BASE_PATH}/metabolism-calculating`;
};

export const getUserOnboardingResultPath = () =>
  `${USER_ONBOARDING_BASE_PATH}/metabolism-result`;

export const getUserOnboardingPlanPreviewPath = () =>
  `${USER_ONBOARDING_BASE_PATH}/plan-preview`;

export const getUserOnboardingGeneratingPath = (jobId = "") => {
  const normalizedJobId = trimSlashes(jobId);
  return normalizedJobId
    ? `${USER_ONBOARDING_BASE_PATH}/plan-generating/${encodeURIComponent(normalizedJobId)}`
    : `${USER_ONBOARDING_BASE_PATH}/plan-generating`;
};

export const getUserOnboardingPlanReadyPath = () =>
  `${USER_ONBOARDING_BASE_PATH}/plan-ready`;

export const canAccessUserDashboard = (status, onboardingCompleted = false) => {
  if (!status) {
    return Boolean(onboardingCompleted);
  }

  return (
    status === ONBOARDING_FLOW_STATUS.planReady ||
    status === ONBOARDING_FLOW_STATUS.activated
  );
};

export const getPostOnboardingPath = (user = {}) => {
  const status = user?.onboardingFlowStatus ?? user?.onboarding?.flowStatus;
  const personalizationJobId =
    user?.latestPersonalizationJobId ??
    user?.onboarding?.latestPersonalizationJobId;
  const planJobId =
    user?.latestPlanGenerationJobId ?? user?.onboarding?.latestPlanGenerationJobId;

  switch (status) {
    case ONBOARDING_FLOW_STATUS.submitted:
    case ONBOARDING_FLOW_STATUS.personalizing:
    case ONBOARDING_FLOW_STATUS.personalizationFailed:
      return getUserOnboardingPersonalizingPath(personalizationJobId);
    case ONBOARDING_FLOW_STATUS.personalizationReady:
      return getUserOnboardingResultPath();
    case ONBOARDING_FLOW_STATUS.resultConfirmed:
      return getUserOnboardingPlanPreviewPath();
    case ONBOARDING_FLOW_STATUS.planGenerating:
    case ONBOARDING_FLOW_STATUS.planFailed:
      return getUserOnboardingGeneratingPath(planJobId);
    case ONBOARDING_FLOW_STATUS.planReady:
      return getUserOnboardingPlanReadyPath();
    case ONBOARDING_FLOW_STATUS.activated:
      return "/user";
    case ONBOARDING_FLOW_STATUS.draft:
    default:
      return getUserOnboardingPath();
  }
};

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
