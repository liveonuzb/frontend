import React from "react";
import { Link } from "react-router";
import { FieldDescription } from "@/components/ui/field";
import { useTranslation } from "react-i18next";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();

  return (
    <AuthPanel className={className} {...props}>
      <AuthHeader
        title={t("auth.forgotPassword.title")}
        description={t("auth.forgotPassword.subtitle")}
      />

      <PhoneForm />

      <FieldDescription className="text-center text-[0.95rem]">
        {t("auth.forgotPassword.rememberPassword")}{" "}
        <Link to="/auth/sign-in">{t("auth.forgotPassword.backToSignIn")}</Link>
      </FieldDescription>
    </AuthPanel>
  );
};

export default Index;
