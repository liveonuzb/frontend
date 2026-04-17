import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  LogOutIcon,
  SmartphoneIcon,
  MonitorIcon,
  CopyIcon,
  RefreshCwIcon,
  ShieldIcon,
  DownloadIcon,
  UserXIcon,
  CheckCircle2Icon,
  XCircleIcon,
  KeyRoundIcon,
  AtSignIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QRCode from "qrcode";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "@/components/password-strength";
import { useGetQuery, useDeleteQuery, usePostQuery } from "@/hooks/api";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import { useAuthStore } from "@/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useApi from "@/hooks/api/use-api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OtpInput = ({ value, onChange }) => (
  <InputOTP maxLength={6} value={value} onChange={onChange} containerClassName="justify-center">
    <div className="flex items-center justify-center gap-x-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <InputOTPGroup key={index}>
          <InputOTPSlot index={index} className="size-12" />
        </InputOTPGroup>
      ))}
    </div>
  </InputOTP>
);

const parseDevice = (ua) => {
  if (!ua) return { label: "Noma'lum qurilma", Icon: MonitorIcon };
  const lower = ua.toLowerCase();
  if (
    lower.includes("android") ||
    lower.includes("iphone") ||
    lower.includes("ipad") ||
    lower.includes("mobile")
  )
    return { label: "Mobil qurilma", Icon: SmartphoneIcon };
  return { label: "Kompyuter", Icon: MonitorIcon };
};

const formatLastSeen = (date) => {
  if (!date) return "";
  try {
    return format(new Date(date), "dd.MM.yyyy HH:mm");
  } catch {
    return "";
  }
};

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

// ─── TwoFactorSection ─────────────────────────────────────────────────────────

