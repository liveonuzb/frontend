import React from "react";
import { Link } from "react-router";
import { Navigate } from "react-router";
import { FieldDescription } from "@/components/ui/field";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";

import ResetPasswordForm from "./reset-password-form";

const Index = ({ className, ...props }) => {
  const { passwordReset, isHydrated } = useAuthStore();
  const { t } = useTranslation();

  if (!isHydrated) {
    return null;
  }

  if (!get(passwordReset, "resetToken")) {
    return <Navigate to="/auth/forgot-password" replace />;
  }

  return (
    <AuthPanel className={className} {...props}>
      <AuthHeader title={t("auth.resetPassword.title")} />
      <ResetPasswordForm />
      <FieldDescription className="text-center text-[0.95rem]">
        <Link to="/auth/sign-in">{t("auth.otpVerify.backToSignIn")}</Link>
      </FieldDescription>
    </AuthPanel>
  );
};

export default Index;
