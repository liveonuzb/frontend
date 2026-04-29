import React from "react";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";

export const StepSection = ({ title, description, children }) => (
  <section className="space-y-3">
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {children}
  </section>
);

export const LabeledNumberField = ({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = "0",
}) => (
  <div className="space-y-2">
    <div>
      <label className="text-sm font-medium">{label}</label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <NumberField
      value={value}
      onValueChange={(nextValue) => onChange(nextValue ?? 0)}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={{ signDisplay: "never", maximumFractionDigits: 0 }}
    >
      <NumberFieldGroup className="h-10 bg-background">
        <NumberFieldDecrement className="px-3" />
        <NumberFieldInput className="text-base font-medium" placeholder={placeholder} />
        <NumberFieldIncrement className="px-3" />
      </NumberFieldGroup>
    </NumberField>
  </div>
);
