import React from "react";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
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
import { useAuthMobileAutoFocus } from "@/modules/auth/lib/mobile-keyboard";
import { useTranslation } from "react-i18next";
import { get, isEqual } from "lodash";

const PhoneForm = ({ referralCode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearPasswordReset, setPendingVerification } = useAuthStore();
  const phoneAutoFocus = useAuthMobileAutoFocus();

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

  const { mutateAsync, isPending } = usePostQuery();
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
    await mutateAsync(
      {
        url: "/auth/register/phone",
        attributes,
      },
      {
        onSuccess: (response) => {
          const responseData = get(response, "data");
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

  const handleFormKeyDown = (event) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent?.isComposing ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    event.preventDefault();
    submitForm();
  };

  return (
    <form
      className={"flex flex-col gap-8"}
      onSubmit={submitForm}
      onKeyDown={handleFormKeyDown}
    >
      <Field>
        <FieldLabel htmlFor="signup-phone">
          {t("auth.signUp.phoneLabel")}
        </FieldLabel>
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <div className={"relative"}>
              <PhoneInput
                id="signup-phone"
                variant={"xl"}
                defaultCountry={"UZ"}
                type="tel"
                autoComplete="tel"
                enterKeyHint="done"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
                ref={(node) => {
                  field.ref(node);
                  phoneAutoFocus.ref(node);
                }}
                autoFocus={phoneAutoFocus.autoFocus}
              />
              <FieldError
                className={"absolute -bottom-6"}
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
            </div>
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
            <div className={"relative"}>
              <PasswordInput
                id="signup-phone-password"
                className={"h-10 md:h-11 px-5 !text-base"}
                autoComplete="new-password"
                enterKeyHint="done"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <PasswordStrength password={field.value} />
              <FieldError
                className={"absolute -bottom-6"}
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
            </div>
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
            <div className={"relative"}>
              <PasswordInput
                id="signup-phone-confirm-password"
                className={"h-10 md:h-11 px-5 !text-base"}
                autoComplete="new-password"
                enterKeyHint="done"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <FieldError
                className={"absolute -bottom-6"}
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
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
            ? t("auth.signUp.signingUp")
            : t("auth.signUp.signUpButton")}
        </AuthSubmitButton>
      </Field>
    </form>
  );
};

export default PhoneForm;
