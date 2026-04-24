import React from "react";
import { Link } from "react-router";
import { Navigate } from "react-router";
import { FieldDescription } from "@/components/ui/field";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";
import OtpForm from "./otp-form";

const Index = ({ className, ...props }) => {
  const { pendingVerification, isHydrated } = useAuthStore();
  const { t } = useTranslation();

  if (!isHydrated) {
    return null;
  }

  if (!pendingVerification) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  const identity = get(pendingVerification, "phone");
  const isPasswordReset =
    get(pendingVerification, "purpose") === "PASSWORD_RESET";

  return (
    <AuthPanel className={className} {...props}>
      <AuthHeader
        title={
          isPasswordReset
            ? t("auth.otpVerify.titleReset")
            : t("auth.otpVerify.titleVerify")
        }
        description={
          identity
            ? t("auth.otpVerify.subtitleWithId", { identity })
            : t("auth.otpVerify.subtitleDefault")
        }
      />

      <OtpForm />
      <FieldDescription className="text-center text-[0.95rem]">
        <Link to="/auth/sign-in">{t("auth.otpVerify.backToSignIn")}</Link>
      </FieldDescription>
    </AuthPanel>
  );
};

export default Index;
