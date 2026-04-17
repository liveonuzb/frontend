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
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { toInteger } from "lodash";

export default function CustomCupDrawer({ children }) {
  const {
    goals: { cupSize, customCupSize },
    saveGoals,
  } = useHealthGoals();
  const [open, setOpen] = useState(false);
  const [tempVal, setTempVal] = useState(customCupSize || "");

  const handleSave = async () => {
    const val = toInteger(tempVal);
    if (val > 0 && val <= 2000) {
      try {
        await saveGoals({ customCupSize: val, cupSize: val });
        setOpen(false);
      } catch {
        // noop
      }
    }
  };

  React.useEffect(() => {
    if (open) {
      setTempVal(customCupSize || "");
    }
  }, [open, customCupSize]);

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Maxsus hajm</DrawerTitle>
          <DrawerDescription>
            Ichadigan suvingizning aniq hajmini kiriting.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-full">
              <NumberField
                value={tempVal}
                onValueChange={(val) =>
                  setTempVal(val !== undefined ? val : "")
                }
                step={50}
                minValue={0}
                maxValue={2000}
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
                        maxLength={4}
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
              (Tavsiya: Maks 2000 ml)
            </span>
          </div>
        </DrawerBody>

        <DrawerFooter className="mt-2">
          <Button
            onClick={handleSave}
            disabled={!tempVal || toInteger(tempVal) === 0}
            className="w-full"
          >
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
