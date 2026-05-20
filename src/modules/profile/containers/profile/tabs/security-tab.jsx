import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DownloadIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DrawerFooter } from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/password-strength";
import { usePostQuery } from "@/hooks/api";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import { isStrongPassword } from "@/modules/auth/lib/password-policy.js";
import { useAuthStore } from "@/store";
import useApi from "@/hooks/api/use-api";
import { ActiveSessionsSection } from "./security/active-sessions-section.jsx";
import { SecurityActivitySection } from "./security/security-activity-section.jsx";
import { TwoFactorSection } from "./security/two-factor-section.jsx";

export { ActiveSessionsSection, SecurityActivitySection, TwoFactorSection };

const createInitialPasswordForm = () => ({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// ─── PasswordSection ──────────────────────────────────────────────────────────

const PasswordSection = ({
  embedded,
  isSavingSecurity,
  passwordError,
  passwordForm,
  setPasswordForm,
  handlePasswordSave,
  t,
}) => (
  <Card className="py-6 shadow-none">
    <CardHeader className={embedded ? "pb-2" : "items-center pb-2 text-center"}>
      <CardTitle className="text-xl font-semibold">
        {t("profile.security.password.title")}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-5 p-6 sm:p-8">
      <Field>
        <FieldLabel>{t("profile.security.password.current")}</FieldLabel>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder={t("profile.security.password.current")}
          value={passwordForm.currentPassword}
          onChange={(event) =>
            setPasswordForm((current) => ({
              ...current,
              currentPassword: event.target.value,
            }))
          }
        />
      </Field>
      <Field>
        <FieldLabel>{t("profile.security.password.new")}</FieldLabel>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t("profile.security.password.new")}
          value={passwordForm.newPassword}
          onChange={(event) =>
            setPasswordForm((current) => ({
              ...current,
              newPassword: event.target.value,
            }))
          }
        />
        <FieldDescription>{t("profile.security.password.hint")}</FieldDescription>
        <PasswordStrength password={passwordForm.newPassword} />
      </Field>
      <Field>
        <FieldLabel>{t("profile.security.password.confirm")}</FieldLabel>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={t("profile.security.password.confirm")}
          value={passwordForm.confirmPassword}
          onChange={(event) =>
            setPasswordForm((current) => ({
              ...current,
              confirmPassword: event.target.value,
            }))
          }
        />
      </Field>
      <FieldError>{passwordError}</FieldError>
      {!embedded ? (
        <Button type="button" disabled={isSavingSecurity} onClick={handlePasswordSave}>
          {isSavingSecurity ? t("profile.general.saving") : t("profile.general.save")}
        </Button>
      ) : null}
    </CardContent>
  </Card>
);

// ─── AccountSection ───────────────────────────────────────────────────────────

const AccountSection = ({ isExporting, handleExport, t }) => (
  <Card className="mt-6 py-6 shadow-none">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold">
        {t("profile.security.account.title")}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 p-6">
      <div className="rounded-2xl border p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <DownloadIcon className="size-4" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold">{t("profile.security.account.export")}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("profile.security.account.exportDesc")}
            </p>
            <Button type="button" variant="outline" disabled={isExporting} onClick={handleExport}>
              <DownloadIcon className="size-4" />
              {isExporting
                ? t("profile.security.account.exportLoading")
                : t("profile.security.account.exportButton")}
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── SecurityTab ──────────────────────────────────────────────────────────────

export const SecurityTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const { changePassword, isSavingSecurity } = useProfileSettings();
  const { mutateAsync: logoutRequest, isPending: isLoggingOut } = usePostQuery();
  const [passwordForm, setPasswordForm] = useState(createInitialPasswordForm);
  const [passwordError, setPasswordError] = useState("");
  const { request } = useApi();
  const [isExporting, setIsExporting] = useState(false);

  const handlePasswordSave = React.useCallback(async () => {
    if (!passwordForm.currentPassword) {
      setPasswordError(t("profile.security.password.errorRequired"));
      return;
    }
    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordError(t("profile.security.password.errorLength"));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("profile.security.password.errorMismatch"));
      return;
    }
    try {
      setPasswordError("");
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(createInitialPasswordForm());
      toast.success(t("profile.security.password.success"));
      logout();
      queryClient.clear();
      navigate("/auth/sign-in", { replace: true });
    } catch (error) {
      setPasswordError(
        getRequestErrorMessage(error, t("profile.security.password.error")),
      );
    }
  }, [changePassword, logout, navigate, passwordForm, queryClient, t]);

  const handleLogout = React.useCallback(async () => {
    try {
      if (refreshToken) {
        await logoutRequest({ url: "/auth/logout", attributes: { refreshToken } });
      }
    } catch {
      // no-op
    } finally {
      logout();
      queryClient.clear();
      navigate("/auth/sign-in", { replace: true });
    }
  }, [logout, logoutRequest, navigate, queryClient, refreshToken]);

  const handleExport = React.useCallback(async () => {
    try {
      setIsExporting(true);
      const { data } = await request.get("/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mening_malumotlarim.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("profile.security.account.exportSuccess"));
    } catch (error) {
      toast.error(getRequestErrorMessage(error, t("profile.security.account.exportError")));
    } finally {
      setIsExporting(false);
    }
  }, [request, t]);

  const content = (
    <div className="space-y-6">
      <div className={embedded ? undefined : "mx-auto max-w-3xl"}>
        <PasswordSection
          embedded={embedded}
          isSavingSecurity={isSavingSecurity}
          passwordError={passwordError}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          handlePasswordSave={handlePasswordSave}
          t={t}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TwoFactorSection t={t} />
        <div className="flex flex-col">
          <ActiveSessionsSection
            handleLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            t={t}
          />
          <SecurityActivitySection t={t} />
          <AccountSection
            isExporting={isExporting}
            handleExport={handleExport}
            t={t}
          />
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8 sm:px-6">{content}</div>
        <DrawerFooter>
          <Button type="button" disabled={isSavingSecurity} onClick={handlePasswordSave}>
            {isSavingSecurity
              ? t("profile.general.saving")
              : t("profile.security.password.title")}
          </Button>
        </DrawerFooter>
      </div>
    );
  }

  return content;
};
