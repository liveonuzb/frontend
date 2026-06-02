import React from "react";
import toNumber from "lodash/toNumber";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const servingPresets = [1, 2, 3];

const toServingValue = (value) => Math.max(0.25, toNumber(value) || 1);

const ServingAdjuster = ({ value, onChange }) => {
  const rt = useRecipeTranslation();
  const label = rt("detail.serving");

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </div>
      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_minmax(86px,1.2fr)] gap-2">
        {servingPresets.map((serving) => (
          <Button
            key={serving}
            type="button"
            variant={value === serving ? "default" : "outline"}
            className="h-9"
            aria-pressed={value === serving}
            onClick={() => onChange(serving)}
          >
            {serving}x
          </Button>
        ))}
        <Input
          type="number"
          min="0.25"
          step="0.25"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(toServingValue(event.target.value))}
        />
      </div>
    </div>
  );
};

export default ServingAdjuster;
