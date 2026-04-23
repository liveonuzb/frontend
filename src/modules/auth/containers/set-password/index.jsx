import React from "react";
import { useTranslation } from "react-i18next";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";
import SetPasswordForm from "./set-password-form";

const Index = () => {
  const { t } = useTranslation();

  return (
    <AuthPanel>
      <AuthHeader title={t("auth.setPassword.title")} />
      <SetPasswordForm />
    </AuthPanel>
  );
};

export default Index;
