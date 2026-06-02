import React from "react";
import { addDays, format } from "date-fns";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StepSection } from "./form-fields.jsx";

import map from "lodash/map";

const DURATION_OPTIONS = [7, 14, 30];
const formatDateInput = (date) => format(date, "yyyy-MM-dd");

const StepDuration = ({ form, setForm }) => {
  const handleDuration = (days) => {
    const start = form.startDate ? new Date(form.startDate) : new Date();
    setForm((current) => ({
      ...current,
      durationDays: days,
      endDate: formatDateInput(addDays(start, days)),
    }));
  };

  const handleStartChange = (startDate) => {
    const start = new Date(startDate);
    setForm((current) => ({
      ...current,
      startDate,
      endDate: formatDateInput(addDays(start, current.durationDays || 7)),
    }));
  };

  return (
    <StepSection
      title="Vaqt va davomiylik"
      description="Boshlanish sanasi va challenge qancha davom etishini belgilang."
    >
      <div className="grid grid-cols-3 gap-2">
        {map(DURATION_OPTIONS, (days) => (
          <button
            key={days}
            type="button"
            onClick={() => handleDuration(days)}
            className={cn(
              "rounded-md border py-2 text-sm font-medium transition-colors",
              form.durationDays === days
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {days} kun
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold">Boshlanish sanasi</label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(event) => handleStartChange(event.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold">Tugash sanasi</label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                endDate: event.target.value,
                durationDays: null,
              }))
            }
            className="h-10"
          />
        </div>
      </div>
    </StepSection>
  );
};

export default StepDuration;