const TwoFactorSection = ({ t }) => {
  const { request } = useApi();

  const {
    data: statusData,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useGetQuery({
    url: "/users/me/2fa/status",
    queryProps: { queryKey: ["me", "2fa-status"] },
  });

  const isEnabled = statusData?.data?.enabled ?? false;

  // Setup state
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Disable state
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  // Regen backup codes state
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenCode, setRegenCode] = useState("");
  const [regenError, setRegenError] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Nusxa olindi");
    } catch {
      toast.error("Nusxa olishda xatolik");
    }
  };

  const handleSetupStart = async () => {
    try {
      setIsStarting(true);
      const { data } = await request.post("/users/me/2fa/setup");
      setSetupData(data);
      const qr = await QRCode.toDataURL(data.otpauthUrl, { width: 200, margin: 1 });
      setQrDataUrl(qr);
      setSetupCode("");
      setSetupError("");
      setBackupCodes(null);
      setSetupOpen(true);
    } catch (err) {
      toast.error(getRequestErrorMessage(err, "2FA sozlanmadi"));
    } finally {
      setIsStarting(false);
    }
  };

  const handleSetupVerify = async () => {
    if (setupCode.length !== 6) return;
    try {
      setIsVerifying(true);
      setSetupError("");
      const { data } = await request.post("/users/me/2fa/verify", { code: setupCode });
      setBackupCodes(data.backupCodes);
      refetchStatus();
    } catch {
      setSetupError("Noto'g'ri kod. Qayta urinib ko'ring.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetupClose = () => {
    setSetupOpen(false);
    setSetupData(null);
    setQrDataUrl(null);
    setSetupCode("");
    setSetupError("");
    setBackupCodes(null);
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) return;
    try {
      setIsDisabling(true);
      setDisableError("");
      await request.delete("/users/me/2fa", { data: { code: disableCode } });
      refetchStatus();
      setDisableOpen(false);
      setDisableCode("");
      toast.success("2FA o'chirildi");
    } catch {
      setDisableError("Noto'g'ri kod. Qayta urinib ko'ring.");
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegen = async () => {
    if (regenCode.length !== 6) return;
    try {
      setIsRegenerating(true);
      setRegenError("");
      const { data } = await request.post("/users/me/2fa/backup-codes/regenerate", {
        code: regenCode,
      });
      setNewBackupCodes(data.backupCodes);
      setRegenCode("");
    } catch {
      setRegenError("Noto'g'ri kod. Qayta urinib ko'ring.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
      <Card className="py-6 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            {t("profile.security.2fa.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-4 rounded-2xl border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Ikki bosqichli tasdiqlash (TOTP)</p>
                {statusLoading ? (
                  <Skeleton className="h-5 w-16 rounded-full" />
                ) : isEnabled ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600"
                  >
                    Faol
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    O&apos;chirilgan
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Google Authenticator yoki Authy orqali kirish paytida tasdiqlash.
              </p>
            </div>
          </div>

          {statusLoading ? (
            <Skeleton className="h-9 w-32 rounded-xl" />
          ) : isEnabled ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisableCode("");
                  setDisableError("");
                  setDisableOpen(true);
                }}
              >
                2FA o&apos;chirish
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRegenCode("");
                  setRegenError("");
                  setNewBackupCodes(null);
                  setRegenOpen(true);
                }}
              >
                <RefreshCwIcon className="size-3.5" />
                Zaxira kodlar
              </Button>
            </div>
          ) : (
            <Button type="button" size="sm" disabled={isStarting} onClick={handleSetupStart}>
              2FA yoqish
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Drawer */}
      <Drawer open={setupOpen} onOpenChange={setSetupOpen} direction="bottom">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {backupCodes ? "Zaxira kodlarni saqlang" : "2FA Sozlash"}
            </DrawerTitle>
            <DrawerDescription>
              {backupCodes
                ? "Bu kodlarni xavfsiz joyda saqlang. Ularni qaytarib ko'rsatilmaydi."
                : "Google Authenticator yoki Authy ilovasida QR kodni skanerlang."}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-5">
            {backupCodes ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="rounded-xl border bg-muted/40 px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join("\n"))}
                >
                  <CopyIcon className="size-3.5" />
                  Hammasini nusxa olish
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {qrDataUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={qrDataUrl}
                      alt="2FA QR code"
                      className="size-48 rounded-xl border bg-white p-2"
                    />
                  </div>
                ) : (
                  <Skeleton className="mx-auto size-48 rounded-xl" />
                )}

                {setupData?.secret ? (
                  <details className="rounded-xl border px-4 py-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Qo&apos;lda kiritish uchun kalit
                    </summary>
                    <p className="mt-2 break-all font-mono text-xs">{setupData.secret}</p>
                  </details>
                ) : null}

                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    Ilovadagi 6 raqamli kodni kiriting
                  </p>
                  <OtpInput value={setupCode} onChange={setSetupCode} />
                  {setupError ? (
                    <p className="text-center text-sm text-destructive">{setupError}</p>
                  ) : null}
                </div>
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            {backupCodes ? (
              <Button type="button" onClick={handleSetupClose}>
                Tayyor
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  disabled={setupCode.length !== 6 || isVerifying}
                  onClick={handleSetupVerify}
                >
                  {isVerifying ? "Tekshirilmoqda..." : "Tasdiqlash"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSetupClose}>
                  Bekor qilish
                </Button>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Disable Drawer */}
      <Drawer open={disableOpen} onOpenChange={setDisableOpen} direction="bottom">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>2FA o&apos;chirish</DrawerTitle>
            <DrawerDescription>
              Tasdiqlash ilovasidagi 6 raqamli kodni kiriting.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <OtpInput value={disableCode} onChange={setDisableCode} />
            {disableError ? (
              <p className="text-center text-sm text-destructive">{disableError}</p>
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={disableCode.length !== 6 || isDisabling}
              onClick={handleDisable}
            >
              {isDisabling ? "O'chirilmoqda..." : "2FA o'chirish"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDisableOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Regen Backup Codes Drawer */}
      <Drawer open={regenOpen} onOpenChange={setRegenOpen} direction="bottom">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Zaxira kodlarni yangilash</DrawerTitle>
            <DrawerDescription>
              {newBackupCodes
                ? "Eski kodlar endi ishlamaydi. Yangilarini xavfsiz saqlang."
                : "Tasdiqlash uchun 6 raqamli kodni kiriting."}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            {newBackupCodes ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {newBackupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="rounded-xl border bg-muted/40 px-3 py-2 text-center font-mono text-sm font-semibold tracking-wider"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newBackupCodes.join("\n"))}
                >
                  <CopyIcon className="size-3.5" />
                  Hammasini nusxa olish
                </Button>
              </div>
            ) : (
              <>
                <OtpInput value={regenCode} onChange={setRegenCode} />
                {regenError ? (
                  <p className="text-center text-sm text-destructive">{regenError}</p>
                ) : null}
              </>
            )}
          </DrawerBody>
          <DrawerFooter>
            {newBackupCodes ? (
              <Button type="button" onClick={() => setRegenOpen(false)}>
                Tayyor
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  disabled={regenCode.length !== 6 || isRegenerating}
                  onClick={handleRegen}
                >
                  {isRegenerating ? "Yangilanmoqda..." : "Yangilash"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setRegenOpen(false)}>
                  Bekor qilish
                </Button>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// ─── ActiveSessionsSection ────────────────────────────────────────────────────

const ActiveSessionsSection = ({ handleLogout, isLoggingOut, t }) => {
  const { request } = useApi();
  const [revokingId, setRevokingId] = useState(null);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useGetQuery({
    url: "/users/me/sessions",
    queryProps: { queryKey: ["me", "sessions"] },
  });

  const sessions = sessionsData?.data ?? [];
  const currentSessionId = sessions[0]?.id;

  const handleRevoke = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      await request.delete(`/users/me/sessions/${sessionId}`);
      await refetchSessions();
      toast.success("Sessiya tugatildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card className="py-6 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {t("profile.security.session.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-6">
        {sessionsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
            Faol sessiyalar topilmadi
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const { label, Icon } = parseDevice(session.userAgent);
              const isCurrent = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold">{label}</p>
                        {isCurrent ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 py-0 text-[10px] text-emerald-600"
                          >
                            Bu qurilma
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress ?? "—"} · {formatLastSeen(session.lastSeenAt)}
                      </p>
                    </div>
                  </div>
                  {!isCurrent ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={revokingId === session.id}
                      onClick={() => handleRevoke(session.id)}
                    >
                      {revokingId === session.id ? "..." : "Chiqish"}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <Button type="button" variant="outline" disabled={isLoggingOut} onClick={handleLogout}>
          <LogOutIcon className="size-4" />
          {isLoggingOut
            ? t("profile.security.session.loading")
            : t("profile.security.session.button")}
        </Button>
      </CardContent>
    </Card>
  );
};

// ─── SecurityActivitySection ──────────────────────────────────────────────────

const ACTIVITY_CONFIG = {
  login_success: {
    label: "Muvaffaqiyatli kirish",
    Icon: CheckCircle2Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  login_failed: {
    label: "Muvaffaqiyatsiz kirish urinishi",
    Icon: XCircleIcon,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  contact_changed: {
    label: "Kontakt o'zgartirildi",
    Icon: AtSignIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  password_reset: {
    label: "Parol tiklandi",
    Icon: KeyRoundIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
};

const SecurityActivitySection = ({ t }) => {
  const { data, isLoading } = useGetQuery({
    url: "/users/me/security/activity",
    queryProps: { queryKey: ["me", "security-activity"] },
  });

  const items = data?.data?.items ?? [];

  return (
    <Card className="mt-6 py-6 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {t("profile.security.activity.title", { defaultValue: "Xavfsizlik faoliyati" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-6">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
            Faoliyat tarixi yo&apos;q
          </div>
        ) : (
          items.slice(0, 10).map((item) => {
            const config = ACTIVITY_CONFIG[item.type] ?? {
              label: item.type,
              Icon: ShieldIcon,
              color: "text-muted-foreground",
              bg: "bg-muted/40",
            };
            const { label, Icon, color, bg } = config;
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border p-3"
              >
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${bg}`}>
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  {item.ipAddress ? (
                    <p className="text-xs text-muted-foreground">
                      {item.ipAddress}
                      {item.userAgent ? ` · ${item.userAgent.slice(0, 60)}` : ""}
                    </p>
                  ) : null}
                  {item.detail ? (
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  ) : null}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString("uz-UZ")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

// ─── AccountSection ───────────────────────────────────────────────────────────

const AccountSection = ({ isExporting, handleExport, isDeleting, handleDeleteAccount, t }) => (
  <Card className="mt-6 border-destructive/20 py-6 shadow-none">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-semibold text-destructive">
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

      <div className="rounded-2xl border border-destructive/30 p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <UserXIcon className="size-4" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-destructive">
              {t("profile.security.account.delete")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("profile.security.account.deleteDesc")}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isDeleting}>
                  <UserXIcon className="size-4" />
                  {isDeleting
                    ? t("profile.security.account.deleteLoading")
                    : t("profile.security.account.deleteButton")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("profile.security.account.deleteConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("profile.security.account.deleteConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("profile.general.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAccount();
                    }}
                  >
                    {t("profile.security.account.deleteConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
  const { mutateAsync: deleteAccount, isPending: isDeleting } = useDeleteQuery();
  const [isExporting, setIsExporting] = useState(false);

  const handlePasswordSave = React.useCallback(async () => {
    if (!passwordForm.currentPassword) {
      setPasswordError(t("profile.security.password.errorRequired"));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
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
    } catch (error) {
      setPasswordError(
        getRequestErrorMessage(error, t("profile.security.password.error")),
      );
    }
  }, [changePassword, passwordForm, t]);

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

  const handleDeleteAccount = React.useCallback(async () => {
    try {
      await deleteAccount({ url: "/users/me" });
      toast.success(t("profile.security.account.deleteSuccess"));
      logout();
      queryClient.clear();
      navigate("/auth/sign-up", { replace: true });
    } catch (error) {
      toast.error(getRequestErrorMessage(error, t("profile.security.account.deleteError")));
    }
  }, [deleteAccount, logout, navigate, queryClient, t]);

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
            isDeleting={isDeleting}
            handleDeleteAccount={handleDeleteAccount}
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
