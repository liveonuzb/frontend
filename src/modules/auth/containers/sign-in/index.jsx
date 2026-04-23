import React from "react";
import { Link } from "react-router";
import { FieldDescription } from "@/components/ui/field";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import {
  AuthHeader,
  AuthPanel,
  AuthTextFooter,
} from "@/modules/auth/components/auth-panel";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const { clearPendingVerification, clearPasswordReset } = useAuthStore();

  React.useEffect(() => {
    if (clearPasswordReset) clearPasswordReset();
    if (clearPendingVerification) clearPendingVerification();
  }, [clearPasswordReset, clearPendingVerification]);

  return (
    <AuthPanel
      className={className}
      footer={
        <AuthTextFooter>
          {t("auth.signIn.termsText")}{" "}
          <a href="#">{t("auth.signIn.termsLink")}</a>{" "}
          {t("auth.signIn.andText")}{" "}
          <a href="#">{t("auth.signIn.privacyLink")}</a>
          {t("auth.signIn.termsEnd")}
        </AuthTextFooter>
      }
      {...props}
    >
      <AuthHeader title={t("auth.signIn.title")} />
      <PhoneForm />
      <FieldDescription className="text-center text-[0.95rem]">
        {t("auth.signIn.noAccount")}{" "}
        <Link to="/auth/sign-up">{t("auth.signIn.signUpLink")}</Link>
      </FieldDescription>
    </AuthPanel>
  );
};

export default Index;
