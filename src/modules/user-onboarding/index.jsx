import React from "react";
import { Route } from "react-router";

import Layout from "@/modules/user-onboarding/layout/index.jsx";
import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import EntryPage from "@/modules/user-onboarding/pages/entry/index.jsx";
import NamePage from "@/modules/user-onboarding/pages/name/index.jsx";
import GenderPage from "@/modules/user-onboarding/pages/gender/index.jsx";
import AgePage from "@/modules/user-onboarding/pages/age/index.jsx";
import HeightPage from "@/modules/user-onboarding/pages/height/index.jsx";
import CurrentWeightPage from "@/modules/user-onboarding/pages/current-weight/index.jsx";
import GoalPage from "@/modules/user-onboarding/pages/goal/index.jsx";
import TargetWeightPage from "@/modules/user-onboarding/pages/target-weight/index.jsx";
import WeeklyPacePage from "@/modules/user-onboarding/pages/weekly-pace/index.jsx";
import ActivityLevelPage from "@/modules/user-onboarding/pages/activity-level/index.jsx";
import MealFrequencyPage from "@/modules/user-onboarding/pages/meal-frequency/index.jsx";
import DietRequirementsPage from "@/modules/user-onboarding/pages/diet-requirements/index.jsx";
import HealthConstraintsPage from "@/modules/user-onboarding/pages/health-constraints/index.jsx";
import ReviewPage from "@/modules/user-onboarding/pages/review/index.jsx";
import ReportPage from "@/modules/user-onboarding/pages/report/index.jsx";
import PersonalizingPage from "@/modules/user-onboarding/pages/personalizing/index.jsx";
import PersonalizationResultPage from "@/modules/user-onboarding/pages/result/index.jsx";

const UserOnboardingModule = () => {
  return (
    <ProfileAwareRoutes>
      <Route element={<Layout />}>
        <Route index element={<EntryPage />} />
        <Route path="name" element={<NamePage />} />
        <Route path="gender" element={<GenderPage />} />
        <Route path="age" element={<AgePage />} />
        <Route path="height" element={<HeightPage />} />
        <Route path="current-weight" element={<CurrentWeightPage />} />
        <Route path="goal" element={<GoalPage />} />
        <Route path="target-weight" element={<TargetWeightPage />} />
        <Route path="weekly-pace" element={<WeeklyPacePage />} />
        <Route path="activity-level" element={<ActivityLevelPage />} />
        <Route path="meal-frequency" element={<MealFrequencyPage />} />
        <Route path="diet-requirements" element={<DietRequirementsPage />} />
        <Route path="health-constraints" element={<HealthConstraintsPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="report" element={<ReportPage />} />
        <Route path="metabolism-calculating" element={<PersonalizingPage />} />
        <Route
          path="metabolism-calculating/:jobId"
          element={<PersonalizingPage />}
        />
        <Route
          path="metabolism-result"
          element={<PersonalizationResultPage />}
        />

        <Route path="*" element={<EntryPage />} />
      </Route>
    </ProfileAwareRoutes>
  );
};

export default UserOnboardingModule;
