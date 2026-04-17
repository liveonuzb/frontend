import "@ncdai/react-wheel-picker/style.css";

import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";

import { cn } from "@/lib/utils";

function WheelPickerWrapper({ className, ...props }) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        "px-1",
        "*:data-rwp:first:*:data-rwp-highlight-wrapper:rounded-s-md",
        "*:data-rwp:last:*:data-rwp-highlight-wrapper:rounded-e-md",
        className,
      )}
      {...props}
    />
  );
}

function WheelPicker({ classNames, ...props }) {
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: cn(
          "text-zinc-400 dark:text-zinc-500 data-disabled:opacity-40",
          classNames?.optionItem,
        ),
        highlightWrapper: cn(
          "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50",
          "data-rwp-focused:ring-2 data-rwp-focused:ring-zinc-300 data-rwp-focused:ring-inset dark:data-rwp-focused:ring-zinc-600",
          classNames?.highlightWrapper,
        ),
        highlightItem: cn(
          "data-disabled:opacity-40",
          classNames?.highlightItem,
        ),
      }}
      {...props}
    />
  );
}

export { WheelPicker, WheelPickerWrapper };
