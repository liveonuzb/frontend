import { useCallback, useMemo } from "react";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";

export const getOnboardingAssetPath = (
  base,
  name,
  extension = "webp",
) => `${base}/${name}.${extension}`;

export const useOnboardingAssets = () => {
  const theme = useAppModeTheme();
  const { onboardingBase, onboardingImageExtension = "webp", curious } =
    theme.assets;
  const asset = useCallback(
    (name) =>
      getOnboardingAssetPath(onboardingBase, name, onboardingImageExtension),
    [onboardingBase, onboardingImageExtension],
  );

  return useMemo(
    () => ({
      base: onboardingBase,
      extension: onboardingImageExtension,
      curious,
      asset,
    }),
    [asset, curious, onboardingBase, onboardingImageExtension],
  );
};

/**
 * Returns the base URL for onboarding illustration assets.
 * Automatically resolves to the correct mode folder.
 *
 * Usage:
 *   const { asset } = useOnboardingAssets();
 *   const src = asset("male-3");
 */
const useOnboardingBase = () => useOnboardingAssets().base;

export default useOnboardingBase;
