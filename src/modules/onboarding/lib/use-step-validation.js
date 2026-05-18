import { usePostQuery } from "@/hooks/api";
import { getOnboardingValidateStepApiPath } from "./onboarding-api-paths";

const normalizeOnboardingStepForApi = (_type, step) => step;

/**
 * Hook for validating onboarding step on server.
 *
 * @param {string} type - onboarding type
 */
export function useStepValidation(type) {
  const { mutateAsync: validate, isPending } = usePostQuery();

  const validateStep = async (step, data) => {
    try {
      const result = await validate({
        url: getOnboardingValidateStepApiPath(type),
        attributes: {
          step: normalizeOnboardingStepForApi(type, step),
          data,
        },
      });
      return result?.data ?? { valid: true };
    } catch {
      return {
        valid: false,
        unavailable: true,
        errors: {
          server: ["Server validation is temporarily unavailable."],
        },
      };
    }
  };

  return { validateStep, isValidating: isPending };
}
