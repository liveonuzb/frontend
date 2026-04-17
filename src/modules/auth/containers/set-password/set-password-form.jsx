import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { get, isEqual } from "lodash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrength } from "@/components/password-strength";
import { usePatchQuery } from "@/hooks/api";
import { getAuthErrorMessage, getPostAuthRoute } from "@/modules/auth/lib/auth-utils";
import { useAuthStore } from "@/store";

const SetPasswordForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, initializeUser, isAuthenticated } = useAuthStore();

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

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    if (!user?.passwordSetupRequired) {
      navigate(getPostAuthRoute(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const { mutateAsync: setupPassword, isPending } = usePatchQuery({
    mutationProps: {
      onSuccess: (response) => {
        const updatedUser = get(response, "data.user");
        initializeUser(updatedUser);
        queryClient.setQueryData(["me"], { data: updatedUser });
        toast.success(
          get(response, "data.message") || t("auth.setPassword.success"),
        );
        navigate(getPostAuthRoute(updatedUser), { replace: true });
      },
      onError: (error) => {
        toast.error(
          getAuthErrorMessage(error, t("auth.setPassword.error")),
        );
      },
    },
  });

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await setupPassword({
      url: "/users/me/security/password/setup",
      attributes: {
        password: get(values, "password"),
      },
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="setup-password">
          {t("auth.setPassword.newPasswordLabel")}
        </FieldLabel>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="setup-password"
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
        <FieldLabel htmlFor="setup-confirm-password">
          {t("auth.setPassword.confirmPasswordLabel")}
        </FieldLabel>
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="setup-confirm-password"
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
            ? t("auth.setPassword.saving")
            : t("auth.setPassword.saveButton")}
        </Button>
      </Field>
    </form>
  );
};

export default SetPasswordForm;
