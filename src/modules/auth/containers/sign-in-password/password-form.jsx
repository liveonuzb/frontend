import React from "react";
import { Link, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import get from "lodash/get";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { Field, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getAuthResponseData,
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils.js";
import { submitOnEnter } from "@/modules/auth/lib/submit-on-enter";

const PasswordForm = ({ phone }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    clearAuthPhoneFlow,
    completeAuthentication,
    setTwoFactorChallenge,
  } = useAuthStore();
  const { mutateAsync, isPending } = usePostQuery();

  const schema = z.object({
    password: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMin")),
  });

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
    mode: "onSubmit",
  });

  const goBack = () => {
    clearAuthPhoneFlow();
    navigate("/auth/sign-in", { replace: true });
  };

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: "/auth/login/phone",
        attributes: {
          phone,
          password: get(values, "password"),
        },
      },
      {
        onSuccess: (response) => {
          const responseData = getAuthResponseData(response);

          if (
            get(responseData, "twoFactorRequired") &&
            get(responseData, "twoFactorToken")
          ) {
            setTwoFactorChallenge({
              phone,
              twoFactorToken: get(responseData, "twoFactorToken"),
            });
            navigate("/auth/sign-in/2fa", { replace: true });
            return;
          }

          if (!completeAuthentication(responseData)) {
            toast.error(t("auth.signIn.error"));
            return;
          }

          clearAuthPhoneFlow();
          queryClient.setQueryData(["me"], { data: get(responseData, "user") });
          toast.success(
            get(responseData, "message") || t("auth.signIn.success"),
          );
          navigate(getPostAuthRoute(get(responseData, "user")), {
            replace: true,
          });
        },
        onError: (error) => {
          toast.error(getAuthErrorMessage(error, t("auth.signIn.error")));
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
                id="phone-password"
                autoComplete="current-password"
                enterKeyHint="done"
                placeholder={t("auth.signIn.passwordLabel")}
                aria-label={t("auth.signIn.passwordLabel")}
                className="h-10 px-5 !text-base md:h-11"
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
        <Link
          to="/auth/forgot-password"
          className="ml-auto text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {t("auth.signIn.forgotPassword")}
        </Link>
      </Field>

      <AuthSubmitButton
        type="submit"
        disabled={isSubmitting || isPending}
        className="mt-2 h-12 text-base"
      >
        {isSubmitting || isPending
          ? t("auth.signIn.loggingIn")
          : t("auth.signIn.loginButton")}
      </AuthSubmitButton>
      {(isSubmitting || isPending) && (
        <p
          role="status"
          aria-live="polite"
          className="-mt-4 text-center text-sm text-muted-foreground"
        >
          {t("auth.signIn.nextActionLoggingIn")}
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
