import React, { useState, useCallback, useLayoutEffect } from "react";
import { toPairs } from "lodash";
import { CalculatorIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Slider } from "@/components/ui/slider.jsx";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import GaugeProgress from "./gauge-progress.jsx";

const PortionEditorDrawer = ({
  food,
  onClose,
  onSave,
  calculateMacros,
  dailyGoals,
}) => {
  const [grams, setGrams] = useState(food?.grams ?? 100);

  // food o'zgarganda grams ni reset qilish (useLayoutEffect — paint dan oldin, flicker yo'q)
  useLayoutEffect(() => {
    if (food) setGrams(food.grams);
  }, [food?.id]);

  const macros = food ? calculateMacros(food, grams) : null;

  const isGrams = !food?.unit || food?.unit === "g" || food?.unit === "ml";
  const sliderMax = isGrams ? 1000 : (food?.step || 1) * 20;
  const maxCal = food ? calculateMacros(food, sliderMax).cal : 0;

  const handleSave = useCallback(() => {
    if (!food) return;
    onSave(food.colId, food.id, grams);
    onClose();
  }, [food, grams, onSave, onClose]);

  return (
    <Drawer
      direction="bottom"
      open={!!food}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent className="p-4 data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle className="flex justify-center items-center gap-2">
            <span>{food?.emoji}</span>
            <span>{food?.name}</span>
          </DrawerTitle>
          <DrawerDescription>
            Porsiya hajmini tanlang (grammda)
          </DrawerDescription>
        </DrawerHeader>

        {food && macros && (
          <div className="w-full md:max-w-md mx-auto">
            {food.image && (
              <div className="h-56 rounded-2xl overflow-hidden bg-muted/30 mx-auto">
                <img
                  src={food.image}
                  alt={food.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col items-center">
              <GaugeProgress
                value={macros.cal}
                min={0}
                max={maxCal}
                id={food.id}
                label="QO'SHILMOQDA"
              />
              <div className="grid grid-cols-3 gap-8 w-full py-6">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    🍗 Oqsil
                  </span>
                  <span className="text-base font-black">
                    <span className="text-red-500">{macros.protein}</span>
                    <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                      /{dailyGoals.protein}g
                    </span>
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 border-l border-r border-border/50 px-4">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    🍴 Uglevod
                  </span>
                  <span className="text-base font-black">
                    <span className="text-orange-500">{macros.carbs}</span>
                    <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                      /{dailyGoals.carbs}g
                    </span>
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    🥑 Yog&apos;
                  </span>
                  <span className="text-base font-black">
                    <span className="text-green-500">{macros.fat}</span>
                    <span className="opacity-50 text-xs text-muted-foreground font-semibold">
                      /{dailyGoals.fat}g
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 mb-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Miqdori:
                </span>
                <span className="text-2xl font-black text-primary">
                  {grams}
                  {food.unit || "g"}
                </span>
              </div>
              <Slider
                value={[grams]}
                min={food.step || 10}
                max={sliderMax}
                step={food.step || 10}
                onValueChange={([val]) => setGrams(val)}
              />
            </div>

            {food.vitamins && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <CalculatorIcon className="size-3" /> Vitaminlar va Minerallar
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {toPairs(food.vitamins).map(([name, amount]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground font-medium">
                        {name}
                      </span>
                      <span className="font-black text-foreground">
                        {amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DrawerFooter className="px-0">
          <div className="w-full md:max-w-md mx-auto space-y-4">
            <Button className="w-full" variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button className="w-full" onClick={handleSave}>
              Saqlash
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PortionEditorDrawer;
