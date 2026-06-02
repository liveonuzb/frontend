import React from "react";
import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";
import { useAuthStore } from "@/store";
import PasswordForm from "./password-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const authPhoneFlow = useAuthStore((state) => state.authPhoneFlow);
  const phone = get(authPhoneFlow, "phone");

  if (!phone || get(authPhoneFlow, "flow") !== "login") {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return (
    <AuthPanel className={className} {...props}>
      <AuthHeader title={t("auth.signIn.loginPasswordTitle")} />
      <PasswordForm phone={phone} />
    </AuthPanel>
  );
};

export default Index;
