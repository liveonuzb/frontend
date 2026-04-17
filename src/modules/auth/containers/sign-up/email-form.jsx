import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/password-strength";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getOtpToastDescription,
} from "@/modules/auth/lib/auth-utils.js";
import { useTranslation } from "react-i18next";
import { get, isEqual } from "lodash";

const EmailForm = ({ referralCode }) => {
  const { t } = useTranslation();

  const schema = z
    .object({
      email: z
        .string()
        .min(1, t("auth.validation.emailRequired"))
        .email(t("auth.validation.emailInvalid")),
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

  const navigate = useNavigate();
  const { clearPasswordReset, setPendingVerification } = useAuthStore();
  const { mutateAsync: registerUser, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: (response) => {
        const responseData = get(response, "data");
        setPendingVerification({
          channel: "email",
          purpose: "VERIFY_ACCOUNT",
          email: get(responseData, "email"),
          phone: get(responseData, "phone"),
          otpCode: get(responseData, "otpCode"),
          expiresAt: get(responseData, "expiresAt"),
        });
        clearPasswordReset();
        toast.success(
          get(responseData, "message") || "Verification code sent.",
          {
            description: getOtpToastDescription(responseData),
          },
        );
        navigate("/auth/otp-verify", { replace: true });
      },
      onError: (error) => {
        toast.error(getAuthErrorMessage(error, "Sign up failed."));
      },
    },
  });
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    const attributes = {
      email: get(values, "email"),
      password: get(values, "password"),
    };
    if (referralCode) {
      attributes.referralCode = referralCode;
    }
    await registerUser({
      url: "/auth/register/email",
      attributes,
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="signup-email">
          {t("auth.signUp.emailLabel")}
        </FieldLabel>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input
                id="signup-email"
                type="email"
                placeholder={t("auth.signUp.emailPlaceholder")}
                autoComplete="email"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <FieldError
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="signup-email-password">
          {t("auth.signUp.passwordLabel")}
        </FieldLabel>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="signup-email-password"
                autoComplete="new-password"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <PasswordStrength password={field.value} />
              <FieldError
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
            </>
          )}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="signup-email-confirm-password">
          {t("auth.signUp.confirmPasswordLabel")}
        </FieldLabel>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="signup-email-confirm-password"
                autoComplete="new-password"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <FieldError
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
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
            ? t("auth.signUp.signingUp")
            : t("auth.signUp.signUpButton")}
        </Button>
      </Field>
    </form>
  );
};

export default EmailForm;
