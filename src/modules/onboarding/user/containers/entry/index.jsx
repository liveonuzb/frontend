import React from "react";
import { Navigate } from "react-router";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useOnboardingStore, useAuthStore } from "@/store";
import { getResumeOnboardingPath } from "@/modules/onboarding/lib/resume";
import { useDraftRestore } from "@/modules/onboarding/lib/use-draft-restore";
import { getOnboardingPathFromStep } from "@/lib/app-paths.js";

const Index = () => {
  const onboardingState = useOnboardingStore();
  const { onboardingCompleted } = useAuthStore();

  // Restore server draft into local store if local is empty (cross-device resume)
  const { isLoading: isDraftLoading } = useDraftRestore("user");

  const targetPath = getResumeOnboardingPath(
    onboardingState,
    onboardingCompleted,
  );

  if (isDraftLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-10 text-orange-400" />
      </div>
    );
  }

  if (onboardingCompleted && !targetPath) {
    return <Navigate to="/user" replace />;
  }

  if (targetPath) {
    return <Navigate to={getOnboardingPathFromStep(targetPath)} replace />;
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-10 text-orange-400" />
    </div>
  );
};

export default Index;
