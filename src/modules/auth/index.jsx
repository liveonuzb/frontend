import React from "react";
import { Navigate, Route, Routes } from "react-router";
import { useAuthStore } from "@/store";
import { applyTheme } from "@/lib/user-preferences";

import Layout from "@/modules/auth/layout/index.jsx";
import SelectLanguagePage from "@/pages/select-language/index.jsx";
import SelectModePage from "@/pages/select-mode/index.jsx";
import SignInPage from "@/modules/auth/pages/sign-in/index.jsx";
import SignInPasswordPage from "@/modules/auth/pages/sign-in-password/index.jsx";
import SignUpPage from "@/modules/auth/pages/sign-up/index.jsx";
import ForgotPasswordPage from "@/modules/auth/pages/forgot-password/index.jsx";
import OtpVerifyPage from "@/modules/auth/pages/otp-verify/index.jsx";
import ResetPasswordPage from "@/modules/auth/pages/reset-password/index.jsx";
import SetPasswordPage from "@/modules/auth/pages/set-password/index.jsx";

const Index = () => {
  const { user } = useAuthStore();
  const passwordSetupRequired = Boolean(user?.passwordSetupRequired);

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    const hadDarkClass = root.classList.contains("dark");
    const storedTheme = window.localStorage.getItem("theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      root.classList.toggle("dark", storedTheme === "dark");
    } else {
      root.classList.add("dark");
    }

    return () => {
      const persistedTheme = window.localStorage.getItem("theme");

      if (persistedTheme === "light" || persistedTheme === "dark") {
        applyTheme(persistedTheme);
        return;
      }

      root.classList.toggle("dark", hadDarkClass);
    };
  }, []);

  return (
    <Routes>
      {/* Full-page routes — no auth layout wrapper */}
      <Route path="select-language" element={<SelectLanguagePage />} />
      <Route path="select-mode" element={<SelectModePage />} />

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
            <Route path={"sign-in/password"} element={<SignInPasswordPage />} />
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
