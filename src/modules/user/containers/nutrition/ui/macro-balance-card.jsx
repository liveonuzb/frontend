import React from "react";
import { map } from "lodash";
import NutritionCard from "./nutrition-card.jsx";
import ProgressBar from "./progress-bar.jsx";

const macroItems = [
  { key: "protein", label: "Oqsil", tone: "protein" },
  { key: "carbs", label: "Uglevod", tone: "carbs" },
  { key: "fat", label: "Yog'", tone: "fat" },
];

export default function MacroBalanceCard({ macros, title = "Makro balans" }) {
  return (
    <NutritionCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Kunlik nishonlarga nisbatan
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {map(macroItems, (item) => {
          const macro = macros?.[item.key] || { current: 0, target: 0 };

          return (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-bold">{item.label}</span>
                <span className="font-semibold text-muted-foreground">
                  {macro.current}/{macro.target}g
                </span>
              </div>
              <ProgressBar
                className="mt-2"
                tone={item.tone}
                value={macro.current}
                target={macro.target}
                aria-label={`${item.label} progress`}
              />
            </div>
          );
        })}
      </div>
    </NutritionCard>
  );
}

