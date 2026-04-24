const YOUNG_AGE_MAX = 24;
const OLD_AGE_MIN = 50;

const HEIGHT_MIN_CM = 100;
const HEIGHT_MAX_CM = 250;
const ILLUSTRATION_MIN_HEIGHT = 220;
const ILLUSTRATION_MAX_HEIGHT = 420;

const DEFAULT_TIER = 3;
const MIN_TIER = 1;
const MAX_TIER = 5;

const resolveAgeVariant = (ageValue) => {
  const ageNumber = Number(ageValue);

  if (!Number.isFinite(ageNumber)) return "";
  if (ageNumber <= YOUNG_AGE_MAX) return "young";
  if (ageNumber >= OLD_AGE_MIN) return "old";

  return "";
};

const clampTier = (tier) =>
  Math.min(MAX_TIER, Math.max(MIN_TIER, Math.round(tier)));

const buildTierFromProgress = (value, min, max) => {
  if (!Number.isFinite(value)) return DEFAULT_TIER;

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const clamped = Math.min(safeMax, Math.max(safeMin, value));
  const progress = (clamped - safeMin) / (safeMax - safeMin || 1);

  return clampTier(1 + progress * 4);
};

const resolveHeightTier = (gender, heightValue) => {
  const heightNumber = Number(heightValue);
  if (!Number.isFinite(heightNumber)) return DEFAULT_TIER;

  const range =
    gender === "female"
      ? { min: 145, max: 185 }
      : gender === "male"
        ? { min: 155, max: 195 }
        : { min: 150, max: 190 };

  return buildTierFromProgress(heightNumber, range.min, range.max);
};

const resolveBmiTier = (weightValue, heightValue) => {
  const weightNumber = Number(weightValue);
  const heightNumber = Number(heightValue);

  if (
    !Number.isFinite(weightNumber) ||
    !Number.isFinite(heightNumber) ||
    heightNumber <= 0
  ) {
    return DEFAULT_TIER;
  }

  const bmi = weightNumber / (heightNumber / 100) ** 2;

  if (bmi < 18.5) return 1;
  if (bmi < 21.5) return 2;
  if (bmi < 25) return 3;
  if (bmi < 30) return 4;

  return 5;
};

export const calculateOnboardingBmi = (weightValue, heightValue) => {
  const weightNumber = Number(weightValue);
  const heightNumber = Number(heightValue);

  if (
    !Number.isFinite(weightNumber) ||
    !Number.isFinite(heightNumber) ||
    heightNumber <= 0
  ) {
    return null;
  }

  return weightNumber / (heightNumber / 100) ** 2;
};

export const getOnboardingBmiMeta = (weightValue, heightValue) => {
  const bmi = calculateOnboardingBmi(weightValue, heightValue);

  if (bmi === null) return null;

  if (bmi < 18.5) {
    return {
      key: "underweight",
      bmi,
      label: "Below range",
      description: "You are still below the balanced BMI zone for your height.",
      pageTint: "from-sky-500/12 via-cyan-400/8 to-transparent",
      border: "border-sky-500/20",
      badgeTone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
      buttonTone:
        "from-sky-500 to-cyan-500 hover:from-sky-500/90 hover:to-cyan-500/90 text-white shadow-[0_18px_44px_rgba(14,165,233,0.26)]",
      cardTone: "from-sky-500/10 via-background/92 to-background/80",
      textTone: "text-sky-700 dark:text-sky-300",
    };
  }

  if (bmi < 25) {
    return {
      key: "healthy",
      bmi,
      label: "Healthy range",
      description: "This sits inside the balanced BMI zone for your height.",
      pageTint: "from-emerald-500/12 via-lime-400/8 to-transparent",
      border: "border-emerald-500/20",
      badgeTone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      buttonTone:
        "from-emerald-500 to-lime-500 hover:from-emerald-500/90 hover:to-lime-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
      cardTone: "from-emerald-500/10 via-background/92 to-background/80",
      textTone: "text-emerald-700 dark:text-emerald-300",
    };
  }

  if (bmi < 30) {
    return {
      key: "above-range",
      bmi,
      label: "Above range",
      description: "This is a little above the balanced BMI zone for your height.",
      pageTint: "from-amber-500/12 via-orange-400/8 to-transparent",
      border: "border-amber-500/20",
      badgeTone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      buttonTone:
        "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
      cardTone: "from-amber-500/10 via-background/92 to-background/80",
      textTone: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    key: "high-range",
    bmi,
    label: "High range",
    description: "This is well above the balanced BMI zone for your height.",
    pageTint: "from-rose-500/12 via-fuchsia-400/8 to-transparent",
    border: "border-rose-500/20",
    badgeTone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    buttonTone:
      "from-rose-500 to-fuchsia-500 hover:from-rose-500/90 hover:to-fuchsia-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
    cardTone: "from-rose-500/10 via-background/92 to-background/80",
    textTone: "text-rose-700 dark:text-rose-300",
  };
};

const buildIllustrationPath = (gender, ageValue, tier = DEFAULT_TIER) => {
  if (!gender) {
    return {
      src: "/optimized/onboarding/curious.webp",
      alt: "Onboarding illustration",
    };
  }

  const ageVariant = resolveAgeVariant(ageValue);
  const normalizedTier = clampTier(tier);
  const variantPrefix = ageVariant ? `${gender}-${ageVariant}` : gender;

  return {
    src: `/optimized/onboarding/${variantPrefix}-${normalizedTier}.webp`,
    alt: `${variantPrefix} illustration`,
  };
};

export const getOnboardingPersonIllustration = (gender, ageValue) =>
  buildIllustrationPath(gender, ageValue, DEFAULT_TIER);

export const getOnboardingTierIllustration = (gender, ageValue, tier) =>
  buildIllustrationPath(gender, ageValue, tier);

export const getOnboardingHeightIllustration = (gender, ageValue, heightValue) =>
  buildIllustrationPath(
    gender,
    ageValue,
    resolveHeightTier(gender, heightValue),
  );

export const getOnboardingWeightIllustration = (
  gender,
  ageValue,
  weightValue,
  heightValue,
) =>
  buildIllustrationPath(
    gender,
    ageValue,
    resolveBmiTier(weightValue, heightValue),
  );

export const getOnboardingIllustrationHeight = (heightValue) => {
  const heightNumber = Number(heightValue);
  if (!Number.isFinite(heightNumber)) {
    return 320;
  }

  const clampedHeight = Math.min(
    HEIGHT_MAX_CM,
    Math.max(HEIGHT_MIN_CM, heightNumber),
  );
  const progress =
    (clampedHeight - HEIGHT_MIN_CM) / (HEIGHT_MAX_CM - HEIGHT_MIN_CM);

  return Math.round(
    ILLUSTRATION_MIN_HEIGHT +
      progress * (ILLUSTRATION_MAX_HEIGHT - ILLUSTRATION_MIN_HEIGHT),
  );
};
