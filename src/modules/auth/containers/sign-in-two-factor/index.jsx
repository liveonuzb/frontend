import React from "react";
import { Link, Navigate } from "react-router";
import { get } from "lodash";
import { useTranslation } from "react-i18next";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";
import { useAuthStore } from "@/store";
import TwoFactorForm from "./two-factor-form.jsx";

const SignInTwoFactorContainer = () => {
  const { t } = useTranslation();
  const twoFactorChallenge = useAuthStore((state) => state.twoFactorChallenge);
  const twoFactorToken = get(twoFactorChallenge, "twoFactorToken");
  const phone = get(twoFactorChallenge, "phone");

  if (!twoFactorToken) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return (
    <AuthPanel
      footer={
        <Link to="/auth/sign-in">{t("auth.otpVerify.backToSignIn")}</Link>
      }
    >
      <AuthHeader
        title={t("auth.signIn.twoFactorTitle")}
        description={
          phone
            ? t("auth.signIn.twoFactorSubtitleWithPhone", { phone })
            : t("auth.signIn.twoFactorSubtitle")
        }
      />
      <TwoFactorForm twoFactorToken={twoFactorToken} />
    </AuthPanel>
  );
};

export default SignInTwoFactorContainer;
