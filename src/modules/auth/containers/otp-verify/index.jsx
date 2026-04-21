import React from "react";
import { Link } from "react-router";
import { Navigate } from "react-router";
import { cn } from "@/lib/utils";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import { get } from "lodash";

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
    <div
      className={cn(
        "flex justify-center flex-col gap-6 flex-grow max-w-md",
        className,
      )}
      {...props}
    >
      <div className="p-6 md:p-8">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">
              {isPasswordReset
                ? t("auth.otpVerify.titleReset")
                : t("auth.otpVerify.titleVerify")}
            </h1>
            <p className="text-muted-foreground text-balance">
              {identity
                ? t("auth.otpVerify.subtitleWithId", { identity })
                : t("auth.otpVerify.subtitleDefault")}
            </p>
          </div>
          <OtpForm />
          <FieldDescription className="text-center">
            <Link to="/auth/sign-in">{t("auth.otpVerify.backToSignIn")}</Link>
          </FieldDescription>
        </FieldGroup>
      </div>
    </div>
  );
};

export default Index;
