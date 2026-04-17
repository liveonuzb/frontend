import React from "react";
import { useTranslation } from "react-i18next";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import SetPasswordForm from "./set-password-form";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 md:p-8 w-full max-w-md">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{t("auth.setPassword.title")}</h1>
          <FieldDescription>
            {t("auth.setPassword.subtitle")}
          </FieldDescription>
        </div>
        <SetPasswordForm />
      </FieldGroup>
    </div>
  );
};

export default Index;
