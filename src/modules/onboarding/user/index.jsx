import React from "react";
import { Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";
import { renderUserOnboardingRoutes } from "@/modules/onboarding/user/routes.jsx";

const UserOnboardingModule = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {renderUserOnboardingRoutes()}
      </Route>
    </Routes>
  );
};

export default UserOnboardingModule;
