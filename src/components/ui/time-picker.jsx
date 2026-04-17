import React from "react";
import { times } from "lodash";
import { ClockIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ui/scroll-picker";
import { cn } from "@/lib/utils";

const HOURS = times(24, (i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

const MINUTES = times(60, (i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

function parseTime(value) {
  if (!value) return { hour: "09", minute: "00" };
  const [h = "09", m = "00"] = String(value).split(":");
  return { hour: h.padStart(2, "0"), minute: m.padStart(2, "0") };
}

export function TimePicker({ value, onChange, disabled, placeholder = "Vaqt tanlash" }) {
  const [open, setOpen] = React.useState(false);
  const { hour, minute } = parseTime(value);
  const [tempHour, setTempHour] = React.useState(hour);
  const [tempMinute, setTempMinute] = React.useState(minute);

  const handleOpen = () => {
    const parsed = parseTime(value);
    setTempHour(parsed.hour);
    setTempMinute(parsed.minute);
    setOpen(true);
  };

  const handleConfirm = () => {
    onChange?.(`${tempHour}:${tempMinute}`);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm transition-colors",
          "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "pointer-events-none opacity-50",
          !value && "text-muted-foreground",
        )}
      >
        <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left tabular-nums">
          {value || placeholder}
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom" shouldScaleBackground={false}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="pb-0">
            <DrawerTitle className="text-center text-base">
              Vaqt tanlang
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex items-center justify-center gap-6 px-6 py-4">
            {/* Hour picker */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                Soat
              </span>
              <div className="w-full">
                <ScrollPicker
                  items={HOURS}
                  value={tempHour}
                  onChange={setTempHour}
                  itemHeight={56}
                />
              </div>
            </div>

            <div className="text-3xl font-bold text-foreground pb-4 shrink-0">
              :
            </div>

            {/* Minute picker */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs text-muted-foreground font-medium mb-1">
                Daqiqa
              </span>
              <div className="w-full">
                <ScrollPicker
                  items={MINUTES}
                  value={tempMinute}
                  onChange={setTempMinute}
                  itemHeight={56}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="text-center pb-2">
            <span className="text-4xl font-black tabular-nums text-primary">
              {tempHour}:{tempMinute}
            </span>
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="flex-1">
                Bekor qilish
              </Button>
            </DrawerClose>
            <Button className="flex-1" onClick={handleConfirm}>
              Tasdiqlash
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
