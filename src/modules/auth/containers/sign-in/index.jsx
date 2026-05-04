import React from "react";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { clearPendingVerification, clearPasswordReset, setAuthPhoneFlow } =
    useAuthStore();
  const referralCode = searchParams.get("ref") || null;

  React.useEffect(() => {
    if (clearPasswordReset) clearPasswordReset();
    if (clearPendingVerification) clearPendingVerification();
  }, [clearPasswordReset, clearPendingVerification]);

  React.useEffect(() => {
    setAuthPhoneFlow(null);
  }, [setAuthPhoneFlow]);

  return (
    <AuthPanel className={className} {...props}>
      <AuthHeader title={t("auth.signIn.phoneTitle")} />
      <PhoneForm referralCode={referralCode} />
    </AuthPanel>
  );
};

export default Index;
