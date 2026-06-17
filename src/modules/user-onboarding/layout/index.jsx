import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import isArray from "lodash/isArray";
import some from "lodash/some";
import { cn } from "@/lib/utils";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore, useOnboardingStore } from "@/store";
import { Check, ChevronLeft } from "lucide-react";
import {
  getOnboardingPathFromStep,
  getUserOnboardingPath,
} from "@/lib/app-paths.js";
import {
  ONBOARDING_STEPS,
  getStepIndex,
  getPrevStep,
  isKnownOnboardingStep,
} from "../constants";
import {
  OnboardingFooterProvider,
  FooterSlot,
} from "../lib/onboarding-footer-context";
import { useDraftRestore } from "../lib/use-draft-restore";
import { isMeaningfulUserDraftData } from "../lib/user-draft-data";
import ProfileDrawer from "@/modules/user/layout/profile-drawer.jsx";

const USER_STEP_SECTION_KEYS = {
  name: "profile",
  gender: "profile",
  age: "profile",
  height: "profile",
  "current-weight": "profile",
  goal: "goal",
  "target-weight": "goal",
  "weekly-pace": "goal",
  "activity-level": "goal",
  "meal-frequency": "nutrition",
  "diet-requirements": "nutrition",
  "health-constraints": "health",
  review: "review",
};

const getStepSectionKey = (step) => USER_STEP_SECTION_KEYS[step] ?? "profile";

