import React, { useState, useEffect, useCallback } from "react";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { Field, FieldError } from "@/components/ui/field";
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
  getOtpToastDescription,
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils.js";
import { useAuthMobileAutoFocus } from "@/modules/auth/lib/mobile-keyboard";
import { useTranslation } from "react-i18next";
import { get } from "lodash";

const RESEND_COOLDOWN = 60;

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

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

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
          const responseData = get(response, "data");
          const verification = pendingVerification;

          if (get(verification, "purpose") === "VERIFY_ACCOUNT") {
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
          const responseData = get(response, "data");
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
          toast.error(
            getAuthErrorMessage(error, t("auth.otpVerify.resendError")),
          );
        },
      },
    );
  };

  const isResendDisabled = countdown > 0 || isResendingOtp;
  const isSubmitting = get(formState, "isSubmitting");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCountdown();
  }, [startCountdown]);

  return (
    <form className={"flex flex-col gap-8"} onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState }) => (
            <div className={"relative"}>
              <InputOTP
                id="verification-code"
                maxLength={6}
                value={get(field, "value")}
                onChange={get(field, "onChange")}
                onComplete={handleSubmit(onSubmit)}
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
                  className={"absolute -bottom-6"}
                  errors={
                    get(fieldState, "error") ? [get(fieldState, "error")] : []
                  }
                />
              </div>
            </div>
          )}
        />
      </Field>

      <Field>
        <AuthSubmitButton
          type="submit"
          disabled={isSubmitting || isPending}
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
            : countdown > 0
              ? t("auth.otpVerify.resendIn", { s: countdown })
              : t("auth.otpVerify.resend")}
        </button>
      </p>
    </form>
  );
};

export default OtpForm;
