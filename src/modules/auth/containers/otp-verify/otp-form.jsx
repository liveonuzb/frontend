import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);

  // Start countdown on mount and reset when resendOtp succeeds
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
  }, []);

  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

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

  const { mutateAsync: verifyOtp, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: (response) => {
        const responseData = get(response, "data");
        const verification = pendingVerification;

        if (get(verification, "purpose") === "VERIFY_ACCOUNT") {
          completeAuthentication(responseData);
          queryClient.setQueryData(["me"], { data: get(responseData, "user") });
          toast.success("Account verified successfully.");
          navigate(getPostAuthRoute(get(responseData, "user")), {
            replace: true,
          });
          return;
        }

        if (!get(responseData, "resetToken")) {
          toast.error("Reset token not found. Please request a new code.");
          navigate("/auth/forgot-password", { replace: true });
          return;
        }

        setPasswordReset({
          resetToken: get(responseData, "resetToken"),
          expiresAt: get(responseData, "expiresAt"),
          phone: get(verification, "phone"),
        });
        toast.success(
          get(responseData, "message") ||
            "Verification successful. Set a new password.",
        );
        navigate("/auth/reset-password", { replace: true });
      },
      onError: (error) => {
        const message = getAuthErrorMessage(error, "OTP verification failed.");
        toast.error(message);
        setError("otp", { type: "server", message });
      },
    },
  });

  const { mutateAsync: resendOtp, isPending: isResendingOtp } = usePostQuery({
    mutationProps: {
      onSuccess: (response) => {
        const responseData = get(response, "data");
        setPendingVerification({
          ...pendingVerification,
          phone: get(responseData, "phone", get(pendingVerification, "phone")),
          otpCode: get(responseData, "otpCode"),
          expiresAt: get(responseData, "expiresAt"),
        });
        toast.success(
          get(responseData, "message") || "A new OTP code was generated.",
          {
            description: getOtpToastDescription(responseData),
          },
        );
        startCountdown();
      },
      onError: (error) => {
        toast.error(getAuthErrorMessage(error, "Failed to resend OTP."));
      },
    },
  });

  const { control, handleSubmit, formState, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { otp: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    if (!pendingVerification) {
      toast.error("Verification session not found.");
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    const phone = get(pendingVerification, "phone");
    if (!phone) {
      toast.error("Phone verification session not found.");
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    try {
      await verifyOtp({
        url: "/auth/verify-otp",
        attributes: {
          code: get(values, "otp"),
          purpose: get(pendingVerification, "purpose"),
          phone,
        },
      });
    } catch (error) {
      // Error is handled in verifyOtp.onError
      console.error("OTP Verification Error:", error);
    }
  };

  const handleResend = () => {
    if (!pendingVerification) {
      toast.error("Verification session not found.");
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    const phone = get(pendingVerification, "phone");
    if (!phone) {
      toast.error("Phone verification session not found.");
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    resendOtp({
      url: "/auth/resend-otp",
      attributes: {
        purpose: get(pendingVerification, "purpose"),
        phone,
      },
    });
  };

  const isResendDisabled = countdown > 0 || isResendingOtp;
  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field className="items-center justify-center flex">
        <Controller
          name="otp"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <InputOTP
                id="verification-code"
                maxLength={6}
                value={get(field, "value")}
                onChange={get(field, "onChange")}
                onComplete={handleSubmit(onSubmit)}
              >
                <div className="flex flex-wrap justify-center gap-2 mx-auto">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className={"size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={1} className={"size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={2} className={"size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className={"size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={4} className={"size-12"} />
                  </InputOTPGroup>
                  <InputOTPGroup>
                    <InputOTPSlot index={5} className={"size-12"} />
                  </InputOTPGroup>
                </div>
              </InputOTP>
              <div className={"flex justify-center"}>
                <FieldError
                  errors={
                    get(fieldState, "error") ? [get(fieldState, "error")] : []
                  }
                />
              </div>
            </>
          )}
        />
      </Field>

      <Field>
        <Button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-full"
        >
          {isSubmitting || isPending
            ? t("auth.otpVerify.verifying")
            : t("auth.otpVerify.verifyButton")}
        </Button>
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
