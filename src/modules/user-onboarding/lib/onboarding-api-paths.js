export const getOnboardingDraftApiBase = (type) => {
  if (type === "user") {
    return "/user/onboarding/user";
  }

  return `/onboarding/${type}`;
};

export const getOnboardingDraftApiPath = (type) =>
  `${getOnboardingDraftApiBase(type)}/draft`;

export const getOnboardingValidateStepApiPath = (type) =>
  `${getOnboardingDraftApiBase(type)}/validate-step`;
