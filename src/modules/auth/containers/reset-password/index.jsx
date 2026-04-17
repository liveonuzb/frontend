import React from "react";
import { Link } from "react-router";
import { Navigate } from "react-router";
import { cn } from "@/lib/utils";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import { get } from "lodash";

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
              {t("auth.resetPassword.title")}
            </h1>
            <p className="text-muted-foreground text-balance">
              {t("auth.resetPassword.subtitle")}
            </p>
          </div>

          <ResetPasswordForm />

          <FieldDescription className="text-center">
            <Link to="/auth/sign-in">{t("auth.otpVerify.backToSignIn")}</Link>
          </FieldDescription>
        </FieldGroup>
      </div>
    </div>
  );
};

export default Index;
