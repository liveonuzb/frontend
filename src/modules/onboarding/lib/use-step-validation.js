import { usePostQuery } from "@/hooks/api";

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
        attributes: { step, data },
      });
      return result?.data ?? { valid: true };
    } catch (e) {
      return { valid: true }; // Fail open -- don't block user
    }
  };

  return { validateStep, isValidating: isPending };
}
