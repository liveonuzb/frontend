import React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { track: "w-10 h-5", thumb: "size-4", translate: "translate-x-5" },
  md: { track: "w-11 h-6", thumb: "size-5", translate: "translate-x-5" },
};

const ToggleSwitch = ({
  checked,
  onChange,
  disabled = false,
  size = "sm",
  label,
  className,
}) => {
  const s = sizes[size] ?? sizes.sm;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        disabled && "cursor-not-allowed opacity-50",
        s.track,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full bg-white shadow-sm transition-transform",
          checked ? s.translate : "translate-x-0",
          s.thumb,
        )}
      />
    </button>
  );
};

export default ToggleSwitch;
