import { map, some } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "monday", label: "Dushanba" },
  { key: "tuesday", label: "Seshanba" },
  { key: "wednesday", label: "Chorshanba" },
  { key: "thursday", label: "Payshanba" },
  { key: "friday", label: "Juma" },
  { key: "saturday", label: "Shanba" },
  { key: "sunday", label: "Yakshanba" },
];

const DEFAULT_AVAILABILITY = {
  monday: { from: "09:00", to: "18:00", enabled: true },
  tuesday: { from: "09:00", to: "18:00", enabled: true },
  wednesday: { from: "09:00", to: "18:00", enabled: true },
  thursday: { from: "09:00", to: "18:00", enabled: true },
  friday: { from: "09:00", to: "18:00", enabled: true },
  saturday: { from: "", to: "", enabled: false },
  sunday: { from: "", to: "", enabled: false },
};

const Index = () => {
  const navigate = useNavigate();
  const { availability, setAvailability } = useOnboardingStore();

  useOnboardingAutoSave("coach", "coach/availability");

  const schedule = availability ?? DEFAULT_AVAILABILITY;

  const hasAtLeastOneDay = some(DAYS, (day) => schedule[day.key]?.enabled);

  const updateDay = (dayKey, changes) => {
    setAvailability({
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        ...changes,
      },
    });
  };

  const handleToggle = (dayKey, checked) => {
    updateDay(dayKey, {
      enabled: checked,
      from: checked ? (schedule[dayKey]?.from || "09:00") : "",
      to: checked ? (schedule[dayKey]?.to || "18:00") : "",
    });
  };

  const handleNext = () => {
    navigate("/coach/onboarding/certification");
  };

  useOnboardingFooter(
    <Button
      type="button"
      className="w-full"
      size="lg"
      disabled={!hasAtLeastOneDay}
      onClick={handleNext}
    >
      Davom etish
    </Button>,
  );

  return (
    <div className="flex-1 flex flex-col h-full pb-20">
      <OnboardingQuestion question="Haftalik ish jadvalingizni belgilang" />

      <div className="space-y-3 w-full">
        {map(DAYS, (day) => {
          const dayData = schedule[day.key] ?? {
            from: "",
            to: "",
            enabled: false,
          };
          const isEnabled = dayData.enabled;

          return (
            <div
              key={day.key}
              className={cn(
                "rounded-2xl border p-4 transition-colors",
                isEnabled ? "border-primary/30 bg-primary/5" : "bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      handleToggle(day.key, checked)
                    }
                  />
                  <span
                    className={cn(
                      "font-medium text-sm",
                      !isEnabled && "text-muted-foreground",
                    )}
                  >
                    {day.label}
                  </span>
                </div>
                {!isEnabled ? (
                  <span className="text-xs text-muted-foreground">Dam olish</span>
                ) : null}
              </div>

              {isEnabled ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground font-medium pl-1">
                      Boshlanish
                    </span>
                    <TimePicker
                      value={dayData.from}
                      onChange={(val) => updateDay(day.key, { from: val })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-muted-foreground font-medium pl-1">
                      Tugash
                    </span>
                    <TimePicker
                      value={dayData.to}
                      onChange={(val) => updateDay(day.key, { to: val })}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 p-4 bg-muted/30 rounded-3xl border border-border/50">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-background shrink-0 shadow-sm">
          <CalendarIcon className="size-5 text-primary" />
        </div>
        <div className="space-y-1 text-left">
          <div className="font-bold text-sm">Jadval keyinroq o'zgartiriladi</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bu boshlang'ich jadval. Coach kabinetida istalgan vaqtda
            o'zgartirishingiz mumkin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
