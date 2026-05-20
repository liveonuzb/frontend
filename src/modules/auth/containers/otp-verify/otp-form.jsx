import React, { useState, useEffect, useCallback } from "react";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
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

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getAuthResponseData,
  getOtpToastDescription,
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils.js";
import { getApiRetryAfterSeconds } from "@/lib/api-response.js";
import { useAuthMobileAutoFocus } from "@/modules/auth/lib/mobile-keyboard";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { trackLaunchEvent } from "@/lib/analytics.js";

const RESEND_COOLDOWN = 60;

const getSecondsUntil = (expiresAt) => {
  if (!expiresAt) {
    return null;
  }

  const timestamp = new Date(expiresAt).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
};

const OtpForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const {
    completeAuthentication,
    pendingVerification,
    setPasswordReset,
    setPendingVerification,
  } = useAuthStore();
  const otpAutoFocus = useAuthMobileAutoFocus();

  const [expiryCountdown, setExpiryCountdown] = useState(() =>
    getSecondsUntil(get(pendingVerification, "expiresAt")),
  );
  const [countdown, setCountdown] = useState(() =>
    getSecondsUntil(get(pendingVerification, "expiresAt")) === 0
      ? 0
      : RESEND_COOLDOWN,
  );

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const updateExpiryCountdown = () => {
      const nextExpiryCountdown = getSecondsUntil(
        get(pendingVerification, "expiresAt"),
      );
      setExpiryCountdown(nextExpiryCountdown);
      if (nextExpiryCountdown === 0) {
        setCountdown(0);
      }
    };

    updateExpiryCountdown();
    const timer = setInterval(updateExpiryCountdown, 1000);
    return () => clearInterval(timer);
  }, [pendingVerification]);

  const schema = z.object({
    otp: z
      .string()
      .min(6, t("auth.validation.otpMin"))
      .max(6, t("auth.validation.otpMax")),
  });

  const { mutateAsync: verifyOtp, isPending } = usePostQuery();
  const { mutateAsync: resendOtp, isPending: isResendingOtp } = usePostQuery();

  const { control, handleSubmit, formState, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { otp: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    if (expiryCountdown === 0) {
      setError("otp", {
        type: "expired",
        message: t("auth.otpVerify.expired"),
      });
      return;
    }

    if (!pendingVerification) {
      toast.error(t("auth.otpVerify.sessionMissing"));
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    const phone = get(pendingVerification, "phone");
    if (!phone) {
      toast.error(t("auth.otpVerify.phoneSessionMissing"));
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    await verifyOtp(
      {
        url: "/auth/verify-otp",
        attributes: {
          code: get(values, "otp"),
          purpose: get(pendingVerification, "purpose"),
          phone,
        },
      },
      {
        onSuccess: (response) => {
          const responseData = getAuthResponseData(response);
          const verification = pendingVerification;

          if (get(verification, "purpose") === "VERIFY_ACCOUNT") {
            void trackLaunchEvent("otp_verified", {
              source: "auth",
              properties: {
                purpose: "VERIFY_ACCOUNT",
              },
            });
            completeAuthentication(responseData);
            queryClient.setQueryData(["me"], {
              data: get(responseData, "user"),
            });
            toast.success(
              get(responseData, "message") ||
                t("auth.otpVerify.accountVerified"),
            );
            navigate(getPostAuthRoute(get(responseData, "user")), {
              replace: true,
            });
            return;
          }

          if (!get(responseData, "resetToken")) {
            toast.error(t("auth.otpVerify.resetTokenMissing"));
            navigate("/auth/forgot-password", { replace: true });
            return;
          }

          setPasswordReset({
            resetToken: get(responseData, "resetToken"),
            expiresAt: get(responseData, "expiresAt"),
            phone: get(verification, "phone"),
          });
          toast.success(
            get(responseData, "message") || t("auth.otpVerify.resetTokenReady"),
          );
          navigate("/auth/reset-password", { replace: true });
        },
        onError: (error) => {
          void trackLaunchEvent("otp_failed", {
            source: "auth",
            properties: {
              purpose: get(pendingVerification, "purpose"),
            },
          });
          const message = getAuthErrorMessage(error, t("auth.otpVerify.error"));
          toast.error(message);
          setError("otp", { type: "server", message });
        },
      },
    );
  };

  const handleResend = async () => {
    if (!pendingVerification) {
      toast.error(t("auth.otpVerify.sessionMissing"));
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    const phone = get(pendingVerification, "phone");
    if (!phone) {
      toast.error(t("auth.otpVerify.phoneSessionMissing"));
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    await resendOtp(
      {
        url: "/auth/resend-otp",
        attributes: {
          purpose: get(pendingVerification, "purpose"),
          phone,
        },
      },
      {
        onSuccess: (response) => {
          const responseData = getAuthResponseData(response);
          setPendingVerification({
            ...pendingVerification,
            phone: get(
              responseData,
              "phone",
              get(pendingVerification, "phone"),
            ),
            otpCode: get(responseData, "otpCode"),
            expiresAt: get(responseData, "expiresAt"),
          });
          toast.success(
            get(responseData, "message") || t("auth.otpVerify.resendSuccess"),
            {
              description: getOtpToastDescription(responseData, t),
            },
          );
          startCountdown();
        },
        onError: (error) => {
          const retryAfterSeconds = getApiRetryAfterSeconds(error);
          if (retryAfterSeconds !== null) {
            setCountdown(retryAfterSeconds);
          }
          toast.error(
            getAuthErrorMessage(error, t("auth.otpVerify.resendError")),
          );
        },
      },
    );
  };

  const isOtpExpired = expiryCountdown === 0;
  const isResendDisabled = (!isOtpExpired && countdown > 0) || isResendingOtp;
  const isSubmitting = get(formState, "isSubmitting");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (getSecondsUntil(get(pendingVerification, "expiresAt")) === 0) {
      setCountdown(0);
      return;
    }

    startCountdown();
  }, [pendingVerification, startCountdown]);

  return (
    <form className={"flex flex-col gap-8"} onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="verification-code" className="sr-only">
          {t("auth.otpVerify.codeLabel")}
        </FieldLabel>
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState }) => (
            <div className={"relative"}>
              <InputOTP
                id="verification-code"
                aria-describedby="verification-code-hint verification-code-error"
                aria-invalid={Boolean(get(fieldState, "error"))}
                maxLength={6}
                value={get(field, "value")}
                onChange={get(field, "onChange")}
                onComplete={handleSubmit(onSubmit)}
                disabled={isOtpExpired}
                ref={(node) => {
                  field.ref(node);
                  otpAutoFocus.ref(node);
                }}
                autoFocus={otpAutoFocus.autoFocus}
              >
                <div className="flex flex-wrap justify-start gap-2.5">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className={"size-11 md:size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={1} className={"size-11 md:size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={2} className={"size-11 md:size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className={"size-11 md:size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={4} className={"size-11 md:size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={5} className={"size-11 md:size-12"} />
                  </InputOTPGroup>
                </div>
              </InputOTP>
              <div className={"flex justify-center"}>
                <FieldError
                  id="verification-code-error"
                  errors={
                    get(fieldState, "error") ? [get(fieldState, "error")] : []
                  }
                />
              </div>
            </div>
          )}
        />
      </Field>

      <FieldDescription
        id="verification-code-hint"
        aria-live="polite"
        className={`text-center text-sm ${
          isOtpExpired ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {isOtpExpired
          ? t("auth.otpVerify.expired")
          : expiryCountdown !== null
            ? t("auth.otpVerify.expiresIn", { s: expiryCountdown })
            : t("auth.otpVerify.expiryHint")}
      </FieldDescription>

      <Field>
        <AuthSubmitButton
          type="submit"
          disabled={isOtpExpired || isSubmitting || isPending}
          className={"mt-5 md:mt-8"}
        >
          {isSubmitting || isPending
            ? t("auth.otpVerify.verifying")
            : t("auth.otpVerify.verifyButton")}
        </AuthSubmitButton>
      </Field>

      <p className="text-muted-foreground text-center text-sm">
        {t("auth.otpVerify.didntReceive")}{" "}
        <button
          type="button"
          className="underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          onClick={handleResend}
          disabled={isResendDisabled}
        >
          {isResendingOtp
            ? t("auth.otpVerify.resending")
            : !isOtpExpired && countdown > 0
              ? t("auth.otpVerify.resendIn", { s: countdown })
              : t("auth.otpVerify.resend")}
        </button>
      </p>
    </form>
  );
};

export default OtpForm;
