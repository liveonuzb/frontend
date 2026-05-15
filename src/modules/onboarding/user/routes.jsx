import React from "react";
import { Navigate, Route } from "react-router";
import {
  LEGACY_USER_ONBOARDING_STEP_REDIRECTS,
  ONBOARDING_STEPS,
} from "@/modules/onboarding/constants";
import EntryPage from "@/modules/onboarding/user/pages/entry/index.jsx";
import NamePage from "@/modules/onboarding/user/pages/name/index.jsx";
import GenderPage from "@/modules/onboarding/user/pages/gender/index.jsx";
import AgePage from "@/modules/onboarding/user/pages/age/index.jsx";
import HeightPage from "@/modules/onboarding/user/pages/height/index.jsx";
import CurrentWeightPage from "@/modules/onboarding/user/pages/current-weight/index.jsx";
import GoalPage from "@/modules/onboarding/user/pages/goal/index.jsx";
import TargetWeightPage from "@/modules/onboarding/user/pages/target-weight/index.jsx";
import WeeklyPacePage from "@/modules/onboarding/user/pages/weekly-pace/index.jsx";
import OtherGoalsPage from "@/modules/onboarding/user/pages/other-goals/index.jsx";
import ActivityLevelPage from "@/modules/onboarding/user/pages/activity-level/index.jsx";
import MealFrequencyPage from "@/modules/onboarding/user/pages/meal-frequency/index.jsx";
import DietRequirementsPage from "@/modules/onboarding/user/pages/diet-requirements/index.jsx";
import HealthConstraintsPage from "@/modules/onboarding/user/pages/health-constraints/index.jsx";
import ReviewPage from "@/modules/onboarding/user/pages/review/index.jsx";
import ReportPage from "@/modules/onboarding/user/pages/report/index.jsx";
import PersonalizingPage from "@/modules/onboarding/user/pages/personalizing/index.jsx";
import PersonalizationResultPage from "@/modules/onboarding/user/pages/result/index.jsx";

const activeStepElements = {
  name: <NamePage />,
  gender: <GenderPage />,
  age: <AgePage />,
  height: <HeightPage />,
  "current-weight": <CurrentWeightPage />,
  goal: <GoalPage />,
  "target-weight": <TargetWeightPage />,
  "weekly-pace": <WeeklyPacePage />,
  "other-goals": <OtherGoalsPage />,
  "activity-level": <ActivityLevelPage />,
  "meal-frequency": <MealFrequencyPage />,
  "diet-requirements": <DietRequirementsPage />,
  "health-constraints": <HealthConstraintsPage />,
  review: <ReviewPage />,
};

const postMetabolismLegacyRedirects = {
  personalizing: "metabolism-calculating",
  result: "metabolism-result",
  "plan-preview": "metabolism-result",
  generating: "metabolism-result",
  "generating/:jobId": "metabolism-result",
  "plan-generating": "metabolism-result",
  "plan-generating/:jobId": "metabolism-result",
};

export const renderUserOnboardingRoutes = () => (
  <>
    <Route index element={<EntryPage />} />

    {ONBOARDING_STEPS.map((step) => (
      <Route key={step} path={step} element={activeStepElements[step]} />
    ))}

    {Object.entries(LEGACY_USER_ONBOARDING_STEP_REDIRECTS).map(
      ([step, targetStep]) => (
        <Route
          key={step}
          path={step}
          element={<Navigate to={`../${targetStep}`} replace />}
        />
      ),
    )}

    <Route path="report" element={<ReportPage />} />
    <Route path="personalizing/:jobId" element={<PersonalizingPage />} />
    <Route path="metabolism-calculating" element={<PersonalizingPage />} />
    <Route
      path="metabolism-calculating/:jobId"
      element={<PersonalizingPage />}
    />
    <Route path="metabolism-result" element={<PersonalizationResultPage />} />

    {Object.entries(postMetabolismLegacyRedirects).map(([path, target]) => (
      <Route
        key={path}
        path={path}
        element={<Navigate to={`../${target}`} replace />}
      />
    ))}

    <Route
      path="plan-ready"
      element={<Navigate to="/user/dashboard" replace />}
    />
  </>
);
