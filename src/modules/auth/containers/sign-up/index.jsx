import React from "react";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useGetQuery } from "@/hooks/api";
import { get } from "lodash";
import { getApiResponseData } from "@/lib/api-response";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";
import { useAuthStore } from "@/store";

import PasswordForm from "./password-form";

const Index = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref") || "";
  const authPhoneFlow = useAuthStore((state) => state.authPhoneFlow);
  const setAuthPhoneFlow = useAuthStore((state) => state.setAuthPhoneFlow);
  const phone = get(authPhoneFlow, "phone");

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

  React.useEffect(() => {
    if (!referralCode || !phone || get(authPhoneFlow, "referralCode")) {
      return;
    }

    setAuthPhoneFlow({
      ...authPhoneFlow,
      referralCode,
    });
  }, [authPhoneFlow, phone, referralCode, setAuthPhoneFlow]);

  if (!phone || get(authPhoneFlow, "flow") !== "register") {
    return <Navigate to={`/auth/sign-in${location.search || ""}`} replace />;
  }

  return (
    <AuthPanel className={""}>
      <AuthHeader title={t("auth.signIn.registerPasswordTitle")} />
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
      <PasswordForm phone={phone} referralCode={referralCode} />
    </AuthPanel>
  );
};

export default Index;
