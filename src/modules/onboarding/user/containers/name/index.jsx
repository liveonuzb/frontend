import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_TONES } from "../../lib/tones.js";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const Index = () => {
  const navigate = useNavigate();
  const { firstName, lastName, setFields } = useOnboardingStore();
  const tone = ONBOARDING_TONES.neutral;

  useOnboardingAutoSave("user", "name");

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName, lastName },
    mode: "onSubmit",
  });

  const onSubmit = (values) => {
    setFields(values);
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
      Next <ChevronRight />
    </Button>,
  );

  return (
    <div className="relative flex h-full flex-1 flex-col justify-center overflow-hidden pt-3 md:pt-8  px-5">
      <PageAura tone={tone} />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question="What should we call you?" />

        <div className="grid items-center md:grid-cols-[0.95fr_1.05fr] md:gap-10">
          <motion.div
            className="flex items-end justify-center"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <img loading="lazy"
              src="/curious.webp"
              alt="Onboarding illustration"
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
                        placeholder="First name"
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

              <Field>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id="onboarding-last-name"
                        type="text"
                        placeholder="Last name"
                        autoComplete="family-name"
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
