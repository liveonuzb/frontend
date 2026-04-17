import React from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

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
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils.js";
import { useTranslation } from "react-i18next";
import { get } from "lodash";

const EmailForm = () => {
  const { t } = useTranslation();

  const schema = z.object({
    email: z
      .string()
      .min(1, t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
    password: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMin")),
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { completeAuthentication } = useAuthStore();
  const { mutateAsync: login, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: (response) => {
        const responseData = get(response, "data");
        completeAuthentication(responseData);
        queryClient.setQueryData(["me"], { data: get(responseData, "user") });
        toast.success("Logged in successfully.");
        navigate(getPostAuthRoute(get(responseData, "user")), {
          replace: true,
        });
      },
      onError: (error) => {
        toast.error(getAuthErrorMessage(error, "Login failed."));
      },
    },
  });
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await login({
      url: "/auth/login/email",
      attributes: values,
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="email">{t("auth.signIn.emailLabel")}</FieldLabel>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.signIn.emailPlaceholder")}
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
        <div className="flex items-center">
          <FieldLabel htmlFor="email-password">
            {t("auth.signIn.passwordLabel")}
          </FieldLabel>
          <Link
            to="/auth/forgot-password"
            className="ml-auto text-sm underline-offset-2 hover:underline"
          >
            {t("auth.signIn.forgotPassword")}
          </Link>
        </div>
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PasswordInput
                id="email-password"
                autoComplete="current-password"
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
            ? t("auth.signIn.loggingIn")
            : t("auth.signIn.loginButton")}
        </Button>
      </Field>
    </form>
  );
};

export default EmailForm;
