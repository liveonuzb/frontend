import React from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAuthStore } from "@/store";

import Layout from "@/modules/auth/layout/index.jsx";
import SignInPage from "@/modules/auth/pages/sign-in/index.jsx";
import SignUpPage from "@/modules/auth/pages/sign-up/index.jsx";
import ForgotPasswordPage from "@/modules/auth/pages/forgot-password/index.jsx";
import OtpVerifyPage from "@/modules/auth/pages/otp-verify/index.jsx";
import ResetPasswordPage from "@/modules/auth/pages/reset-password/index.jsx";
import SetPasswordPage from "@/modules/auth/pages/set-password/index.jsx";

const Index = () => {
  const { user } = useAuthStore();
  const passwordSetupRequired = Boolean(user?.passwordSetupRequired);

  return (
    <Routes>
      <Route element={<Layout />}>
        {passwordSetupRequired ? (
          <>
            <Route index element={<Navigate to="set-password" replace />} />
            <Route path={"set-password"} element={<SetPasswordPage />} />
            <Route
              path={"*"}
              element={<Navigate to="set-password" replace />}
            />
          </>
        ) : (
          <>
            <Route index element={<Navigate to="sign-in" replace />} />
            <Route path={"sign-in"} element={<SignInPage />} />
            <Route path={"sign-up"} element={<SignUpPage />} />
            <Route path={"forgot-password"} element={<ForgotPasswordPage />} />
            <Route path={"otp-verify"} element={<OtpVerifyPage />} />
            <Route path={"reset-password"} element={<ResetPasswordPage />} />
            <Route path={"*"} element={<Navigate to="sign-in" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
};

export default Index;
