import React from "react";
import { Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";
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

const CoachOnboardingModule = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CoachEntryPage />} />
        <Route path="category" element={<CategoryPage />} />
        <Route path="experience" element={<ExperiencePage />} />
        <Route path="specialization" element={<SpecializationPage />} />
        <Route path="target-audience" element={<TargetAudiencePage />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="certification" element={<CertificationPage />} />
        <Route path="bio" element={<BioPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="languages" element={<CoachLanguagesPage />} />
        <Route path="avatar" element={<CoachAvatarPage />} />
      </Route>
    </Routes>
  );
};

export default CoachOnboardingModule;
