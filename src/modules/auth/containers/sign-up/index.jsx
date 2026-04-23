import React from "react";
import { Link, useSearchParams } from "react-router";
import { FieldDescription } from "@/components/ui/field";
import { useTranslation } from "react-i18next";
import { useGetQuery } from "@/hooks/api";
import { get } from "lodash";
import { getApiResponseData } from "@/lib/api-response";
import {
  AuthHeader,
  AuthPanel,
  AuthTextFooter,
} from "@/modules/auth/components/auth-panel";

import PhoneForm from "./phone-form";

const Index = ({ className }) => {
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
    <AuthPanel
      className={""}
      footer={
        <AuthTextFooter className={"text-center"}>
          {t("auth.signUp.termsText")}{" "}
          <a href="#">{t("auth.signUp.termsLink")}</a>{" "}
          {t("auth.signUp.andText")}{" "}
          <a href="#">{t("auth.signUp.privacyLink")}</a>
          {t("auth.signUp.termsEnd")}
        </AuthTextFooter>
      }
    >
      <AuthHeader title={t("auth.signUp.title")} />
      {referralCode && referralValid && (
        <div className="rounded-[1.15rem] border border-primary/20 bg-primary/[0.06] px-4 py-3.5 text-center text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          <span className="font-semibold text-primary">
            {referrerName
              ? t("auth.signUp.referralInvitedByName", {
                  name: referrerName,
                })
              : t("auth.signUp.referralInvited")}
          </span>
        </div>
      )}
      <PhoneForm referralCode={referralCode} />

      <FieldDescription className="text-center text-[0.95rem]">
        {t("auth.signUp.haveAccount")}{" "}
        <Link to="/auth/sign-in">{t("auth.signUp.signInLink")}</Link>
      </FieldDescription>
    </AuthPanel>
  );
};

export default Index;
