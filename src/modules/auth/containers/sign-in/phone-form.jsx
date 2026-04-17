import React from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
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
import { useTranslation } from "react-i18next";
import { get } from "lodash";

const PhoneForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    defaultValues: { phone: "+998", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await login({
      url: "/auth/login/phone",
      attributes: values,
    });
  };

  const isSubmitting = get(formState, "isSubmitting");

  return (
    <form className="flex flex-col gap-7" onSubmit={handleSubmit(onSubmit)}>
      <Field>
        <FieldLabel htmlFor="phone">{t("auth.signIn.phoneTab")}</FieldLabel>
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <PhoneInput
                id="phone"
                defaultCountry={"UZ"}
                type="tel"
                autoComplete="tel"
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
            <>
              <PasswordInput
                id="phone-password"
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

export default PhoneForm;