const OnboardingLayoutInner = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    draftSaveStatus,
    draftSaveError,
    draftLastSavedAt,
    setFields,
    setLastVisitedPath,
  } = useOnboardingStore();

  const routePath = location.pathname.replace(
    /^\/user\/onboarding\/?/,
    "",
  );
  const currentPath = routePath;
  const isResultRoute = currentPath === "metabolism-result";
  const isMetabolismResultRoute = currentPath === "metabolism-result";
  const isStandalonePostOnboardingRoute = some([
    "metabolism-calculating",
  ], (path) => currentPath === path || currentPath.startsWith(`${path}/`));

  const userCurrentStep = currentPath;
  const currentStepIndex = getStepIndex(userCurrentStep);
  const totalSteps = ONBOARDING_STEPS.length;

  const showProgress = currentStepIndex >= 0 || isResultRoute;
  const progress = isResultRoute
    ? 1
    : showProgress
      ? (currentStepIndex + 1) / totalSteps
      : 0;
  const isPostOnboardingRoute = some([
    "metabolism-calculating",
    "metabolism-result",
  ], (path) => currentPath === path || currentPath.startsWith(`${path}/`));
  const { isLoading: isDraftLoading } = useDraftRestore("user", {
    enabled: isAuthenticated && !isPostOnboardingRoute,
  });
  const rawPrevStep = getPrevStep(userCurrentStep);
  const prevStep = rawPrevStep;
  const returnToPath =
    typeof location.state?.returnTo === "string" ? location.state.returnTo : "";
  const prevPath =
    returnToPath ||
    (isResultRoute
      ? getUserOnboardingPath("review")
      : prevStep
        ? getOnboardingPathFromStep(prevStep)
        : currentStepIndex === 0
          ? getUserOnboardingPath()
          : null);
  const stepSectionKey = getStepSectionKey(userCurrentStep);
  const progressLabel =
    currentStepIndex >= 0
      ? t("onboarding.progress.label", {
          current: currentStepIndex + 1,
          total: totalSteps,
          section: t(`onboarding.progress.sections.${stepSectionKey}`),
        })
      : isResultRoute
        ? t("onboarding.progress.complete")
        : "";
  const draftStatusLabel =
    draftSaveStatus === "saving"
      ? t("onboarding.autosave.saving")
      : draftSaveStatus === "saved"
        ? t("onboarding.autosave.saved")
        : draftSaveStatus === "error"
          ? t("onboarding.autosave.errorRetry")
          : "";

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
      setLastVisitedPath(userCurrentStep);
    }
  }, [currentPath, setLastVisitedPath, userCurrentStep]);

  React.useEffect(() => {
    const hasUserDraft = Boolean(
      !isPostOnboardingRoute &&
      isMeaningfulUserDraftData(get(data, "data.userOnboardingDraft.data")),
    );
    const userOnboarding = hasUserDraft
      ? null
      : normalizeUserOnboarding(get(data, "data.userOnboarding"));
    if (!userOnboarding) {
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
      equipmentIds: isArray(userOnboarding?.equipmentIds)
        ? userOnboarding.equipmentIds
        : [],
      customEquipment: isArray(userOnboarding?.customEquipment)
        ? userOnboarding.customEquipment
        : [],
      workoutBodyPartIds: isArray(userOnboarding?.workoutBodyPartIds)
        ? userOnboarding.workoutBodyPartIds
        : [],
      customWorkoutBodyParts: isArray(userOnboarding?.customWorkoutBodyParts)
        ? userOnboarding.customWorkoutBodyParts
        : [],
      allergyIds: isArray(userOnboarding?.allergyIds)
        ? userOnboarding.allergyIds
        : isArray(userOnboarding?.allergyIngredientIds)
          ? userOnboarding.allergyIngredientIds
          : [],
      allergyIngredientIds: isArray(userOnboarding?.allergyIngredientIds)
        ? userOnboarding.allergyIngredientIds
        : [],
      customAllergies: isArray(userOnboarding?.customAllergies)
        ? userOnboarding.customAllergies
        : userOnboarding?.allergyOtherText
          ? [userOnboarding.allergyOtherText]
          : [],
      dietRequirementIds: isArray(userOnboarding?.dietRequirementIds)
        ? userOnboarding.dietRequirementIds
        : [],
      customDietRequirements: isArray(userOnboarding?.customDietRequirements)
        ? userOnboarding.customDietRequirements
        : userOnboarding?.nutritionPreferenceOtherText
          ? [userOnboarding.nutritionPreferenceOtherText]
          : [],
      preferredCuisineIds: isArray(userOnboarding?.preferredCuisineIds)
        ? userOnboarding.preferredCuisineIds
        : [],
      customPreferredCuisines: isArray(userOnboarding?.customPreferredCuisines)
        ? userOnboarding.customPreferredCuisines
        : [],
      dislikedFoodIds: isArray(userOnboarding?.dislikedFoodIds)
        ? userOnboarding.dislikedFoodIds
        : [],
      customDislikedFoods: isArray(userOnboarding?.customDislikedFoods)
        ? userOnboarding.customDislikedFoods
        : [],
      preferredIngredientIds: isArray(userOnboarding?.preferredIngredientIds)
        ? userOnboarding.preferredIngredientIds
        : [],
      customPreferredIngredients: isArray(userOnboarding?.customPreferredIngredients)
        ? userOnboarding.customPreferredIngredients
        : [],
      dislikedIngredientIds: isArray(userOnboarding?.dislikedIngredientIds)
        ? userOnboarding.dislikedIngredientIds
        : [],
      customDislikedIngredients: isArray(userOnboarding?.customDislikedIngredients)
        ? userOnboarding.customDislikedIngredients
        : userOnboarding?.dislikedOtherText
          ? [userOnboarding.dislikedOtherText]
          : [],
      nutritionPreferenceKeys: isArray(userOnboarding?.nutritionPreferenceKeys)
        ? userOnboarding.nutritionPreferenceKeys
        : [],
      allergyOtherText: userOnboarding?.allergyOtherText ?? "",
      dislikedOtherText: userOnboarding?.dislikedOtherText ?? "",
      nutritionPreferenceOtherText:
        userOnboarding?.nutritionPreferenceOtherText ?? "",
      dietRestrictions: isArray(userOnboarding?.dietRestrictions)
        ? userOnboarding.dietRestrictions
        : [],
      healthConstraints: isArray(userOnboarding?.healthConstraints)
        ? userOnboarding.healthConstraints
        : [],
      customHealthConstraints: isArray(userOnboarding?.customHealthConstraints)
        ? userOnboarding.customHealthConstraints
        : [],
      injurySeverity: userOnboarding?.injurySeverity ?? "",
      forbiddenExercises: isArray(userOnboarding?.forbiddenExercises)
        ? userOnboarding.forbiddenExercises
        : [],
      medications: userOnboarding?.medications ?? "",
      supplements: userOnboarding?.supplements ?? "",
      playsFootball: Boolean(userOnboarding?.playsFootball),
      cardioLevel: userOnboarding?.cardioLevel ?? "",
      notificationPreference: userOnboarding?.notificationPreference ?? "",
    });
  }, [data, isPostOnboardingRoute, setFields]);

  const maxWidthClass = isStandalonePostOnboardingRoute
    ? "max-w-5xl"
    : "max-w-lg";
  const shellMaxWidthClass = isMetabolismResultRoute
    ? "max-w-[430px]"
    : maxWidthClass;
  const hasFixedHeader =
    showProgress &&
    !isStandalonePostOnboardingRoute &&
    !isMetabolismResultRoute;
  if (isDraftLoading && !isPostOnboardingRoute) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-dvh min-h-0 flex-col overflow-hidden",
        isMetabolismResultRoute
          ? "bg-[radial-gradient(circle_at_50%_-12%,rgba(255,152,0,0.14),transparent_34%),linear-gradient(180deg,#090604_0%,#070503_52%,#050302_100%)]"
          : "bg-background",
      )}
    >
      {/* ── FIXED HEADER ── */}
      {hasFixedHeader && (
        <header
          className={cn(
            "fixed inset-x-0 top-0 z-40 px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-2xl",
            isMetabolismResultRoute
              ? "border-b-0 bg-gradient-to-b from-[#070503] via-[#070503]/88 to-transparent text-white"
              : "border-b border-border/40 bg-transparent",
          )}
        >
          <div
            className={cn(
              "mx-auto flex items-center gap-3",
              shellMaxWidthClass,
            )}
          >
            <button
              type="button"
              onClick={() => {
                if (prevPath) navigate(prevPath);
              }}
              disabled={!prevPath}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full border transition-all",
                isMetabolismResultRoute
                  ? "h-11 w-11 border-[#ff990038] bg-[#ff9800]/10 text-[#ffb000] shadow-[0_0_28px_rgba(255,152,0,0.16)] hover:bg-[#ff9800]/16"
                  : "h-9 w-9 border-border bg-background hover:bg-muted",
                !prevPath && "opacity-30 pointer-events-none",
              )}
              aria-label={t("onboarding.back")}
            >
              <ChevronLeft
                className={cn(isMetabolismResultRoute ? "h-5 w-5" : "h-4 w-4")}
              />
            </button>

            {isMetabolismResultRoute ? (
              <>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
	                  <div className="truncate text-center text-xs font-black text-white min-[390px]:text-[13px]">
	                    {t("onboarding.progress.complete")}
	                  </div>
	                  <div
	                    className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10"
	                    role="progressbar"
	                    aria-label={t("onboarding.progress.complete")}
                    aria-valuemin={0}
                    aria-valuemax={totalSteps}
                    aria-valuenow={totalSteps}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ffb000] to-[#ff6a00] shadow-[0_0_18px_rgba(255,152,0,0.48)] transition-all duration-500 ease-out"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
	                </div>
	                <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-1.5 text-[11px] font-black text-white min-[390px]:px-2">
	                  <span className="hidden min-[374px]:inline">
	                    {t("onboarding.progress.finalShort")}
	                  </span>
                  <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-[#ffb000] to-[#ff6a00] text-white shadow-[0_0_16px_rgba(255,152,0,0.35)]">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </>
            ) : (
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
                  <span>{progressLabel}</span>
                  {draftStatusLabel ? (
                    <span
                      className={cn(
                        "truncate",
                        draftSaveStatus === "error" && "text-destructive",
                      )}
                      title={draftSaveError || draftLastSavedAt || undefined}
                    >
                      {draftStatusLabel}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="relative h-2 min-w-0 flex-1 rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-label={progressLabel}
                    aria-valuemin={0}
                    aria-valuemax={totalSteps}
                    aria-valuenow={
                      isResultRoute ? totalSteps : currentStepIndex + 1
                    }
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
      )}
      {/* ── VIEWPORT-BOUND CONTENT ── */}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isMetabolismResultRoute || isStandalonePostOnboardingRoute
            ? "pb-0"
            : "pb-[calc(5rem+env(safe-area-inset-bottom))]",
          "overflow-x-hidden",
          hasFixedHeader && "pt-[calc(88px+env(safe-area-inset-top))]",
          isMetabolismResultRoute &&
            "bg-[radial-gradient(circle_at_50%_-12%,rgba(255,152,0,0.14),transparent_34%),linear-gradient(180deg,#090604_0%,#070503_52%,#050302_100%)]",
        )}
      >
        <div
          className={cn(
            "w-full mx-auto flex min-h-0 flex-1 flex-col",
            shellMaxWidthClass,
          )}
        >
          <Outlet />
        </div>
      </main>
      <footer
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[calc(5rem+env(safe-area-inset-bottom))] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3",
          isMetabolismResultRoute
            ? "px-0 pb-0 pt-0 bg-gradient-to-t from-[#070503] via-[#070503]/86 to-transparent backdrop-blur-sm"
          : isStandalonePostOnboardingRoute
              ? "px-0 pb-0 pt-0"
              : "bg-transparent backdrop-blur-sm",
        )}
      >
        <div className={cn("pointer-events-auto mx-auto", shellMaxWidthClass)}>
          <FooterSlot />
        </div>
      </footer>
    </div>
  );
};

const Index = () => (
  <OnboardingFooterProvider>
    <OnboardingLayoutInner />
    <ProfileDrawer />
  </OnboardingFooterProvider>
);

export default Index;
