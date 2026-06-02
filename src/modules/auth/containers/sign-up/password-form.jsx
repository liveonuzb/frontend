import React from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { PasswordStrength } from "@/components/password-strength";
import { Field, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getAuthResponseData,
  getOtpToastDescription,
} from "@/modules/auth/lib/auth-utils.js";
import { submitOnEnter } from "@/modules/auth/lib/submit-on-enter";
import { trackLaunchEvent } from "@/lib/analytics.js";
import { applyStrongPasswordPolicy } from "@/modules/auth/lib/password-policy.js";

const PasswordForm = ({ phone, referralCode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    authPhoneFlow,
    clearAuthPhoneFlow,
    clearPasswordReset,
    setPendingVerification,
  } = useAuthStore();
  const { mutateAsync, isPending } = usePostQuery();

  const schema = z
    .object({
      password: z
        .string()
        .min(1, t("auth.validation.passwordRequired"))
        .pipe(applyStrongPasswordPolicy(z.string(), t)),
      confirmPassword: z
        .string()
        .min(1, t("auth.validation.confirmPasswordRequired")),
    })
    .refine(
      (data) => isEqual(get(data, "password"), get(data, "confirmPassword")),
      {
        message: t("auth.validation.passwordsNoMatch"),
        path: ["confirmPassword"],
      },
    );

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const goBack = () => {
    clearAuthPhoneFlow();
    navigate("/auth/sign-in", { replace: true });
  };

  const onSubmit = async (values) => {
    void trackLaunchEvent("signup_started", {
      source: "auth",
      properties: {
        hasReferralCode: Boolean(
          referralCode || get(authPhoneFlow, "referralCode"),
        ),
      },
    });
    const attributes = {
      phone,
      password: get(values, "password"),
    };
    const nextReferralCode = get(authPhoneFlow, "referralCode") || referralCode;
    if (nextReferralCode) {
      attributes.referralCode = nextReferralCode;
    }

    await mutateAsync(
      {
        url: "/auth/register/phone",
        attributes,
      },
      {
        onSuccess: (response) => {
          const responseData = getAuthResponseData(response);
          void trackLaunchEvent("signup_otp_sent", {
            source: "auth",
            properties: {
              hasReferralCode: Boolean(nextReferralCode),
            },
          });
          setPendingVerification({
            channel: "phone",
            purpose: "VERIFY_ACCOUNT",
            phone: get(responseData, "phone"),
            otpCode: get(responseData, "otpCode"),
            expiresAt: get(responseData, "expiresAt"),
          });
          clearPasswordReset();
          toast.success(
            get(responseData, "message") || t("auth.signUp.verificationSent"),
            {
              description: getOtpToastDescription(responseData, t),
            },
          );
          navigate("/auth/otp-verify", { replace: true });
        },
        onError: (error) => {
          void trackLaunchEvent("signup_failed", {
            source: "auth",
            properties: {
              hasReferralCode: Boolean(nextReferralCode),
            },
          });
          toast.error(getAuthErrorMessage(error, t("auth.signUp.error")));
        },
      },
    );
  };

  const isSubmitting = get(formState, "isSubmitting");
  const submitForm = handleSubmit(onSubmit);

  return (
    <form
      className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-6 duration-200"
      onSubmit={submitForm}
      onKeyDown={(event) => submitOnEnter(event, submitForm)}
    >
      <Field className="gap-2">
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <PasswordInput
                id="signup-phone-password"
                className="h-10 px-5 !text-base md:h-11"
                autoComplete="new-password"
                enterKeyHint="done"
                placeholder={t("auth.signIn.newPasswordLabel")}
                aria-label={t("auth.signIn.newPasswordLabel")}
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <PasswordStrength password={field.value} />
              <FieldError
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
            </div>
          )}
        />
      </Field>

      <Field className="gap-2">
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <PasswordInput
                id="signup-phone-confirm-password"
                className="h-10 px-5 !text-base md:h-11"
                autoComplete="new-password"
                enterKeyHint="done"
                placeholder={t("auth.signIn.confirmPasswordLabel")}
                aria-label={t("auth.signIn.confirmPasswordLabel")}
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <FieldError
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
            </div>
          )}
        />
      </Field>

      <AuthSubmitButton
        type="submit"
        disabled={isSubmitting || isPending}
        className="mt-3 h-12 text-base"
      >
        {isSubmitting || isPending
          ? t("auth.signIn.creatingAccount")
          : t("auth.signIn.createPasswordButton")}
      </AuthSubmitButton>
      {(isSubmitting || isPending) && (
        <p
          role="status"
          aria-live="polite"
          className="-mt-4 text-center text-sm text-muted-foreground"
        >
          {t("auth.signUp.nextActionSendingOtp")}
        </p>
      )}

      <Button
        type="button"
        variant="link"
        onClick={goBack}
        className="mx-auto h-auto px-0 text-sm text-muted-foreground"
      >
        {t("auth.signIn.backToPhone")}
      </Button>
    </form>
  );
};

export default PasswordForm;
