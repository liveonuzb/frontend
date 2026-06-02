import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  BarcodeIcon,
  CheckIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCcwIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import { MealDraftCard, MealDraftSummaryCard } from "./meal-draft-review.jsx";
import SaveToMyMealsButton from "./save-to-my-meals-button.jsx";

import map from "lodash/map";

const barcodeMacroInputs = [
  { key: "cal", label: "Kcal" },
  { key: "protein", label: "Oqsil" },
  { key: "carbs", label: "Uglevod" },
  { key: "fat", label: "Yog'" },
];

const getSliderMax = (food) => {
  const unit = food?.unit || "g";
  const isUnit = unit !== "g" && unit !== "ml";
  return isUnit ? (food?.step || 1) * 20 : 1000;
};

const AiResultContent = ({ ai }) => {
  if (ai.status === "analyzing") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10">
          <Loader2Icon className="size-7 animate-spin text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-black">AI tahlil qilmoqda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Rasm ichidagi ovqatlar va miqdorlar tekshirilmoqda.
          </p>
        </div>
      </div>
    );
  }

  if (ai.status === "empty") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
        <MealDraftSummaryCard
          items={[]}
          goals={ai.goals}
          emptyTitle="Ovqat aniqlanmadi"
          emptyDescription={
            ai.scanError ||
            "Rasmni qayta olib ko'ring yoki boshqa burchakdan oling."
          }
        />
        <Button type="button" variant="outline" onClick={ai.onRetake}>
          Qayta olish
        </Button>
      </div>
    );
  }

  if (ai.status === "error") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
        <MealDraftSummaryCard
          items={[]}
          goals={ai.goals}
          emptyTitle="AI xatoligi"
          emptyDescription={ai.scanError || "Ovqatni AI orqali aniqlab bo'lmadi"}
        />
        <Button type="button" variant="outline" onClick={ai.onRetake}>
          Qayta olish
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ai.imageUrl ? (
        <div
          className="relative w-full overflow-hidden rounded-2xl bg-muted"
          style={{ aspectRatio: "4/3" }}
        >
          <img
            loading="lazy"
            src={ai.imageUrl}
            alt="Ovqat rasmi"
            className="h-full max-h-[320px] w-full object-cover"
          />
          <button
            type="button"
            onClick={ai.onRetake}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
            aria-label="Qayta olish"
          >
            <RefreshCwIcon className="size-4" />
          </button>
        </div>
      ) : null}

      <MealDraftSummaryCard
        items={ai.items}
        goals={ai.goals}
        emptyTitle="Ovqat aniqlanmadi"
        emptyDescription={
          ai.scanError ||
          "Rasmni qayta olib ko'ring yoki boshqa burchakdan oling."
        }
      />

      {map(ai.items, (item) => (
        <MealDraftCard
          key={item.id}
          item={item}
          onIngredientUpdate={(ingredientId, ingredient) =>
            ai.onIngredientUpdate(item.id, ingredientId, ingredient)
          }
          onIngredientRemove={(ingredientId) =>
            ai.onIngredientRemove(item.id, ingredientId)
          }
          onIngredientAdd={(ingredient) => ai.onIngredientAdd(item.id, ingredient)}
          onRemove={() => ai.onRemove(item.id)}
          onConfirm={() => ai.onConfirm(item.id)}
        />
      ))}
    </div>
  );
};

