import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
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
import { useTranslation } from "react-i18next";
import { get, isEqual } from "lodash";

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

  const navigate = useNavigate();
  const { clearPasswordReset, clearPendingVerification, passwordReset } =
    useAuthStore();

  React.useEffect(() => {
    if (!isResetSessionExpired(get(passwordReset, "expiresAt"))) {
      return;
    }

    clearPasswordReset();
    clearPendingVerification();
    toast.error("Reset session expired. Please request a new code.");
    navigate("/auth/forgot-password", { replace: true });
  }, [
    clearPasswordReset,
    clearPendingVerification,
    navigate,
    get(passwordReset, "expiresAt"),
  ]);

  const { mutateAsync: resetPassword, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: (response) => {
        toast.success(
          get(response, "data.message") || "Password reset successfully.",
        );
        navigate("/auth/sign-in", { replace: true });
      },
      onError: (error) => {
        toast.error(getAuthErrorMessage(error, "Failed to reset password."));
      },
    },
  });
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    if (!get(passwordReset, "resetToken")) {
      toast.error("Reset session not found.");
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    if (isResetSessionExpired(get(passwordReset, "expiresAt"))) {
      toast.error("Reset session expired. Please request a new code.");
      navigate("/auth/forgot-password", { replace: true });
      return;
    }

    await resetPassword({
      url: "/auth/reset-password",
      attributes: {
        resetToken: get(passwordReset, "resetToken"),
        password: get(values, "password"),
      },
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="reset-password">
          {t("auth.resetPassword.newPasswordLabel")}
        </FieldLabel>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="reset-password"
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
        <FieldLabel htmlFor="reset-confirm-password">
          {t("auth.resetPassword.confirmPasswordLabel")}
        </FieldLabel>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="reset-confirm-password"
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
            ? t("auth.resetPassword.resetting")
            : t("auth.resetPassword.resetButton")}
        </Button>
      </Field>
    </form>
  );
};

export default ResetPasswordForm;
