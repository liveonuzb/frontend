import React from "react";
import { Navigate, Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";

// User onboarding imports
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

// Coach onboarding imports
import CoachEntryPage from "@/modules/onboarding/coach/pages/entry/index.jsx";
import CategoryPage from "@/modules/onboarding/coach/pages/category/index.jsx";
import ExperiencePage from "@/modules/onboarding/coach/pages/experience/index.jsx";
import SpecializationPage from "@/modules/onboarding/coach/pages/specialization/index.jsx";
import TargetAudiencePage from "@/modules/onboarding/coach/pages/target-audience/index.jsx";
import AvailabilityPage from "@/modules/onboarding/coach/pages/availability/index.jsx";
import CertificationPage from "@/modules/onboarding/coach/pages/certification/index.jsx";
import BioPage from "@/modules/onboarding/coach/pages/bio/index.jsx";
import PricingPage from "@/modules/onboarding/coach/pages/pricing/index.jsx";
import CoachLanguagesPage from "@/modules/onboarding/coach/pages/languages/index.jsx";
import CoachAvatarPage from "@/modules/onboarding/coach/pages/avatar/index.jsx";

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<EntryPage />} />

        {/* User Onboarding Routes */}
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

        <Route path="roles" element={<Navigate to="/coach/onboarding" replace />} />

        {/* Coach Onboarding Routes */}
        <Route path="coach" element={<CoachEntryPage />} />
        <Route path="coach/category" element={<CategoryPage />} />
        <Route path="coach/experience" element={<ExperiencePage />} />
        <Route path="coach/specialization" element={<SpecializationPage />} />
        <Route path="coach/target-audience" element={<TargetAudiencePage />} />
        <Route path="coach/availability" element={<AvailabilityPage />} />
        <Route path="coach/certification" element={<CertificationPage />} />
        <Route path="coach/bio" element={<BioPage />} />
        <Route path="coach/pricing" element={<PricingPage />} />
        <Route path="coach/languages" element={<CoachLanguagesPage />} />
        <Route path="coach/avatar" element={<CoachAvatarPage />} />
      </Route>
    </Routes>
  );
};

export default Index;
