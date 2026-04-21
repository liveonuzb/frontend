import { usePostQuery } from "@/hooks/api";
import { normalizeOnboardingStepForApi } from "./coach-onboarding-dto";

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
        url: `/onboarding/${type}/validate-step`,
        attributes: {
          step: normalizeOnboardingStepForApi(type, step),
          data,
        },
      });
      return result?.data ?? { valid: true };
    } catch {
      return { valid: true }; // Fail open -- don't block user
    }
  };

  return { validateStep, isValidating: isPending };
}
