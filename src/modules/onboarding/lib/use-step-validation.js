import { usePostQuery } from "@/hooks/api";
import { normalizeOnboardingStepForApi } from "./coach-onboarding-dto";
import { getOnboardingValidateStepApiPath } from "./onboarding-api-paths";

/**
 * Hook for validating onboarding step on server.
 *
 * @param {string} type - "user" | "coach" | "gym" | "shop" | "food"
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
