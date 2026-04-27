import React from "react";
import { useAuthStore } from "@/store";
import { useTranslation } from "react-i18next";
import { AuthHeader, AuthPanel } from "@/modules/auth/components/auth-panel";

import PhoneForm from "./phone-form";

const Index = ({ className, ...props }) => {
  const { t } = useTranslation();
  const { clearPendingVerification, clearPasswordReset } = useAuthStore();

  React.useEffect(() => {
    if (clearPasswordReset) clearPasswordReset();
    if (clearPendingVerification) clearPendingVerification();
  }, [clearPasswordReset, clearPendingVerification]);

  return (
    <AuthPanel className={className} {...props}>
      <AuthHeader title={t("auth.signIn.title")} />
      <PhoneForm />
    </AuthPanel>
  );
};

export default Index;
