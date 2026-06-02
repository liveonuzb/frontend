import React, { useState } from "react";
import { CopyIcon, RefreshCwIcon, ShieldIcon } from "lucide-react";
import QRCode from "qrcode";
import map from "lodash/map";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";
import { getRequestErrorMessage } from "@/hooks/app/use-profile-settings";

const OtpInput = ({ value, onChange }) => (
  <InputOTP
    maxLength={6}
    value={value}
    onChange={onChange}
    containerClassName="justify-center"
  >
    <div className="flex items-center justify-center gap-x-2">
      {map(Array.from({ length: 6 }), (_, index) => (
        <InputOTPGroup key={index}>
          <InputOTPSlot index={index} className="size-12" />
        </InputOTPGroup>
      ))}
    </div>
  </InputOTP>
);

export const TwoFactorSection = ({ t }) => {
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

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  const [regenOpen, setRegenOpen] = useState(false);
  const [regenCode, setRegenCode] = useState("");
  const [regenError, setRegenError] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("profile.security.2fa.copySuccess"));
    } catch {
      toast.error(t("profile.security.2fa.copyError"));
    }
  };

  const handleSetupStart = async () => {
    try {
      setIsStarting(true);
      const { data } = await request.post("/users/me/2fa/setup");
      setSetupData(data);
      const qr = await QRCode.toDataURL(data.otpauthUrl, {
        width: 200,
        margin: 1,
      });
      setQrDataUrl(qr);
      setSetupCode("");
      setSetupError("");
      setBackupCodes(null);
      setSetupOpen(true);
    } catch (err) {
      toast.error(
        getRequestErrorMessage(err, t("profile.security.2fa.setupError")),
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleSetupVerify = async () => {
    if (setupCode.length !== 6) return;

    try {
      setIsVerifying(true);
      setSetupError("");
      const { data } = await request.post("/users/me/2fa/verify", {
        code: setupCode,
      });
      setBackupCodes(data.backupCodes);
      refetchStatus();
    } catch {
      setSetupError(t("profile.security.2fa.invalidCode"));
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
      toast.success(t("profile.security.2fa.disableSuccess"));
    } catch {
      setDisableError(t("profile.security.2fa.invalidCode"));
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegen = async () => {
    if (regenCode.length !== 6) return;

    try {
      setIsRegenerating(true);
      setRegenError("");
      const { data } = await request.post(
        "/users/me/2fa/backup-codes/regenerate",
        { code: regenCode },
      );
      setNewBackupCodes(data.backupCodes);
      setRegenCode("");
    } catch {
      setRegenError(t("profile.security.2fa.invalidCode"));
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
                <p className="font-semibold">
                  {t("profile.security.2fa.totpTitle")}
                </p>
                {statusLoading ? (
                  <Skeleton className="h-5 w-16 rounded-full" />
                ) : isEnabled ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600"
                  >
                    {t("profile.security.2fa.enabled")}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground"
                  >
                    {t("profile.security.2fa.disabled")}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("profile.security.2fa.totpDesc")}
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
                {t("profile.security.2fa.disable")}
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
                {t("profile.security.2fa.backupCodes")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isStarting}
              onClick={handleSetupStart}
            >
              {t("profile.security.2fa.enable")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Drawer open={setupOpen} onOpenChange={setSetupOpen} direction="bottom">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {backupCodes
                ? t("profile.security.2fa.backupSaveTitle")
                : t("profile.security.2fa.setupTitle")}
            </DrawerTitle>
            <DrawerDescription>
              {backupCodes
                ? t("profile.security.2fa.backupSaveDesc")
                : t("profile.security.2fa.setupDesc")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-5">
            {backupCodes ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {map(backupCodes, (code, i) => (
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
                  {t("profile.security.2fa.copyAll")}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {qrDataUrl ? (
                  <div className="flex justify-center">
                    <img
                      loading="lazy"
                      src={qrDataUrl}
                      alt={t("profile.security.2fa.qrAlt")}
                      className="size-48 rounded-xl border bg-white p-2"
                    />
                  </div>
                ) : (
                  <Skeleton className="mx-auto size-48 rounded-xl" />
                )}

                {setupData?.secret ? (
                  <details className="rounded-xl border px-4 py-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      {t("profile.security.2fa.manualKey")}
                    </summary>
                    <p className="mt-2 break-all font-mono text-xs">
                      {setupData.secret}
                    </p>
                  </details>
                ) : null}

                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    {t("profile.security.2fa.enterCode")}
                  </p>
                  <OtpInput value={setupCode} onChange={setSetupCode} />
                  {setupError ? (
                    <p className="text-center text-sm text-destructive">
                      {setupError}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            {backupCodes ? (
              <Button type="button" onClick={handleSetupClose}>
                {t("profile.security.2fa.done")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  disabled={setupCode.length !== 6 || isVerifying}
                  onClick={handleSetupVerify}
                >
                  {isVerifying
                    ? t("profile.security.2fa.verifying")
                    : t("profile.security.2fa.verify")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSetupClose}
                >
                  {t("profile.security.2fa.cancel")}
                </Button>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={disableOpen}
        onOpenChange={setDisableOpen}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{t("profile.security.2fa.disableTitle")}</DrawerTitle>
            <DrawerDescription>
              {t("profile.security.2fa.disableDesc")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <OtpInput value={disableCode} onChange={setDisableCode} />
            {disableError ? (
              <p className="text-center text-sm text-destructive">
                {disableError}
              </p>
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={disableCode.length !== 6 || isDisabling}
              onClick={handleDisable}
            >
              {isDisabling
                ? t("profile.security.2fa.disabling")
                : t("profile.security.2fa.disable")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisableOpen(false)}
            >
              {t("profile.security.2fa.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={regenOpen} onOpenChange={setRegenOpen} direction="bottom">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{t("profile.security.2fa.regenTitle")}</DrawerTitle>
            <DrawerDescription>
              {newBackupCodes
                ? t("profile.security.2fa.regenDoneDesc")
                : t("profile.security.2fa.regenDesc")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            {newBackupCodes ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {map(newBackupCodes, (code, i) => (
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
                  {t("profile.security.2fa.copyAll")}
                </Button>
              </div>
            ) : (
              <>
                <OtpInput value={regenCode} onChange={setRegenCode} />
                {regenError ? (
                  <p className="text-center text-sm text-destructive">
                    {regenError}
                  </p>
                ) : null}
              </>
            )}
          </DrawerBody>
          <DrawerFooter>
            {newBackupCodes ? (
              <Button type="button" onClick={() => setRegenOpen(false)}>
                {t("profile.security.2fa.done")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  disabled={regenCode.length !== 6 || isRegenerating}
                  onClick={handleRegen}
                >
                  {isRegenerating
                    ? t("profile.security.2fa.regenerating")
                    : t("profile.security.2fa.regenerate")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegenOpen(false)}
                >
                  {t("profile.security.2fa.cancel")}
                </Button>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
