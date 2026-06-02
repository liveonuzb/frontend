import React from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneIcon } from "lucide-react";
import get from "lodash/get";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import AuthSubmitButton from "@/modules/auth/components/auth-submit-button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PhoneInput } from "@/components/ui/phone-input.jsx";
import { usePostQuery } from "@/hooks/api";
import { useAuthStore } from "@/store";
import {
  getAuthErrorMessage,
  getAuthResponseData,
} from "@/modules/auth/lib/auth-utils.js";
import { useAuthMobileAutoFocus } from "@/modules/auth/lib/mobile-keyboard";
import { submitOnEnter } from "@/modules/auth/lib/submit-on-enter";

const PhoneForm = ({ referralCode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const phoneAutoFocus = useAuthMobileAutoFocus();
  const setAuthPhoneFlow = useAuthStore((state) => state.setAuthPhoneFlow);
  const { mutateAsync, isPending } = usePostQuery();

  const schema = z.object({
    phone: z
      .string()
      .min(1, t("auth.validation.phoneRequired"))
      .regex(/^\+998[0-9]{9}$/, t("auth.validation.phoneInvalid")),
  });

  const { control, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: "+998" },
    mode: "onSubmit",
  });

  const onSubmit = async (values) => {
    await mutateAsync(
      {
        url: "/auth/resolve-phone",
        attributes: { phone: get(values, "phone") },
      },
      {
        onSuccess: (response) => {
          const responseData = getAuthResponseData(response);
          const flow = get(responseData, "flow");
          const phone = get(responseData, "phone");

          setAuthPhoneFlow({
            phone,
            flow,
            referralCode,
          });

          if (flow === "login") {
            navigate("/auth/sign-in/password");
            return;
          }

          navigate(
            `/auth/sign-up${
              referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ""
            }`,
          );
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
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <PhoneInput
                variant="xl"
                id="phone"
                className="[&_[data-slot=button]]:bg-background [&_[data-slot=input]]:bg-background"
                defaultCountry="UZ"
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
                errors={
                  get(fieldState, "error") ? [get(fieldState, "error")] : []
                }
              />
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
          ? t("auth.signIn.checkingPhone")
          : t("auth.signIn.continueButton")}
      </AuthSubmitButton>
    </form>
  );
};

export default PhoneForm;
