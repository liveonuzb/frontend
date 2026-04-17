import { times, clamp } from "lodash";
import React from "react";
import { ScrollPicker } from "@/components/ui/scroll-picker";

const KG_ITEMS = times(221, (index) => {
  const value = String(index + 30);
  return {
    value,
    label: value,
  };
});

const DECIMAL_ITEMS = times(10, (index) => {
  const value = String(index);
  return {
    value,
    label: value,
  };
});

const normalizeWeightValue = (value) => {
  const raw = String(value ?? "").trim();
  const normalized = Number(raw);

  if (!Number.isFinite(normalized)) {
    return {
      kilograms: "70",
      decimal: "0",
    };
  }

  const clamped = clamp(normalized, 30, 250.9);
  const [kilograms, decimal = "0"] = clamped.toFixed(1).split(".");

  return {
    kilograms,
    decimal,
  };
};

export const WeightPicker = ({
  value,
  onChange,
  unit = "kg",
  itemHeight = 56,
}) => {
  const { kilograms, decimal } = React.useMemo(
    () => normalizeWeightValue(value),
    [value],
  );

  const commitValue = React.useCallback(
    (nextKilograms, nextDecimal) => {
      onChange(`${nextKilograms}.${nextDecimal}`);
    },
    [onChange],
  );

  return (
    <div className="flex items-center justify-center gap-1">
      <div className="flex items-center justify-center">
        <div className={"w-28 flex justify-end"}>
          <div>
            <ScrollPicker
              items={KG_ITEMS}
              value={kilograms}
              onChange={(nextKilograms) => commitValue(nextKilograms, decimal)}
              itemHeight={itemHeight}
            />
          </div>
        </div>
        <div
          className="relative z-10 flex items-center justify-center"
          style={{ height: itemHeight * 5 }}
        >
          <span className="text-[40px] font-black leading-none text-foreground">
            .
          </span>
        </div>
        <div className="relative z-0 -ml-2 w-12">
          <ScrollPicker
            items={DECIMAL_ITEMS}
            value={decimal}
            onChange={(nextDecimal) => commitValue(kilograms, nextDecimal)}
            itemHeight={itemHeight}
          />
        </div>
      </div>
      <span className="shrink-0 text-2xl font-bold">{unit}</span>
    </div>
  );
};
