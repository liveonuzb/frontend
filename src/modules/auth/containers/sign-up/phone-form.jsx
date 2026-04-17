import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/password-strength";
import { PhoneInput } from "@/components/ui/phone-input.jsx";

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

const PhoneForm = ({ referralCode }) => {
  const { t } = useTranslation();

  const schema = z
    .object({
      phone: z
        .string()
        .min(1, t("auth.validation.phoneRequired"))
        .regex(/^\+998[0-9]{9}$/, t("auth.validation.phoneInvalid")),
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
          channel: "phone",
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
    defaultValues: { phone: "+998", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    const attributes = {
      phone: get(values, "phone"),
      password: get(values, "password"),
    };
    if (referralCode) {
      attributes.referralCode = referralCode;
    }
    await registerUser({
      url: "/auth/register/phone",
      attributes,
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="signup-phone">
          {t("auth.signUp.phoneLabel")}
        </FieldLabel>
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PhoneInput
                id="signup-phone"
                defaultCountry={"UZ"}
                type="tel"
                autoComplete="tel"
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
        <FieldLabel htmlFor="signup-phone-password">
          {t("auth.signUp.passwordLabel")}
        </FieldLabel>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="signup-phone-password"
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
        <FieldLabel htmlFor="signup-phone-confirm-password">
          {t("auth.signUp.confirmPasswordLabel")}
        </FieldLabel>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="signup-phone-confirm-password"
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

export default PhoneForm;
