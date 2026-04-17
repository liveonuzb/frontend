import React from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
import { get } from "lodash";

const EmailForm = () => {
  const { t } = useTranslation();

  const schema = z.object({
    email: z
      .string()
      .min(1, t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
  });

  const navigate = useNavigate();
  const { clearPasswordReset, setPendingVerification } = useAuthStore();
  const { mutateAsync: requestPasswordReset, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: (response) => {
        const responseData = get(response, "data");
        setPendingVerification({
          channel: "email",
          purpose: "PASSWORD_RESET",
          email: get(responseData, "email"),
          phone: get(responseData, "phone"),
          otpCode: get(responseData, "otpCode"),
          expiresAt: get(responseData, "expiresAt"),
        });
        clearPasswordReset();
        toast.success(get(responseData, "message") || "Reset code sent.", {
          description: getOtpToastDescription(responseData),
        });
        navigate("/auth/otp-verify", { replace: true });
      },
      onError: (error) => {
        toast.error(
          getAuthErrorMessage(error, "Failed to send password reset code."),
        );
      },
    },
  });
  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await requestPasswordReset({
      url: "/auth/forgot-password",
      attributes: values,
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="forgot-email">
          {t("auth.forgotPassword.emailLabel")}
        </FieldLabel>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Input
                id="forgot-email"
                type="email"
                placeholder={t("auth.forgotPassword.emailPlaceholder")}
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
        <Button
          type="submit"
          disabled={isSubmitting || isPending}
          className="w-full"
        >
          {isSubmitting || isPending
            ? t("auth.forgotPassword.sending")
            : t("auth.forgotPassword.sendButton")}
        </Button>
      </Field>
    </form>
  );
};

export default EmailForm;
