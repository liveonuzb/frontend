import React from "react";
import { Navigate, Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";
import { renderUserOnboardingRoutes } from "@/modules/onboarding/user/routes.jsx";

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {renderUserOnboardingRoutes()}

        <Route
          path="roles"
          element={<Navigate to="/user/onboarding" replace />}
        />
      </Route>
    </Routes>
  );
};

export default Index;
