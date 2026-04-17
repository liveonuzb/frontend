import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import useHealthGoals from "@/hooks/app/use-health-goals";

export default function TimeDrawer({ children, label, goalKey }) {
  const { goals, setGoal } = useHealthGoals();
  const currentValue = goals[goalKey] || "08:00";

  const [open, setOpen] = useState(false);
  const [tempVal, setTempVal] = useState(currentValue);

  const handleSave = async () => {
    if (tempVal) {
      try {
        await setGoal(goalKey, tempVal);
        setOpen(false);
      } catch {
        // noop
      }
    }
  };

  React.useEffect(() => {
    if (open) {
      setTempVal(goals[goalKey] || "08:00");
    }
  }, [goalKey, goals, open]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{label}</DrawerTitle>
          <DrawerDescription>
            Eslatmalar uchun kerakli vaqtni tanlang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full">
              <div className="bg-primary/5 border border-primary/20 w-full flex flex-col items-center justify-center rounded-[24px] relative overflow-hidden group shadow-inner">
                <input
                  type="time"
                  value={tempVal}
                  onChange={(e) => setTempVal(e.target.value)}
                  className="text-[4rem] bg-transparent outline-none border-none leading-[1.1] font-black tabular-nums tracking-wide text-primary text-center w-full max-w-full placeholder:text-muted-foreground/30 relative z-10 block py-8 cursor-pointer [color-scheme:dark] md:[color-scheme:light]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
              </div>
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter className="mt-4">
          <Button
            onClick={handleSave}
            disabled={!tempVal}
            className="w-full h-12 rounded-xl text-md font-bold"
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
