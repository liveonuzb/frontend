import React from "react";
import { Link } from "react-router";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input.jsx";
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
import { useAuthMobileAutoFocus } from "@/modules/auth/lib/mobile-keyboard";
import { useTranslation } from "react-i18next";
import { get } from "lodash";

const PhoneForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { completeAuthentication } = useAuthStore();
  const phoneAutoFocus = useAuthMobileAutoFocus();

  const schema = z.object({
    phone: z
      .string()
      .min(1, t("auth.validation.phoneRequired"))
      .regex(/^\+998[0-9]{9}$/, t("auth.validation.phoneInvalid")),
    password: z
      .string()
      .min(1, t("auth.validation.passwordRequired"))
      .min(6, t("auth.validation.passwordMin")),
  });

  const { mutateAsync, isPending } = usePostQuery();

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+998", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: "/auth/login/phone",
        attributes: values,
      },
      {
        onSuccess: (response) => {
          const responseData = get(response, "data");
          completeAuthentication(responseData);
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
        <FieldLabel htmlFor="phone">{t("auth.signIn.phoneTab")}</FieldLabel>
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <div className={"relative"}>
              <PhoneInput
                variant={"xl"}
                id="phone"
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
        <div className="flex items-center">
          <FieldLabel htmlFor="phone-password">
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
            <div className="relative">
              <PasswordInput
                id="phone-password"
                autoComplete="current-password"
                enterKeyHint="done"
                className={"h-10 md:h-11 px-5 !text-base"}
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
            ? t("auth.signIn.loggingIn")
            : t("auth.signIn.loginButton")}
        </AuthSubmitButton>
      </Field>
    </form>
  );
};

export default PhoneForm;
