import React from "react";
import { Route, Routes } from "react-router";

import Layout from "@/modules/onboarding/layout/index.jsx";
import { UserOnboardingRoutes } from "@/modules/onboarding/user/routes.jsx";

const UserOnboardingModule = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <UserOnboardingRoutes />
      </Route>
    </Routes>
  );
};

export default UserOnboardingModule;
