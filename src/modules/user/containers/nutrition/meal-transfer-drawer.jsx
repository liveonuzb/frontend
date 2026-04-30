import React from "react";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDaysIcon, CopyIcon, MoveRightIcon } from "lucide-react";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";
import { MEAL_TYPE_OPTIONS } from "@/modules/user/lib/meal-config";

const getTodayKey = () => new Date().toISOString().split("T")[0];

export default function MealTransferDrawer({
  open,
  onOpenChange,
  mode = "copy",
  food,
  sourceMealType = "breakfast",
  onConfirm,
}) {
  const [targetDate, setTargetDate] = React.useState(getTodayKey);
  const [targetMealType, setTargetMealType] = React.useState(sourceMealType);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isMove = mode === "move";

  React.useEffect(() => {
    if (!open) return;
    setTargetDate(getTodayKey());
    setTargetMealType(sourceMealType || "breakfast");
  }, [open, sourceMealType]);

  const handleConfirm = React.useCallback(async () => {
    if (!targetDate || !food) return;

    setIsSubmitting(true);
    try {
      await onConfirm?.({
        mode,
        food,
        targetDate,
        targetMealType,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [food, mode, onConfirm, onOpenChange, targetDate, targetMealType]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle>
            {isMove ? "Ovqatni ko'chirish" : "Ovqatdan nusxa olish"}
          </DrawerTitle>
          <DrawerDescription>
            {food?.name || "Ovqat"} uchun yangi kun va bo'limni tanlang
          </DrawerDescription>
        </DrawerHeader>

        <NutritionDrawerBody className="space-y-4 pb-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Sana</label>
            <div className="relative">
              <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="h-11 rounded-2xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Meal type</label>
            <Select value={targetMealType} onValueChange={setTargetMealType}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </NutritionDrawerBody>

        <DrawerFooter>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={!targetDate || isSubmitting}
            >
              {isMove ? (
                <MoveRightIcon className="size-4" />
              ) : (
                <CopyIcon className="size-4" />
              )}
              {isMove ? "Ko'chirish" : "Nusxa olish"}
            </Button>
          </div>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
