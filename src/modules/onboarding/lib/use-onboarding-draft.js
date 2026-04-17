import { useEffect, useCallback } from "react";
import { debounce } from "lodash";
import { useGetQuery, usePutQuery } from "@/hooks/api";
import { useOnboardingStore } from "@/store";

/**
 * Hook for auto-saving onboarding draft to server.
 *
 * @param {string} type - "user" | "coach" | "gym" | "shop" | "food"
 * @param {object} options
 * @param {number} options.debounceMs - debounce delay (default 3000)
 * @param {boolean} options.enabled - enable auto-save (default true)
 */
export function useOnboardingDraft(
  type,
  { debounceMs = 3000, enabled = true } = {},
) {
  // 1. Fetch server draft on mount
  const { data: serverDraft, isLoading } = useGetQuery({
    url: `/onboarding/${type}/draft`,
    queryProps: {
      queryKey: ["onboarding-draft", type],
      enabled,
      staleTime: 30000,
    },
  });

  // 2. Auto-save mutation
  const { mutateAsync: saveDraft } = usePutQuery({
    queryKey: ["onboarding-draft", type],
  });

  // 3. Debounced save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (draftData) => {
      try {
        await saveDraft({
          url: `/onboarding/${type}/draft`,
          attributes: draftData,
        });
      } catch (e) {
        // Silent fail -- auto-save should not block UX
        console.warn("Auto-save failed:", e);
      }
    }, debounceMs),
    [type, debounceMs],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return { serverDraft, isLoading, saveDraft: debouncedSave };
}
