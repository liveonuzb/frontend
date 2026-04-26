import { APP_MODES } from "@/store/app-mode-store";

/**
 * Visual theme tokens for each app mode.
 *
 * Tokens drive:
 *  - Auth marketing panel (heroGradient, heroTextShadow, waveColor)
 *  - Auth left-column background aura (pageTint, accent classes)
 *  - Mode-accent buttons / highlights (buttonTone, dotTone, border, badgeTone)
 */
export const APP_MODE_THEMES = {
  [APP_MODES.FOCUS]: {
    key: APP_MODES.FOCUS,
    label: "Focus",
    assets: {
      logo: "/focus/logo-main.png",
      background: "/madagascar/background.webp",
      curious: "/madagascar/curious.webp",
      notFound: "/madagascar/not-found-crop-male.webp",
      onboardingBase: "/madagascar/onboarding",
    },
    heroGradient:
      "linear-gradient(145deg,#8fa3b8 0%,#546e87 52%,#2c3e52 100%)",
    heroShadow: "0_30px_80px_-36px_rgba(30,44,60,0.72)",
    pageTint: "from-slate-500/12 via-zinc-400/7 to-transparent",
    accent: "from-slate-500/16 via-zinc-400/9 to-transparent",
    border: "border-slate-400/25",
    cardTone: "from-slate-500/10 via-zinc-400/5 to-transparent",
    dotTone: "bg-gradient-to-br from-slate-500 to-zinc-600",
    badgeTone: "bg-slate-500/10 text-slate-700",
    textTone: "text-slate-700",
    buttonTone:
      "from-slate-600 to-zinc-700 hover:from-slate-600/90 hover:to-zinc-700/90 text-white shadow-[0_18px_44px_rgba(71,85,105,0.22)]",
    waveColor: "#c8d4e0",
  },
  [APP_MODES.ZEN]: {
    key: APP_MODES.ZEN,
    label: "Zen",
    assets: {
      logo: "/zen/logo-main.png",
      background: "/madagascar/background.webp",
      curious: "/madagascar/curious.webp",
      notFound: "/madagascar/not-found-crop-male.webp",
      onboardingBase: "/madagascar/onboarding",
    },
    heroGradient:
      "linear-gradient(145deg,#9ad4c0 0%,#4aa88a 52%,#1e6655 100%)",
    heroShadow: "0_30px_80px_-36px_rgba(18,68,56,0.72)",
    pageTint: "from-teal-500/12 via-green-400/7 to-transparent",
    accent: "from-teal-500/15 via-green-400/8 to-transparent",
    border: "border-teal-600/22",
    cardTone: "from-teal-500/10 via-green-400/5 to-transparent",
    dotTone: "bg-gradient-to-br from-teal-500 to-green-600",
    badgeTone: "bg-teal-500/10 text-teal-700",
    textTone: "text-teal-700",
    buttonTone:
      "from-teal-600 to-green-700 hover:from-teal-600/90 hover:to-green-700/90 text-white shadow-[0_18px_44px_rgba(20,148,122,0.22)]",
    waveColor: "#1a5c4a",
  },
  [APP_MODES.MADAGASCAR]: {
    key: APP_MODES.MADAGASCAR,
    label: "Madagascar",
    assets: {
      logo: "/madagascar/logo-main.webp",
      background: "/madagascar/background.webp",
      curious: "/madagascar/curious.webp",
      notFound: "/madagascar/not-found-crop-male.webp",
      onboardingBase: "/madagascar/onboarding",
    },
    heroGradient:
      "linear-gradient(145deg,#fb8a4c 0%,#df5238 52%,#9f2c29 100%)",
    heroShadow: "0_30px_80px_-36px_rgba(86,26,19,0.72)",
    pageTint: "from-amber-500/14 via-orange-400/8 to-transparent",
    accent: "from-amber-500/18 via-orange-400/10 to-transparent",
    border: "border-amber-500/25",
    cardTone: "from-amber-500/12 via-orange-400/6 to-transparent",
    dotTone: "bg-gradient-to-br from-amber-500 to-orange-500",
    badgeTone: "bg-amber-500/10 text-amber-700",
    textTone: "text-amber-700",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
    waveColor: "#fff",
  },
};

export const DEFAULT_APP_MODE_THEME = APP_MODE_THEMES[APP_MODES.MADAGASCAR];

export const getAppModeTheme = (mode) =>
  APP_MODE_THEMES[mode] ?? DEFAULT_APP_MODE_THEME;
