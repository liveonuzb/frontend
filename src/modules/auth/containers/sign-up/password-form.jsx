import React from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyholeIcon, UserPlusIcon } from "lucide-react";
import { get, isEqual } from "lodash";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import AuthPhoneSummary from "@/modules/auth/components/auth-phone-summary";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { PasswordStrength } from "@/components/password-strength";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getAuthResponseData,
  getOtpToastDescription,
} from "@/modules/auth/lib/auth-utils.js";
import { submitOnEnter } from "@/modules/auth/lib/submit-on-enter";

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
        .min(6, t("auth.validation.passwordMin")),
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
      <AuthPhoneSummary
        phone={phone}
        label={t("auth.signIn.selectedPhone")}
        backLabel={t("auth.signIn.backToPhone")}
        onBack={goBack}
        icon={UserPlusIcon}
      />

      <Field className="gap-2">
        <FieldLabel
          htmlFor="signup-phone-password"
          className="items-center gap-2 text-sm"
        >
          <LockKeyholeIcon className="size-4 text-primary" />
          {t("auth.signIn.newPasswordLabel")}
        </FieldLabel>
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
        <FieldLabel
          htmlFor="signup-phone-confirm-password"
          className="items-center gap-2 text-sm"
        >
          <LockKeyholeIcon className="size-4 text-primary" />
          {t("auth.signIn.confirmPasswordLabel")}
        </FieldLabel>
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
    </form>
  );
};

export default PasswordForm;
