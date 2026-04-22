import React from "react";
import { SaveAdd } from "iconsax-reactjs";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

export default function SaveToMyMealsButton({
  checked,
  onCheckedChange,
  className,
}) {
  return (
    <Button
      type="button"
      variant={checked ? "default" : "outline"}
      size="sm"
      aria-pressed={checked}
      className={cn("h-9 shrink-0 rounded-full px-3 text-xs", className)}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <SaveAdd className="size-4" variant={checked ? "Bold" : "Linear"} />
      Saqlash
    </Button>
  );
}
