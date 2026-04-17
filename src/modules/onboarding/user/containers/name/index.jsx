import React from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight } from "lucide-react";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const Index = () => {
  const navigate = useNavigate();
  const { firstName, lastName, setFields } = useOnboardingStore();

  useOnboardingAutoSave("user", "name");

  const { control, handleSubmit, formState } = useForm({
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
      className="w-full"
      size="lg"
      onClick={handleSubmit(onSubmit)}
    >
      Next <ChevronRight/>
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col justify-center h-full pb-20">
      <OnboardingQuestion question="What's your name?" />

      <form
        className="flex flex-col gap-5 w-full"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Field>
          <FieldLabel htmlFor="onboarding-first-name">First name</FieldLabel>
          <Controller
            name="firstName"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  id="onboarding-first-name"
                  type="text"
                  placeholder="John"
                  autoComplete="given-name"
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
          <FieldLabel htmlFor="onboarding-last-name">Last name</FieldLabel>
          <Controller
            name="lastName"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  id="onboarding-last-name"
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
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
      </form>
    </div>
  );
};

export default Index;
