import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_TONES } from "../../lib/tones.js";
import { useOnboardingAssets } from "@/hooks/app/use-onboarding-base";

import trim from "lodash/trim";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { firstName, setFields } = useOnboardingStore();
  const tone = ONBOARDING_TONES.neutral;
  const { curious } = useOnboardingAssets();
  const schema = React.useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .refine(
            (value) => trim(value).length >= 1,
            t("onboarding.name.firstNameRequired"),
          ),
      }),
    [t],
  );

  useOnboardingAutoSave("user", "name");

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: firstName ?? "" },
    mode: "onSubmit",
  });

  const onSubmit = (values) => {
    setFields({ firstName: trim(values.firstName), lastName: "" });
    navigate("/user/onboarding/gender");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      onClick={handleSubmit(onSubmit)}
    >
      {t("onboarding.next")} <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col justify-center overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.name.question")} />

        <div className="grid items-center md:grid-cols-[0.95fr_1.05fr] md:gap-10">
          <motion.div
            className="flex items-end justify-center"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <img
              loading="lazy"
              src={curious}
              alt={t("onboarding.illustrationAlt")}
              className="max-h-[240px] w-full max-w-[240px] object-contain md:max-h-[340px] md:max-w-[340px]"
            />
          </motion.div>

          <form
            className={cn("", tone.border)}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-5">
              <Field>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id="onboarding-first-name"
                        type="text"
                        placeholder={t("onboarding.name.firstNamePlaceholder")}
                        autoComplete="given-name"
                        className="h-14 rounded-2xl border-border/70 bg-background/80 px-4 text-lg font-semibold"
                        aria-invalid={!!fieldState.error}
                        {...field}
                      />
                      <FieldError
                        errors={fieldState.error ? [fieldState.error] : []}
                      />
                    </>
                  )}
                />
              </Field>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Index;
