import { times } from "lodash";
import React from "react";
import { useTranslation } from "react-i18next";
import { ClockIcon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { WheelPicker, WheelPickerWrapper } from "../wheel-picker/wheel-picker";
import { cn } from "@/lib/utils";

const HOURS = times(24, (i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

const MINUTES = times(60, (i) => ({
  value: String(i).padStart(2, "0"),
  label: String(i).padStart(2, "0"),
}));

export const TimePicker = ({ value, onChange, className }) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  // Split "HH:mm" into components
  const [hour, minute] = (value || "18:00").split(":");

  const [tempHour, setTempHour] = React.useState(hour);
  const [tempMinute, setTempMinute] = React.useState(minute);

  React.useEffect(() => {
    if (open) {
      const [h, m] = (value || "18:00").split(":");
      setTempHour(h);
      setTempMinute(m);
    }
  }, [open, value]);

  const handleConfirm = () => {
    onChange(`${tempHour}:${tempMinute}`);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-2xl border bg-background px-4 py-2 text-sm transition-all hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          className,
        )}
      >
        <span className="font-medium tabular-nums">{value || "18:00"}</span>
        <ClockIcon className="size-4 text-muted-foreground" />
      </button>

      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader className="items-center text-center">
            <DrawerTitle>
              {t("coach.clients.drawers.timePicker.title", {
                defaultValue: "Tanlov",
              })}
            </DrawerTitle>
          </DrawerHeader>

          <div
            className="flex flex-col items-center justify-center p-6"
            data-vaul-no-drag
          >
            <WheelPickerWrapper>
              <div className="flex w-40 mx-auto items-center justify-center gap-6">
                <div className="flex-1 text-center">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                    Hours
                  </p>
                  <WheelPicker
                    options={HOURS}
                    value={tempHour}
                    onValueChange={setTempHour}
                    itemHeight={36}
                    visibleItems={5}
                  />
                </div>
                <div className="text-2xl font-bold text-muted-foreground self-center mt-6">
                  :
                </div>
                <div className="flex-1 text-center">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                    Minutes
                  </p>
                  <WheelPicker
                    options={MINUTES}
                    value={tempMinute}
                    onValueChange={setTempMinute}
                    itemHeight={36}
                    visibleItems={5}
                  />
                </div>
              </div>
            </WheelPickerWrapper>
          </div>

          <DrawerFooter className="pt-2">
            <Button onClick={handleConfirm} className="w-full">
              {t("coach.clients.drawers.timePicker.confirm", {
                defaultValue: "Tanlash",
              })}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