const BarcodeResultContent = ({ barcode }) => {
  if (barcode.status === "loading" || barcode.isLookingUp) {
    return (
      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
            <Loader2Icon className="size-5 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-black">Barcode tekshirilmoqda</p>
            <p className="text-xs text-muted-foreground">{barcode.scannedCode}</p>
          </div>
        </div>
      </div>
    );
  }

  if (barcode.status === "found" && barcode.foundFood && barcode.foundMacros) {
    return (
      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-muted">
            {barcode.foundFood.image ? (
              <img
                src={barcode.foundFood.image}
                alt={barcode.foundFood.name}
                className="size-full object-cover"
              />
            ) : (
              <BarcodeIcon className="size-7 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-600">
              <CheckIcon className="size-3" />
              Topildi
            </div>
            <h3 className="truncate text-lg font-black">
              {barcode.foundFood.name}
            </h3>
            <p className="text-xs font-semibold text-muted-foreground">
              {barcode.scannedCode}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {map(
            [
              ["Kcal", barcode.foundMacros.cal],
              ["Oqsil", `${barcode.foundMacros.protein}g`],
              ["Uglevod", `${barcode.foundMacros.carbs}g`],
              ["Yog'", `${barcode.foundMacros.fat}g`],
            ],
            ([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-muted/60 px-3 py-2 text-center"
              >
                <p className="text-[10px] font-bold text-muted-foreground">
                  {label}
                </p>
                <p className="text-sm font-black">{value}</p>
              </div>
            ),
          )}
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground">
              Miqdori
            </span>
            <span className="text-xl font-black text-primary">
              {barcode.amount}
              {barcode.foundFood.unit || "g"}
            </span>
          </div>
          <Slider
            value={[barcode.amount]}
            min={barcode.foundFood.step || 10}
            max={getSliderMax(barcode.foundFood)}
            step={barcode.foundFood.step || 10}
            onValueChange={([value]) => barcode.onAmountChange(value)}
          />
        </div>
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={barcode.onReset}
            aria-label="Barcode reset"
          >
            <RefreshCcwIcon className="size-4" />
          </Button>
          <Button type="button" onClick={barcode.onAddFoundFood}>
            <PlusIcon className="mr-2 size-4" />
            Qo&apos;shish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border bg-card p-4 shadow-sm">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-600">
          <BarcodeIcon className="size-3" />
          {barcode.status === "error" ? "Xatolik" : "Topilmadi"}
        </div>
        <h3 className="text-lg font-black">Ovqatni qo&apos;l bilan kiriting</h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Barcode: {barcode.scannedCode || "noma'lum"}
        </p>
      </div>
      <div className="space-y-3">
        <Input
          placeholder="Ovqat nomi"
          value={barcode.manualFood.name}
          onChange={(event) =>
            barcode.onManualFieldChange("name", event.target.value)
          }
        />
        <div className="grid grid-cols-2 gap-2">
          {map(barcodeMacroInputs, (item) => (
            <label key={item.key} className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">
                {item.label}
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                value={barcode.manualFood[item.key]}
                onChange={(event) =>
                  barcode.onManualFieldChange(item.key, event.target.value)
                }
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-2">
          <label className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">
              Miqdor
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              value={barcode.manualFood.grams}
              onChange={(event) =>
                barcode.onManualFieldChange("grams", event.target.value)
              }
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground">
              Birlik
            </span>
            <Input
              value={barcode.manualFood.unit}
              onChange={(event) =>
                barcode.onManualFieldChange("unit", event.target.value)
              }
            />
          </label>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={barcode.onReset}
          aria-label="Barcode reset"
        >
          <RefreshCcwIcon className="size-4" />
        </Button>
        <Button type="button" onClick={barcode.onAddManualFood}>
          <PlusIcon className="mr-2 size-4" />
          Qo&apos;l bilan qo&apos;shish
        </Button>
      </div>
    </div>
  );
};

export default function CameraResultDrawer({
  open,
  resultType,
  onOpenChange,
  ai,
  barcode,
}) {
  const isAi = resultType === "ai";
  const title = isAi ? "AI topgan ovqatlar" : "Barcode natijasi";
  const description = isAi
    ? "Ingredientlarni tekshiring va ovqatni qo'shing."
    : "Barcode natijasini tekshiring yoki qo'l bilan kiriting.";

  return (
    <Drawer nested open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent
        size="sm"
        className="data-[vaul-drawer-direction=bottom]:h-[82vh] data-[vaul-drawer-direction=bottom]:max-h-[82vh]"
      >
        <DrawerHeader className="shrink-0 border-b border-border/40 px-5 pt-5 pb-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="truncate text-base font-semibold">
                {title}
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                {description}
              </DrawerDescription>
            </div>
            {isAi && ai.status === "ready" ? (
              <SaveToMyMealsButton
                checked={ai.saveToMyMeals}
                onCheckedChange={ai.onSaveToMyMealsChange}
              />
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Natijani yopish"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </DrawerHeader>

        <DrawerBody className="overflow-y-auto px-5 py-4">
          {isAi ? (
            <AiResultContent ai={ai} />
          ) : (
            <BarcodeResultContent barcode={barcode} />
          )}
        </DrawerBody>

        {isAi && ai.status === "ready" && ai.items.length > 0 ? (
          <DrawerFooter>
            <div className="grid w-full gap-3">
              <Button type="button" variant="outline" onClick={ai.onRetake}>
                Qayta olish
              </Button>
              <Button
                type="button"
                onClick={ai.onSave}
                disabled={
                  ai.items.length === 0 ||
                  ai.isSaving ||
                  ai.isAnalyzing ||
                  ai.isUploading
                }
              >
                {ai.isSaving || ai.isAnalyzing || ai.isUploading ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Saqlanmoqda
                  </>
                ) : (
                  "Tasdiqlash va qo'shish"
                )}
              </Button>
            </div>
          </DrawerFooter>
        ) : null}
      </NutritionDrawerContent>
    </Drawer>
  );
}
