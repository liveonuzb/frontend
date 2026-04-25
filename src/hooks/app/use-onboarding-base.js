import useAppModeTheme from "@/hooks/app/use-app-mode-theme";

/**
 * Returns the base URL for onboarding illustration assets.
 * Automatically resolves to the correct mode folder.
 *
 * Usage:
 *   const base = useOnboardingBase();
 *   const src = `${base}/male-3.webp`;
 */
const useOnboardingBase = () => useAppModeTheme().assets.onboardingBase;

export default useOnboardingBase;
