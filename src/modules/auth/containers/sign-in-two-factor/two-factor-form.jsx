import React from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { get } from "lodash";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getAuthResponseData,
  getPostAuthRoute,
} from "@/modules/auth/lib/auth-utils.js";
import { submitOnEnter } from "@/modules/auth/lib/submit-on-enter";

const TwoFactorForm = ({ twoFactorToken }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearTwoFactorChallenge, completeAuthentication } = useAuthStore();
  const { mutateAsync, isPending } = usePostQuery();

  const schema = z.object({
    code: z
      .string()
      .min(1, t("auth.validation.otpRequired"))
      .regex(/^(?:\d{6}|[A-Fa-f0-9]{8})$/, t("auth.validation.otpOrBackup")),
  });

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: "/auth/login/2fa/verify",
        attributes: {
          twoFactorToken,
          code: get(values, "code"),
        },
      },
      {
        onSuccess: (response) => {
          const responseData = getAuthResponseData(response);

          if (!completeAuthentication(responseData)) {
            toast.error(t("auth.signIn.twoFactorError"));
            return;
          }

          clearTwoFactorChallenge();
          queryClient.setQueryData(["me"], { data: get(responseData, "user") });
          toast.success(
            get(responseData, "message") || t("auth.signIn.twoFactorSuccess"),
          );
          navigate(getPostAuthRoute(get(responseData, "user")), {
            replace: true,
          });
        },
        onError: (error) => {
          toast.error(
            getAuthErrorMessage(error, t("auth.signIn.twoFactorError")),
          );
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
        <FieldLabel htmlFor="two-factor-code" className="sr-only">
          {t("auth.signIn.twoFactorCodeLabel")}
        </FieldLabel>
        <Controller
          name="code"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <Input
                id="two-factor-code"
                aria-describedby="two-factor-code-hint two-factor-code-error"
                inputMode="text"
                autoComplete="one-time-code"
                enterKeyHint="done"
                maxLength={8}
                placeholder={t("auth.signIn.twoFactorCodeLabel")}
                aria-label={t("auth.signIn.twoFactorCodeLabel")}
                autoCapitalize="characters"
                className="h-10 px-5 text-center !text-base md:h-11"
                aria-invalid={!!get(fieldState, "error")}
                {...field}
              />
              <FieldError
                id="two-factor-code-error"
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
              <FieldDescription id="two-factor-code-hint" className="sr-only">
                {t("auth.signIn.twoFactorCodeHint")}
              </FieldDescription>
            </div>
          )}
        />
      </Field>

      <AuthSubmitButton
        type="submit"
        disabled={isSubmitting || isPending}
        className="mt-2 h-12 text-base"
      >
        {isSubmitting || isPending
          ? t("auth.signIn.twoFactorVerifying")
          : t("auth.signIn.twoFactorVerifyButton")}
      </AuthSubmitButton>
    </form>
  );
};

export default TwoFactorForm;
