import React, { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { toInteger } from "lodash";

export default function DailyGoalModal({ children }) {
  const {
    goals: { waterMl },
    setGoal,
  } = useHealthGoals();
  const [open, setOpen] = useState(false);
  const [tempVal, setTempVal] = useState(waterMl);

  const handleSave = async () => {
    const val = toInteger(tempVal);
    if (val > 0) {
      try {
        await setGoal("waterMl", val);
        setOpen(false);
      } catch {
        // noop
      }
    }
  };

  React.useEffect(() => {
    if (open) {
      setTempVal(waterMl);
    }
  }, [open, waterMl]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Kunlik maqsad</DrawerTitle>
          <DrawerDescription>
            Bir kunda ichishingiz kerak bo'lgan suv miqdorini kiriting.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full">
              <NumberField
                value={tempVal}
                onValueChange={(val) => setTempVal(val ?? 0)}
                step={50}
                minValue={0}
                maxValue={10000}
                formatOptions={{
                  signDisplay: "never",
                  maximumFractionDigits: 0,
                }}
                className="flex flex-col items-center justify-center w-full"
              >
                <NumberFieldGroup className="border-none bg-transparent rounded-none p-0 focus-within:ring-0 flex items-center justify-between w-full h-auto gap-4">
                  <NumberFieldDecrement className="size-14 rounded-full border border-muted-foreground/20 bg-background hover:bg-muted shadow-sm flex-shrink-0 [&_svg]:size-6" />
                  <div className="relative flex-1 flex flex-col items-center">
                    <div className="relative w-full flex items-baseline justify-center gap-1.5">
                      <NumberFieldInput
                        placeholder="0"
                        className="w-full text-5xl font-black text-center outline-none py-4 border-b-4 border-primary/20 focus:border-primary transition-colors h-auto rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-0"
                        maxLength={5}
                      />
                      <span className="absolute right-0 bottom-6 text-xl font-bold text-muted-foreground pointer-events-none select-none opacity-50">
                        ml
                      </span>
                    </div>
                  </div>
                  <NumberFieldIncrement className="size-14 rounded-full border border-muted-foreground/20 bg-background hover:bg-muted shadow-sm flex-shrink-0 [&_svg]:size-6" />
                </NumberFieldGroup>
              </NumberField>
            </div>
            <span className="text-sm text-muted-foreground font-medium mb-2">
              (Tavsiya: 1000~5000 ml)
            </span>
          </div>
        </DrawerBody>

        <DrawerFooter className="mt-2">
          <Button
            onClick={handleSave}
            disabled={!tempVal || toInteger(tempVal) === 0}
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
