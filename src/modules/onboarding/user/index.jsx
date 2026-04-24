import React from "react";
import { Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";
import EntryPage from "@/modules/onboarding/user/pages/entry/index.jsx";
import NamePage from "@/modules/onboarding/user/pages/name/index.jsx";
import GenderPage from "@/modules/onboarding/user/pages/gender/index.jsx";
import AgePage from "@/modules/onboarding/user/pages/age/index.jsx";
import HeightPage from "@/modules/onboarding/user/pages/height/index.jsx";
import CurrentWeightPage from "@/modules/onboarding/user/pages/current-weight/index.jsx";
import GoalPage from "@/modules/onboarding/user/pages/goal/index.jsx";
import TargetWeightPage from "@/modules/onboarding/user/pages/target-weight/index.jsx";
import WeeklyPacePage from "@/modules/onboarding/user/pages/weekly-pace/index.jsx";
import ActivityLevelPage from "@/modules/onboarding/user/pages/activity-level/index.jsx";
import MealFrequencyPage from "@/modules/onboarding/user/pages/meal-frequency/index.jsx";
import WaterHabitsPage from "@/modules/onboarding/user/pages/water-habits/index.jsx";
import DietRestrictionsPage from "@/modules/onboarding/user/pages/diet-restrictions/index.jsx";
import ReportPage from "@/modules/onboarding/user/pages/report/index.jsx";

const UserOnboardingModule = () => {
  return (
    <Routes>
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
        <Route path="water-habits" element={<WaterHabitsPage />} />
        <Route path="diet-restrictions" element={<DietRestrictionsPage />} />
        <Route path="report" element={<ReportPage />} />
      </Route>
    </Routes>
  );
};

export default UserOnboardingModule;
