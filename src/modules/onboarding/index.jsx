import React from "react";
import { Navigate, Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";
import { UserOnboardingRoutes } from "@/modules/onboarding/user/routes.jsx";

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
        <UserOnboardingRoutes />

        <Route
          path="roles"
          element={<Navigate to="/coach/onboarding" replace />}
        />

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
