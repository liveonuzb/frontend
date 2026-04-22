import React from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import {
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const clearPasswordReset = useAuthStore((state) =>
    state.clearPasswordReset,
  );
  const clearPendingVerification = useAuthStore((state) =>
    state.clearPendingVerification,
  );

  React.useEffect(() => {
    if (clearPasswordReset) clearPasswordReset();
    if (clearPendingVerification) clearPendingVerification();
  }, [clearPasswordReset, clearPendingVerification]);

  return (
    <div
      className={cn("flex justify-center flex-col gap-6 max-w-md", className)}
      {...props}
    >
      <div className="p-6 md:p-8">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t("auth.signIn.title")}</h1>
            <p className="text-muted-foreground text-balance">
              {t("auth.signIn.subtitle")}
            </p>
          </div>

          <PhoneForm />

          <FieldDescription className="text-center">
            {t("auth.signIn.noAccount")}{" "}
            <Link to="/auth/sign-up">{t("auth.signIn.signUpLink")}</Link>
          </FieldDescription>
        </FieldGroup>
      </div>
      <FieldDescription className="px-6 text-center">
        {t("auth.signIn.termsText")}{" "}
        <a href="#">{t("auth.signIn.termsLink")}</a> {t("auth.signIn.andText")}{" "}
        <a href="#">{t("auth.signIn.privacyLink")}</a>
        {t("auth.signIn.termsEnd")}
      </FieldDescription>
    </div>
  );
};

export default Index;
