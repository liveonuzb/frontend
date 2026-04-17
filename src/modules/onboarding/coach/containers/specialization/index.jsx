import { map, filter, includes, isArray, compact, join } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useGetQuery } from "@/hooks/api";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { cn } from "@/lib/utils";

const parseSpecializations = (value) => {
  const raw = String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim());
  return compact(raw);
};

const Index = () => {
  const navigate = useNavigate();
  const { coachCategory, specializations, setField } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/specialization");

  const isOtherCategory = coachCategory === "OTHER";

  const { data, isLoading } = useGetQuery({
    url: `/coach/categories/${coachCategory}/specializations`,
    queryProps: {
      queryKey: ["coach-specializations", coachCategory],
      enabled: !!coachCategory && !isOtherCategory,
      staleTime: 300000,
    },
  });

  const serverSpecializations = React.useMemo(() => {
    const items = data?.data?.specializations ?? [];
    return isArray(items) ? items : [];
  }, [data]);

  const selected = isArray(specializations) ? specializations : [];

  // Freeform text state for OTHER category
  const [freeformValue, setFreeformValue] = React.useState(
    isOtherCategory && isArray(specializations)
      ? join(specializations, ", ")
      : "",
  );

  const parsedFreeform = React.useMemo(
    () => parseSpecializations(freeformValue),
    [freeformValue],
  );

  React.useEffect(() => {
    if (isOtherCategory) {
      setField("specializations", parsedFreeform);
    }
  }, [parsedFreeform, setField, isOtherCategory]);

  const handleToggle = (specValue) => {
    const exists = includes(selected, specValue);
    const next = exists
      ? filter(selected, (v) => v !== specValue)
      : [...selected, specValue];
    setField("specializations", next);
  };

  const handleNext = () => navigate("/coach/onboarding/target-audience");

  const hasNoServerSpecs =
    !isLoading && !isOtherCategory && serverSpecializations.length === 0;

  const isValid = isOtherCategory
    ? parsedFreeform.length > 0
    : hasNoServerSpecs || selected.length > 0;

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!isValid}
      onClick={handleNext}
    >
      Davom etish
    </Button>,
  );

  if (isOtherCategory) {
    return (
      <div className="flex-1 flex flex-col h-full pb-4">
        <OnboardingQuestion question="Yo'nalishlaringizni kiriting" />

        <Field>
          <FieldLabel>Yo'nalishlar</FieldLabel>
          <Textarea
            rows={5}
            value={freeformValue}
            placeholder="Boks, Football, Yoga, Fitness"
            onChange={(event) => setFreeformValue(event.target.value)}
          />
          <FieldDescription>
            Yo'nalishlarni vergul yoki yangi qatordan ajrating.
          </FieldDescription>
        </Field>

        {parsedFreeform.length > 0 ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {parsedFreeform.length} ta yo'nalish kiritildi
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full pb-4">
      <OnboardingQuestion question="Yo'nalishlaringizni tanlang" />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : serverSpecializations.length > 0 ? (
        <div className="grid gap-3 w-full">
          {map(serverSpecializations, (spec) => {
            const specValue = spec.value ?? spec.key ?? spec.name ?? spec;
            const specLabel = spec.label ?? spec.nameUz ?? spec.name ?? spec;
            const specEmoji = spec.emoji ?? null;
            const isSelected = includes(selected, specValue);

            return (
              <button
                key={specValue}
                type="button"
                onClick={() => handleToggle(specValue)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/60",
                )}
              >
                {specEmoji ? (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">
                    {specEmoji}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-none">{specLabel}</div>
                </div>
                {isSelected ? (
                  <span className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-4" />
                  </span>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Tanlash
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Bu kategoriya uchun yo'nalishlar topilmadi.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Davom etish tugmasini bosing.
          </p>
        </div>
      )}

      {selected.length > 0 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {selected.length} ta yo'nalish tanlandi
        </p>
      ) : null}
    </div>
  );
};

export default Index;
