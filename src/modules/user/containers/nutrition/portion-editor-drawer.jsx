import React, { useState, useCallback, useLayoutEffect } from "react";
import { round } from "lodash";
import { CalculatorIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Slider } from "@/components/ui/slider.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";

const calcMacros = (food, amount) => {
  const isUnit = food?.unit && food.unit !== "g" && food.unit !== "ml";
  const factor = isUnit ? amount / (food.defaultAmount || 1) : amount / 100;
  return {
    cal: round((food?.baseCal ?? food?.cal ?? 0) * factor),
    protein: round((food?.baseProtein ?? food?.protein ?? 0) * factor),
    carbs: round((food?.baseCarbs ?? food?.carbs ?? 0) * factor),
    fat: round((food?.baseFat ?? food?.fat ?? 0) * factor),
  };
};

const PortionEditorDrawer = ({ food, open, onClose, onConfirm }) => {
  const { goals } = useHealthGoals();
  const [grams, setGrams] = useState(food?.grams ?? food?.defaultAmount ?? 100);

  useLayoutEffect(() => {
    if (food && open) setGrams(food.grams ?? food.defaultAmount ?? 100);
  }, [food?.id, open]);

  const macros = food ? calcMacros(food, grams) : null;
  const isGrams = !food?.unit || food?.unit === "g" || food?.unit === "ml";
  const sliderMax = isGrams ? 1000 : (food?.step || 1) * 20;
  const maxCal = food ? calcMacros(food, sliderMax).cal : 0;

  const handleSave = useCallback(() => {
    if (!food || !macros) return;
    onConfirm(grams, macros);
    onClose();
  }, [food, grams, macros, onConfirm, onClose]);

  return (
    <Drawer
      direction="bottom"
      open={open}
      onOpenChange={(o) => !o && onClose()}
    >
      <DrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle className="flex justify-center items-center gap-2">
            <span>{food?.emoji}</span>
            <span>{food?.name}</span>
          </DrawerTitle>
          <DrawerDescription>
            Porsiya hajmini tanlang ({food?.unit || "g"})
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-4">
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
                        /{goals.protein}g
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
                        /{goals.carbs}g
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
                        /{goals.fat}g
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {food.vitamins && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                    <CalculatorIcon className="size-3" /> Vitaminlar va
                    Minerallar
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(food.vitamins).map(([name, amount]) => (
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
          <div className="space-y-1 mb-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-sm font-medium text-muted-foreground">
                Miqdori:
              </span>
              <span className="text-xl font-black text-primary">
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
        </DrawerBody>

        <DrawerFooter>
          <Button className="w-full" onClick={handleSave}>
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PortionEditorDrawer;
