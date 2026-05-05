import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { cn } from "@/lib/utils";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore, useOnboardingStore } from "@/store";
import { ChevronLeft } from "lucide-react";
import {
  getCoachOnboardingPath,
  getOnboardingPathFromStep,
  getUserOnboardingPath,
} from "@/lib/app-paths.js";
import {
  COACH_ONBOARDING_STEPS,
  ONBOARDING_STEPS,
  getStepIndex,
  getPrevStep,
  isCoachOnboardingStep,
  isKnownOnboardingStep,
} from "../constants";
import { getCoachOnboardingStepIndex } from "../lib/resume";
import {
  OnboardingFooterProvider,
  FooterSlot,
} from "../lib/onboarding-footer-context";
import { useDraftRestore } from "../lib/use-draft-restore";

const getPrevCoachStep = (step) => {
  const steps = COACH_ONBOARDING_STEPS;
  const idx = steps.indexOf(step);
  if (idx > 0) return steps[idx - 1];
  return null;
};

const OnboardingLayoutInner = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    setFields,
    setLastVisitedPath,
  } = useOnboardingStore();

  const isCoachScope = location.pathname.startsWith("/coach/onboarding");
  const routePath = location.pathname.replace(
    /^\/(?:user|coach)\/onboarding\/?/,
    "",
  );
  const currentPath =
    isCoachScope && routePath ? `coach/${routePath}` : routePath;
  const isResultRoute = !isCoachScope && currentPath === "result";
  const isStandalonePostOnboardingRoute = ["personalizing", "generating"].some(
    (path) => currentPath === path || currentPath.startsWith(`${path}/`),
  );

  const isCoachStep = isCoachOnboardingStep(currentPath);
  const currentStepIndex = isCoachStep
    ? getCoachOnboardingStepIndex(currentPath)
    : getStepIndex(currentPath);
  const totalSteps = isCoachStep
    ? COACH_ONBOARDING_STEPS.length
    : ONBOARDING_STEPS.length;

  const showProgress = currentStepIndex >= 0 || isResultRoute;
  const progress = isResultRoute
    ? 1
    : showProgress
      ? (currentStepIndex + 1) / totalSteps
      : 0;
  const isPostOnboardingRoute = ["personalizing", "result", "generating"].some(
    (path) => currentPath === path || currentPath.startsWith(`${path}/`),
  );
  const { isLoading: isDraftLoading } = useDraftRestore(
    isCoachScope ? "coach" : "user",
    {
      enabled: isAuthenticated && !isPostOnboardingRoute,
    },
  );
  const rawPrevStep = isCoachStep
    ? getPrevCoachStep(currentPath)
    : getPrevStep(currentPath);
  const prevStep = rawPrevStep;
  const prevPath = isResultRoute
    ? getUserOnboardingPath("review")
    : prevStep
      ? getOnboardingPathFromStep(prevStep)
      : currentStepIndex === 0
        ? isCoachScope
          ? getCoachOnboardingPath()
          : getUserOnboardingPath()
        : null;

  const { data } = useGetQuery({
    url: "/user/onboarding/status",
    queryProps: {
      queryKey: ["onboarding"],
      enabled: isAuthenticated,
      staleTime: 60000,
    },
  });

  React.useEffect(() => {
    if (isKnownOnboardingStep(currentPath)) {
      setLastVisitedPath(currentPath);
    }
  }, [currentPath, setLastVisitedPath]);

  React.useEffect(() => {
    const hasUserDraft = Boolean(
      get(data, "data.userOnboardingDraft.data") && !isPostOnboardingRoute,
    );
    const userOnboarding = hasUserDraft
      ? null
      : normalizeUserOnboarding(get(data, "data.userOnboarding"));
    const coachOnboarding = get(data, "data.coachOnboarding");

    if (!userOnboarding && !coachOnboarding) {
      return;
    }

    setFields({
      firstName: userOnboarding?.firstName ?? "",
      lastName: userOnboarding?.lastName ?? "",
      gender: userOnboarding?.gender ?? "",
      age:
        userOnboarding?.age !== null && userOnboarding?.age !== undefined
          ? String(userOnboarding.age)
          : "",
      height: {
        value:
          userOnboarding?.height?.value !== null &&
          userOnboarding?.height?.value !== undefined
            ? String(userOnboarding.height.value)
            : "",
        unit: userOnboarding?.height?.unit ?? "cm",
      },
      currentWeight: {
        value:
          userOnboarding?.currentWeight?.value !== null &&
          userOnboarding?.currentWeight?.value !== undefined
            ? String(userOnboarding.currentWeight.value)
            : "",
        unit: userOnboarding?.currentWeight?.unit ?? "kg",
      },
      goal: userOnboarding?.goal ?? "",
      weightGoal: userOnboarding?.weightGoal ?? "",
      goals: Array.isArray(userOnboarding?.goals) ? userOnboarding.goals : [],
      targetWeight: {
        value:
          userOnboarding?.targetWeight?.value !== null &&
          userOnboarding?.targetWeight?.value !== undefined
            ? String(userOnboarding.targetWeight.value)
            : "",
        unit: userOnboarding?.targetWeight?.unit ?? "kg",
      },
      weeklyPace: userOnboarding?.weeklyPace ?? 0.5,
      activityLevel: userOnboarding?.activityLevel ?? "",
      weeklyWorkoutCount:
        userOnboarding?.weeklyWorkoutCount !== null &&
        userOnboarding?.weeklyWorkoutCount !== undefined
          ? String(userOnboarding.weeklyWorkoutCount)
          : "",
      workoutExperience: userOnboarding?.workoutExperience ?? "",
      sleepHours:
        userOnboarding?.sleepHours !== null &&
        userOnboarding?.sleepHours !== undefined
          ? String(userOnboarding.sleepHours)
          : "",
      workType: userOnboarding?.workType ?? "",
      fastFoodFrequency: userOnboarding?.fastFoodFrequency ?? "",
      sweetDrinkHabit: userOnboarding?.sweetDrinkHabit ?? "",
      cookingTime: userOnboarding?.cookingTime ?? "",
      cookingAccess: userOnboarding?.cookingAccess ?? "",
      mealFrequency: userOnboarding?.mealFrequency ?? "",
      foodBudget:
        userOnboarding?.foodBudget !== null &&
        userOnboarding?.foodBudget !== undefined
          ? String(userOnboarding.foodBudget)
          : "",
      foodBudgetTier: userOnboarding?.foodBudgetTier ?? null,
      budgetPeriod: userOnboarding?.budgetPeriod ?? "weekly",
      budgetCurrency: userOnboarding?.budgetCurrency ?? "UZS",
      workoutLocation: userOnboarding?.workoutLocation ?? "home",
      equipmentIds: Array.isArray(userOnboarding?.equipmentIds)
        ? userOnboarding.equipmentIds
        : [],
      customEquipment: Array.isArray(userOnboarding?.customEquipment)
        ? userOnboarding.customEquipment
        : [],
      workoutBodyPartIds: Array.isArray(userOnboarding?.workoutBodyPartIds)
        ? userOnboarding.workoutBodyPartIds
        : [],
      customWorkoutBodyParts: Array.isArray(
        userOnboarding?.customWorkoutBodyParts,
      )
        ? userOnboarding.customWorkoutBodyParts
        : [],
      allergyIds: Array.isArray(userOnboarding?.allergyIds)
        ? userOnboarding.allergyIds
        : Array.isArray(userOnboarding?.allergyIngredientIds)
          ? userOnboarding.allergyIngredientIds
          : [],
      allergyIngredientIds: Array.isArray(userOnboarding?.allergyIngredientIds)
        ? userOnboarding.allergyIngredientIds
        : [],
      customAllergies: Array.isArray(userOnboarding?.customAllergies)
        ? userOnboarding.customAllergies
        : userOnboarding?.allergyOtherText
          ? [userOnboarding.allergyOtherText]
          : [],
      dietRequirementIds: Array.isArray(userOnboarding?.dietRequirementIds)
        ? userOnboarding.dietRequirementIds
        : [],
      customDietRequirements: Array.isArray(
        userOnboarding?.customDietRequirements,
      )
        ? userOnboarding.customDietRequirements
        : userOnboarding?.nutritionPreferenceOtherText
          ? [userOnboarding.nutritionPreferenceOtherText]
          : [],
      preferredCuisineIds: Array.isArray(userOnboarding?.preferredCuisineIds)
        ? userOnboarding.preferredCuisineIds
        : [],
      customPreferredCuisines: Array.isArray(
        userOnboarding?.customPreferredCuisines,
      )
        ? userOnboarding.customPreferredCuisines
        : [],
      dislikedFoodIds: Array.isArray(userOnboarding?.dislikedFoodIds)
        ? userOnboarding.dislikedFoodIds
        : [],
      customDislikedFoods: Array.isArray(userOnboarding?.customDislikedFoods)
        ? userOnboarding.customDislikedFoods
        : [],
      preferredIngredientIds: Array.isArray(
        userOnboarding?.preferredIngredientIds,
      )
        ? userOnboarding.preferredIngredientIds
        : [],
      customPreferredIngredients: Array.isArray(
        userOnboarding?.customPreferredIngredients,
      )
        ? userOnboarding.customPreferredIngredients
        : [],
      dislikedIngredientIds: Array.isArray(
        userOnboarding?.dislikedIngredientIds,
      )
        ? userOnboarding.dislikedIngredientIds
        : [],
      customDislikedIngredients: Array.isArray(
        userOnboarding?.customDislikedIngredients,
      )
        ? userOnboarding.customDislikedIngredients
        : userOnboarding?.dislikedOtherText
          ? [userOnboarding.dislikedOtherText]
          : [],
      nutritionPreferenceKeys: Array.isArray(
        userOnboarding?.nutritionPreferenceKeys,
      )
        ? userOnboarding.nutritionPreferenceKeys
        : [],
      allergyOtherText: userOnboarding?.allergyOtherText ?? "",
      dislikedOtherText: userOnboarding?.dislikedOtherText ?? "",
      nutritionPreferenceOtherText:
        userOnboarding?.nutritionPreferenceOtherText ?? "",
      dietRestrictions: Array.isArray(userOnboarding?.dietRestrictions)
        ? userOnboarding.dietRestrictions
        : [],
      healthConstraints: Array.isArray(userOnboarding?.healthConstraints)
        ? userOnboarding.healthConstraints
        : [],
      customHealthConstraints: Array.isArray(
        userOnboarding?.customHealthConstraints,
      )
        ? userOnboarding.customHealthConstraints
        : [],
      injurySeverity: userOnboarding?.injurySeverity ?? "",
      forbiddenExercises: Array.isArray(userOnboarding?.forbiddenExercises)
        ? userOnboarding.forbiddenExercises
        : [],
      medications: userOnboarding?.medications ?? "",
      supplements: userOnboarding?.supplements ?? "",
      playsFootball: Boolean(userOnboarding?.playsFootball),
      cardioLevel: userOnboarding?.cardioLevel ?? "",
      notificationPreference: userOnboarding?.notificationPreference ?? "",
      experience: coachOnboarding?.experience ?? "",
      specializations: Array.isArray(coachOnboarding?.specializations)
        ? coachOnboarding.specializations
        : [],
      certificationType: coachOnboarding?.certificationType ?? "",
      certificationNumber: coachOnboarding?.certificationNumber ?? "",
      certificateFiles: Array.isArray(coachOnboarding?.certificateFiles)
        ? coachOnboarding.certificateFiles
        : [],
      coachLanguages: Array.isArray(coachOnboarding?.languages)
        ? coachOnboarding.languages
        : [],
      coachCity: coachOnboarding?.city ?? "",
      coachWorkMode: coachOnboarding?.workMode ?? "",
      coachWorkplace: coachOnboarding?.workplace ?? "",
      coachMonthlyPrice:
        coachOnboarding?.monthlyPrice !== null &&
        coachOnboarding?.monthlyPrice !== undefined
          ? String(coachOnboarding.monthlyPrice)
          : "",
      coachBio: coachOnboarding?.bio ?? "",
      coachAvatar: get(data, "data.coachProfileAvatar", "") ?? "",
      wantsMarketplaceListing:
        coachOnboarding?.wantsMarketplaceListing ?? false,
    });
  }, [data, isPostOnboardingRoute, setFields]);

  const maxWidthClass = isStandalonePostOnboardingRoute
    ? "max-w-5xl"
    : "max-w-lg";
  const hasFixedHeader = showProgress && !isStandalonePostOnboardingRoute;

  if (isDraftLoading && !isPostOnboardingRoute) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {/* ── FIXED HEADER ── */}
      {hasFixedHeader && (
        <header className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-transparent px-4 pb-3 pt-4 backdrop-blur-2xl">
          <div className={cn("mx-auto flex items-center gap-3", maxWidthClass)}>
            <button
              type="button"
              onClick={() => {
                if (prevPath) navigate(prevPath);
              }}
              disabled={!prevPath}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-all hover:bg-muted",
                !prevPath && "opacity-30 pointer-events-none",
              )}
              aria-label={t("onboarding.back")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative h-2 min-w-0 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
      {/* ── SCROLLABLE CONTENT ── */}
      <main
        className={cn(
          "flex flex-1 flex-col overflow-y-auto pb-28",
          hasFixedHeader && "pt-[72px]",
        )}
      >
        <div
          className={cn("w-full mx-auto flex-1 flex flex-col", maxWidthClass)}
        >
          <Outlet />
        </div>
      </main>
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-transparent px-4 pb-4 pt-3">
        <div className={cn("pointer-events-auto mx-auto", maxWidthClass)}>
          <FooterSlot />
        </div>
      </footer>
    </div>
  );
};

const Index = () => (
  <OnboardingFooterProvider>
    <OnboardingLayoutInner />
  </OnboardingFooterProvider>
);

export default Index;
