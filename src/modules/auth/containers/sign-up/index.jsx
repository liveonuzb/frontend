import React from "react";
import { Link, useSearchParams } from "react-router";
import { cn } from "@/lib/utils";
import {
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field";
import { useTranslation } from "react-i18next";
import { useGetQuery } from "@/hooks/api";
import { get } from "lodash";
import { getApiResponseData } from "@/lib/api-response";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  const { data: referralValidation } = useGetQuery({
    url: `/referral/validate/${referralCode}`,
    queryProps: {
      queryKey: ["referral-validate", referralCode],
      enabled: Boolean(referralCode),
      retry: false,
    },
  });

  const referralValidationPayload = getApiResponseData(referralValidation, {});
  const referralValid = get(referralValidationPayload, "valid", false);
  const referrerName = get(referralValidationPayload, "referrerName");

  return (
    <div
      className={cn("flex justify-center flex-col gap-6 max-w-md", className)}
      {...props}
    >
      <div className="p-6 md:p-8">
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t("auth.signUp.title")}</h1>
            <p className="text-muted-foreground text-balance">
              {t("auth.signUp.subtitle")}
            </p>
          </div>

          {referralCode && referralValid && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm">
              <span className="text-primary font-medium">
                {referrerName
                  ? t("auth.signUp.referralInvitedByName", { name: referrerName })
                  : t("auth.signUp.referralInvited")}
              </span>
            </div>
          )}

          <PhoneForm referralCode={referralCode} />

          <FieldDescription className="text-center">
            {t("auth.signUp.haveAccount")}{" "}
            <Link to="/auth/sign-in">{t("auth.signUp.signInLink")}</Link>
          </FieldDescription>
        </FieldGroup>
      </div>
      <FieldDescription className="px-6 text-center">
        {t("auth.signUp.termsText")}{" "}
        <a href="#">{t("auth.signUp.termsLink")}</a> {t("auth.signUp.andText")}{" "}
        <a href="#">{t("auth.signUp.privacyLink")}</a>
        {t("auth.signUp.termsEnd")}
      </FieldDescription>
    </div>
  );
};

export default Index;
