import React from "react";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { Field, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/password-strength";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import { getAuthErrorMessage } from "@/modules/auth/lib/auth-utils.js";
import { useAuthMobileAutoFocus } from "@/modules/auth/lib/mobile-keyboard";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import { applyStrongPasswordPolicy } from "@/modules/auth/lib/password-policy.js";

const isResetSessionExpired = (expiresAtValue) => {
  if (!expiresAtValue) {
    return false;
  }

  const expiresAt = new Date(expiresAtValue);
  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt.getTime() <= Date.now();
};

const ResetPasswordForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearPasswordReset, clearPendingVerification, passwordReset } =
    useAuthStore();
  const passwordAutoFocus = useAuthMobileAutoFocus();

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

  const { mutateAsync, isPending } = usePostQuery();
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    if (!get(passwordReset, "resetToken")) {
      toast.error(t("auth.resetPassword.sessionMissing"));
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    if (isResetSessionExpired(get(passwordReset, "expiresAt"))) {
      toast.error(t("auth.resetPassword.sessionExpired"));
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    await mutateAsync(
      {
        url: "/auth/reset-password",
        attributes: {
          resetToken: get(passwordReset, "resetToken"),
          password: get(values, "password"),
        },
      },
      {
        onSuccess: (response) => {
          toast.success(
            get(response, "data.message") || t("auth.resetPassword.success"),
          );
          navigate("/auth/sign-in", { replace: true });
        },
        onError: (error) => {
          toast.error(
            getAuthErrorMessage(error, t("auth.resetPassword.error")),
          );
        },
      },
    );
  };

  const isSubmitting = get(formState, "isSubmitting");

  React.useEffect(() => {
    if (!isResetSessionExpired(get(passwordReset, "expiresAt"))) {
      return;
    }
    clearPasswordReset();
    clearPendingVerification();
    toast.error(t("auth.resetPassword.sessionExpired"));
    navigate("/auth/forgot-password", { replace: true });
  }, [
    clearPasswordReset,
    clearPendingVerification,
    navigate,
    passwordReset,
    t,
  ]);

  return (
    <form className={"flex flex-col gap-8"} onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <div className={"relative"}>
              <PasswordInput
                id="reset-password"
                autoComplete="new-password"
                enterKeyHint="done"
                className={"h-10 md:h-11 px-5 !text-base"}
                placeholder={t("auth.resetPassword.newPasswordLabel")}
                aria-label={t("auth.resetPassword.newPasswordLabel")}
                aria-invalid={!!get(fieldState, "error")}
                {...field}
                ref={(node) => {
                  field.ref(node);
                  passwordAutoFocus.ref(node);
                }}
                autoFocus={passwordAutoFocus.autoFocus}
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

      <Field>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <div className={"relative"}>
              <PasswordInput
                id="reset-confirm-password"
                autoComplete="new-password"
                enterKeyHint="done"
                className={"h-10 md:h-11 px-5 !text-base"}
                placeholder={t("auth.resetPassword.confirmPasswordLabel")}
                aria-label={t("auth.resetPassword.confirmPasswordLabel")}
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

      <Field>
        <AuthSubmitButton
          type="submit"
          disabled={isSubmitting || isPending}
          className={"mt-5 md:mt-8"}
        >
          {isSubmitting || isPending
            ? t("auth.resetPassword.resetting")
            : t("auth.resetPassword.resetButton")}
        </AuthSubmitButton>
      </Field>
    </form>
  );
};

export default ResetPasswordForm;
