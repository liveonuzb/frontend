const createTone = ({
  pageTint,
  border,
  buttonTone,
  badgeTone,
  cardTone,
  textTone,
  dotTone,
}) => ({
  pageTint,
  border,
  buttonTone,
  badgeTone,
  cardTone,
  textTone,
  dotTone,
});

export const ONBOARDING_TONES = {
  neutral: createTone({
    pageTint: "from-amber-500/10 via-orange-400/6 to-transparent",
    border: "border-amber-500/20",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.24)]",
    badgeTone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    cardTone: "from-amber-500/10 via-background/92 to-background/80",
    textTone: "text-amber-700 dark:text-amber-300",
    dotTone: "bg-amber-500",
  }),
  male: createTone({
    pageTint: "from-sky-500/12 via-indigo-400/8 to-transparent",
    border: "border-sky-500/20",
    buttonTone:
      "from-sky-500 to-indigo-500 hover:from-sky-500/90 hover:to-indigo-500/90 text-white shadow-[0_18px_44px_rgba(59,130,246,0.24)]",
    badgeTone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    cardTone: "from-sky-500/10 via-background/92 to-background/80",
    textTone: "text-sky-700 dark:text-sky-300",
    dotTone: "bg-sky-500",
  }),
  female: createTone({
    pageTint: "from-rose-500/12 via-fuchsia-400/8 to-transparent",
    border: "border-rose-500/20",
    buttonTone:
      "from-rose-500 to-fuchsia-500 hover:from-rose-500/90 hover:to-fuchsia-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
    badgeTone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    cardTone: "from-rose-500/10 via-background/92 to-background/80",
    textTone: "text-rose-700 dark:text-rose-300",
    dotTone: "bg-rose-500",
  }),
  young: createTone({
    pageTint: "from-sky-500/12 via-cyan-400/8 to-transparent",
    border: "border-sky-500/20",
    buttonTone:
      "from-sky-500 to-cyan-500 hover:from-sky-500/90 hover:to-cyan-500/90 text-white shadow-[0_18px_44px_rgba(14,165,233,0.24)]",
    badgeTone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    cardTone: "from-sky-500/10 via-background/92 to-background/80",
    textTone: "text-sky-700 dark:text-sky-300",
    dotTone: "bg-sky-500",
  }),
  balanced: createTone({
    pageTint: "from-emerald-500/12 via-lime-400/8 to-transparent",
    border: "border-emerald-500/20",
    buttonTone:
      "from-emerald-500 to-lime-500 hover:from-emerald-500/90 hover:to-lime-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
    badgeTone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    cardTone: "from-emerald-500/10 via-background/92 to-background/80",
    textTone: "text-emerald-700 dark:text-emerald-300",
    dotTone: "bg-emerald-500",
  }),
  mature: createTone({
    pageTint: "from-amber-500/12 via-orange-400/8 to-transparent",
    border: "border-amber-500/20",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.24)]",
    badgeTone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    cardTone: "from-amber-500/10 via-background/92 to-background/80",
    textTone: "text-amber-700 dark:text-amber-300",
    dotTone: "bg-amber-500",
  }),
  active: createTone({
    pageTint: "from-rose-500/12 via-fuchsia-400/8 to-transparent",
    border: "border-rose-500/20",
    buttonTone:
      "from-rose-500 to-fuchsia-500 hover:from-rose-500/90 hover:to-fuchsia-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
    badgeTone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    cardTone: "from-rose-500/10 via-background/92 to-background/80",
    textTone: "text-rose-700 dark:text-rose-300",
    dotTone: "bg-rose-500",
  }),
};

export const ONBOARDING_ACCENTS = {
  neutral: ONBOARDING_TONES.neutral,
  blue: ONBOARDING_TONES.male,
  pink: ONBOARDING_TONES.female,
  sky: ONBOARDING_TONES.young,
  green: ONBOARDING_TONES.balanced,
  amber: ONBOARDING_TONES.mature,
  rose: ONBOARDING_TONES.active,
};

export const getGenderTone = (gender) => {
  if (gender === "female") return ONBOARDING_TONES.female;
  if (gender === "male") return ONBOARDING_TONES.male;
  return ONBOARDING_TONES.neutral;
};

export const getAgeTone = (ageValue) => {
  const age = Number(ageValue);
  if (!Number.isFinite(age)) return ONBOARDING_TONES.balanced;
  if (age <= 24) return ONBOARDING_TONES.young;
  if (age >= 50) return ONBOARDING_TONES.mature;
  return ONBOARDING_TONES.balanced;
};

export const getHeightTone = (heightValue) => {
  const height = Number(heightValue);
  if (!Number.isFinite(height)) return ONBOARDING_TONES.balanced;
  if (height < 160) return ONBOARDING_TONES.young;
  if (height < 180) return ONBOARDING_TONES.balanced;
  return ONBOARDING_TONES.active;
};
