import React, { useEffect } from "react";
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
import {
  getAuthErrorMessage,
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils";
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

  const { mutateAsync, isPending } = usePatchQuery();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: "/users/me/security/password/setup",
        attributes: {
          password: get(values, "password"),
        },
      },
      {
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
          toast.error(getAuthErrorMessage(error, t("auth.setPassword.error")));
        },
      },
    );
  };

  const isSubmitting = get(formState, "isSubmitting");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    if (!get(user, "passwordSetupRequired")) {
      navigate(getPostAuthRoute(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <form className={"flex flex-col gap-8"} onSubmit={handleSubmit(onSubmit)}>
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
                className={"h-10 md:h-11 px-5 !text-base"}
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
            <div className={"relative"}>
              <PasswordInput
                id="setup-confirm-password"
                className={"h-10 md:h-11 px-5 !text-base"}
                autoComplete="new-password"
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
        <Button
          type="submit"
          disabled={isSubmitting || isPending}
          className={"h-11 mt-5 md:mt-8"}
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
