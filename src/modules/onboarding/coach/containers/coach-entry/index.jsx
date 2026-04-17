import React from "react";
import { get } from "lodash";
import { Navigate } from "react-router";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useGetQuery } from "@/hooks/api";
import { useAuthStore, useOnboardingStore } from "@/store";
import { getResumeCoachOnboardingPath } from "@/modules/onboarding/lib/resume";
import { useDraftRestore } from "@/modules/onboarding/lib/use-draft-restore";
import {
  getCoachOnboardingPath,
  getOnboardingPathFromStep,
} from "@/lib/app-paths.js";

const Index = () => {
  const onboardingState = useOnboardingStore();
  const { isAuthenticated, roles } = useAuthStore();

  // Restore server draft into local store if local is empty (cross-device resume)
  useDraftRestore("coach", { enabled: isAuthenticated });

  const { data, isLoading } = useGetQuery({
    url: "/user/onboarding/status",
    queryProps: {
      queryKey: ["onboarding"],
      enabled: isAuthenticated,
      staleTime: 60_000,
    },
  });

  const coachOnboarding = get(data, "data.coachOnboarding");
  const coachApplicationStatus =
    coachOnboarding?.status ?? null;

  const targetPath = getResumeCoachOnboardingPath(
    {
      ...onboardingState,
      coachCategory:
        coachOnboarding?.coachCategory ?? onboardingState.coachCategory,
      coachCategories: Array.isArray(coachOnboarding?.coachCategories)
        ? coachOnboarding.coachCategories
        : onboardingState.coachCategories,
      targetAudience: Array.isArray(coachOnboarding?.targetAudience)
        ? coachOnboarding.targetAudience
        : onboardingState.targetAudience,
      availability:
        coachOnboarding?.availability ?? onboardingState.availability,
      experience: coachOnboarding?.experience ?? onboardingState.experience,
      specializations: Array.isArray(coachOnboarding?.specializations)
        ? coachOnboarding.specializations
        : onboardingState.specializations,
      certificationType:
        coachOnboarding?.certificationType ?? onboardingState.certificationType,
      certificationNumber:
        coachOnboarding?.certificationNumber ??
        onboardingState.certificationNumber,
      certificateFiles: Array.isArray(coachOnboarding?.certificateFiles)
        ? coachOnboarding.certificateFiles
        : onboardingState.certificateFiles,
      coachLanguages: Array.isArray(coachOnboarding?.languages)
        ? coachOnboarding.languages
        : onboardingState.coachLanguages,
      coachCity: coachOnboarding?.city ?? onboardingState.coachCity,
      coachWorkMode: coachOnboarding?.workMode ?? onboardingState.coachWorkMode,
      coachWorkplace: coachOnboarding?.workplace ?? onboardingState.coachWorkplace,
      coachMonthlyPrice:
        coachOnboarding?.monthlyPrice !== null &&
        coachOnboarding?.monthlyPrice !== undefined
          ? String(coachOnboarding.monthlyPrice)
          : onboardingState.coachMonthlyPrice,
      coachBio: coachOnboarding?.bio ?? onboardingState.coachBio,
      coachAvatar:
        get(data, "data.coachProfileAvatar") ?? onboardingState.coachAvatar,
      wantsMarketplaceListing:
        coachOnboarding?.wantsMarketplaceListing ??
        onboardingState.wantsMarketplaceListing,
    },
    coachApplicationStatus,
  );

  if (
    coachApplicationStatus === "APPROVED" &&
    Array.isArray(roles) &&
    roles.includes("COACH")
  ) {
    return <Navigate to="/coach" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-10 text-orange-400" />
      </div>
    );
  }

  if (targetPath) {
    return <Navigate to={getOnboardingPathFromStep(targetPath)} replace />;
  }

  return <Navigate to={getCoachOnboardingPath("category")} replace />;
};

export default Index;
