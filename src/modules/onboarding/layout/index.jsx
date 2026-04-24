import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { get } from "lodash";
import { cn } from "@/lib/utils";
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

const getPrevCoachStep = (step) => {
  const steps = COACH_ONBOARDING_STEPS;
  const idx = steps.indexOf(step);
  if (idx > 0) return steps[idx - 1];
  // First coach step: return null — the prevPath fallback (currentStepIndex === 0)
  // will navigate to /onboarding, bypassing the CoachEntryPage redirect loop.
  return null;
};

const OnboardingLayoutInner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setFields, setLastVisitedPath } = useOnboardingStore();

  const isCoachScope = location.pathname.startsWith("/coach/onboarding");
  const routePath = location.pathname.replace(
    /^\/(?:user|coach)\/onboarding\/?/,
    "",
  );
  const currentPath =
    isCoachScope && routePath ? `coach/${routePath}` : routePath;
  const isReportRoute =
    currentPath === "report" || currentPath.startsWith("report/");
  const isWideUserStep = [
    "name",
    "gender",
    "age",
    "height",
    "current-weight",
    "goal",
    "target-weight",
    "weekly-pace",
    "activity-level",
    "meal-frequency",
    "water-habits",
    "diet-restrictions",
  ].includes(currentPath);
  const isCoachStep = isCoachOnboardingStep(currentPath);
  const currentStepIndex = isCoachStep
    ? getCoachOnboardingStepIndex(currentPath)
    : getStepIndex(currentPath);
  const totalSteps = isCoachStep
    ? COACH_ONBOARDING_STEPS.length
    : ONBOARDING_STEPS.length;

  const showProgress = currentStepIndex >= 0;
  const progress = showProgress ? (currentStepIndex + 1) / totalSteps : 0;

  const prevStep = isCoachStep
    ? getPrevCoachStep(currentPath)
    : getPrevStep(currentPath);
  const prevPath = prevStep
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
    const userOnboarding = get(data, "data.userOnboarding");
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
          userOnboarding?.heightValue !== null &&
          userOnboarding?.heightValue !== undefined
            ? String(userOnboarding.heightValue)
            : "",
        unit: userOnboarding?.heightUnit ?? "cm",
      },
      currentWeight: {
        value:
          userOnboarding?.currentWeightValue !== null &&
          userOnboarding?.currentWeightValue !== undefined
            ? String(userOnboarding.currentWeightValue)
            : "",
        unit: userOnboarding?.currentWeightUnit ?? "kg",
      },
      goal: userOnboarding?.goal ?? "",
      targetWeight: {
        value:
          userOnboarding?.targetWeightValue !== null &&
          userOnboarding?.targetWeightValue !== undefined
            ? String(userOnboarding.targetWeightValue)
            : "",
        unit: userOnboarding?.targetWeightUnit ?? "kg",
      },
      weeklyPace: userOnboarding?.weeklyPace ?? 0.5,
      activityLevel: userOnboarding?.activityLevel ?? "",
      mealFrequency: userOnboarding?.mealFrequency ?? "",
      waterHabits: userOnboarding?.waterHabits ?? "",
      dietRestrictions: Array.isArray(userOnboarding?.dietRestrictions)
        ? userOnboarding.dietRestrictions
        : [],
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
  }, [data, setFields]);

  const maxWidthClass = isReportRoute
    ? "max-w-6xl"
    : isWideUserStep
      ? "max-w-5xl"
      : "max-w-lg";

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      {/* ── STICKY HEADER ── */}
      {showProgress && (
        <header className="shrink-0 px-4 pt-4 pb-3 bg-background border-b border-border/40">
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
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── SCROLLABLE CONTENT ── */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className={cn("w-full mx-auto flex-1 flex flex-col", maxWidthClass)}>
          <Outlet />
        </div>
      </main>
      <footer className="shrink-0 border-t border-border/40 bg-background px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className={cn("mx-auto", maxWidthClass)}>
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
