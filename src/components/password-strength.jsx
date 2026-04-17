import React from "react";
import { clamp, times } from "lodash";
import { cn } from "@/lib/utils";

const STRENGTH_LEVELS = [
  { label: "Juda zaif", color: "bg-destructive" },
  { label: "Zaif", color: "bg-orange-500" },
  { label: "O'rtacha", color: "bg-yellow-500" },
  { label: "Yaxshi", color: "bg-lime-500" },
  { label: "Kuchli", color: "bg-green-600" },
];

function calcStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return clamp(score, 0, 4);
}

export function PasswordStrength({ password }) {
  const strength = calcStrength(password);

  if (!password) return null;

  const level = STRENGTH_LEVELS[strength];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {times(4, (i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= strength - 1 ? level.color : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{level.label}</p>
    </div>
  );
}
