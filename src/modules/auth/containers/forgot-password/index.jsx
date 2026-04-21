import React from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { useTranslation } from "react-i18next";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex justify-center flex-col gap-6 flex-grow max-w-md",
        className,
      )}
      {...props}
    >
      <div className="p-6 md:p-8 ">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">
              {t("auth.forgotPassword.title")}
            </h1>
            <p className="text-muted-foreground text-balance">
              {t("auth.forgotPassword.subtitle")}
            </p>
          </div>

          <PhoneForm />

          <FieldDescription className="text-center">
            {t("auth.forgotPassword.rememberPassword")}{" "}
            <Link to="/auth/sign-in">
              {t("auth.forgotPassword.backToSignIn")}
            </Link>
          </FieldDescription>
        </FieldGroup>
      </div>
    </div>
  );
};

export default Index;
