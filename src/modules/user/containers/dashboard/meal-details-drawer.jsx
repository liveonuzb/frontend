import React from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import toPairs from "lodash/toPairs";
import { toast } from "sonner";
import {
  CheckCircle2Icon,
  ImagePlusIcon,
  Loader2Icon,
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Card } from "@/components/ui/card.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useFoodScan } from "@/hooks/app/use-food-catalog";
import { buildPlannedMealPayload } from "@/modules/user/containers/nutrition/nutrition-meal-actions.js";
import FoodDetailPortionDrawer from "@/modules/user/containers/nutrition/food-detail-portion-drawer.jsx";
import { mergePlannedAndLoggedMealItems } from "@/modules/user/containers/nutrition/nutrition-meal-section-state.js";

const toFiniteNumber = (value, fallback = 0) => {
  const normalized = toNumber(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const getOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = toNumber(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const formatNumber = (value) => {
  const normalized = toFiniteNumber(value);
  return Number.isInteger(normalized)
    ? normalized.toLocaleString("en-US")
    : normalized.toLocaleString("en-US", { maximumFractionDigits: 1 });
};

const getMealQuantity = (meal) =>
  toFiniteNumber(get(meal, "qty", get(meal, "quantity", 1)), 1) || 1;

const getMealCalories = (meal) =>
  Math.round(
    toFiniteNumber(get(meal, "cal", get(meal, "calories", 0))) *
      getMealQuantity(meal),
  );

const getMealMacro = (meal, key) => toFiniteNumber(get(meal, key, 0));

const getMealGrams = (meal) =>
  getOptionalNumber(
    get(meal, "grams", get(meal, "defaultAmount", get(meal, "servingSize"))),
  );

const getMealUnit = (meal) => get(meal, "unit", get(meal, "servingUnit", "g"));

const getMealImage = (meal) => get(meal, "image", get(meal, "imageUrl", null));

const getMealActionKey = (meal) =>
  String(get(meal, "id", "") || get(meal, "name", "") || "meal");

const buildMealUndoPayload = (meal = {}) => ({
  ...meal,
  id: undefined,
  isConsumed: undefined,
  isFromPlanLinked: undefined,
  isPlanned: undefined,
});

const buildBaseValueForPortion = (total, grams) => {
  const normalizedTotal = toFiniteNumber(total);
  const normalizedGrams = toFiniteNumber(grams, 100);

  if (normalizedGrams <= 0) return normalizedTotal;

  return Math.round((normalizedTotal / normalizedGrams) * 1000) / 10;
};

const buildPortionEditItem = (meal) => {
  if (!meal) return null;

  const grams = getMealGrams(meal) || 100;
  const unit = getMealUnit(meal);
  const baseCal = buildBaseValueForPortion(getMealCalories(meal), grams);
  const baseProtein = buildBaseValueForPortion(getMealMacro(meal, "protein"), grams);
  const baseCarbs = buildBaseValueForPortion(getMealMacro(meal, "carbs"), grams);
  const baseFat = buildBaseValueForPortion(getMealMacro(meal, "fat"), grams);
  const baseFiber = buildBaseValueForPortion(getMealMacro(meal, "fiber"), grams);

  return {
    ...meal,
    image: getMealImage(meal),
    grams,
    defaultAmount: grams,
    servingSize: 100,
    unit,
    servingUnit: unit,
    baseCal,
    baseProtein,
    baseCarbs,
    baseFat,
    baseFiber,
    cal: baseCal,
    calories: baseCal,
    protein: baseProtein,
    carbs: baseCarbs,
    fat: baseFat,
    fiber: baseFiber,
  };
};

function MealFoodImage({ food, className }) {
  const name = get(food, "name", "Ovqat");
  const image = getMealImage(food);
  const emoji = get(food, "emoji", "🍽️");

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-muted/50",
        className,
      )}
    >
      {image ? (
        <img
          loading="lazy"
          src={image}
          alt={name}
          className="size-full object-cover"
        />
      ) : (
        <span className="text-lg leading-none" aria-hidden="true">
          {emoji}
        </span>
      )}
    </span>
  );
}

function MealDetailImageCard({
  food,
  canUpload,
  isUploading,
  onUploadImage,
}) {
  const inputRef = React.useRef(null);
  const name = get(food, "name", "Ovqat");
  const image = getMealImage(food);
  const uploadLabel = image ? "Rasmni almashtirish" : "Rasm qo'shish";

  const handlePickImage = () => {
    inputRef.current?.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Iltimos, rasm faylini tanlang.");
      return;
    }

    void onUploadImage?.(food, file);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-card"
    >
      <MealFoodImage food={food} className="h-48 w-full rounded-none" />
      {canUpload ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={`${name} uchun rasm tanlash`}
            onChange={handleImageChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute bottom-3 left-1/2 min-w-36 -translate-x-1/2 rounded-full border-border/70 bg-background/90 shadow-sm backdrop-blur"
            aria-label={`${name} uchun ${image ? "rasmni almashtirish" : "rasm qo'shish"}`}
            disabled={isUploading}
            onClick={handlePickImage}
          >
            {isUploading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ImagePlusIcon className="size-4" />
            )}
            {isUploading ? "Yuklanmoqda" : uploadLabel}
          </Button>
        </>
      ) : null}
    </div>
  );
}

function MealStatusPill({ food }) {
  const isConsumed = Boolean(food?.isConsumed);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
        isConsumed
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-primary/10 text-primary",
      )}
    >
      {isConsumed ? "Log qilindi" : "Rejada"}
    </span>
  );
}

function MealMacroLine({ food }) {
  return (
    <span className="block truncate text-[11px] font-medium text-muted-foreground">
      P {formatNumber(getMealMacro(food, "protein"))}g · C{" "}
      {formatNumber(getMealMacro(food, "carbs"))}g · F{" "}
      {formatNumber(getMealMacro(food, "fat"))}g
    </span>
  );
}

function MealMetric({ label, value, tone = "text-foreground" }) {
  return (
    <Card
      size="sm"
      className="min-w-0 justify-center px-3 py-2.5 !gap-y-1.5 !ring-0"
    >
      <p className="truncate text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-xl font-black leading-tight tabular-nums", tone)}>
        {value}
      </p>
    </Card>
  );
}

function MealMacroProgressCard({ label, value, colorClassName }) {
  const normalizedValue = Math.max(0, toFiniteNumber(value));
  const goal = 0;
  const progress =
    goal > 0
      ? Math.min(100, Math.round((normalizedValue / goal) * 100))
      : normalizedValue > 0
        ? 100
        : 0;

  return (
    <Card size="sm" className="min-w-0 px-3 py-2 !gap-y-1.5 !ring-0">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold text-foreground/80">
          {label}
        </p>
        <MoreHorizontal
          className="size-3.5 shrink-0 text-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex min-w-0 items-baseline gap-1 text-base font-black leading-none tracking-normal text-foreground">
        <span className="tabular-nums">{formatNumber(normalizedValue)}</span>
        <span className="truncate text-xs font-semibold text-muted-foreground">
          / {goal}g
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-2 overflow-hidden rounded-full bg-secondary/80"
      >
        <div
          className={cn("h-full rounded-full", colorClassName)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  );
}

function DashboardMealFoodRow({
  food,
  isLogging,
  onDelete,
  onLogPlanned,
  onOpenDetails,
}) {
  const name = get(food, "name", "Ovqat");
  const isConsumed = Boolean(food?.isConsumed);
  const isFromPlan = Boolean(food?.isFromPlanLinked);

  return (
    <article className="flex min-h-[76px] items-center gap-2 rounded-2xl border border-border/60 bg-card p-2.5">
      <button
        type="button"
        aria-label={`${name} ma'lumotlari`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onOpenDetails(food)}
      >
        <MealFoodImage food={food} className="size-14 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black leading-tight">
            {name}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="inline-flex items-baseline rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">
              <span>{getMealCalories(food)}</span>
              <span className="ml-0.5 text-[8px] uppercase">kcal</span>
            </span>
            <MealStatusPill food={food} />
          </span>
          <span className="mt-1 block">
            <MealMacroLine food={food} />
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {isFromPlan ? (
          <Button
            type="button"
            variant={isConsumed ? "outline" : "default"}
            size="icon"
            className={cn(
              "size-9 rounded-full",
              isConsumed &&
                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:text-emerald-700",
            )}
            aria-label={isConsumed ? `${name} log qilingan` : `${name} log qilish`}
            aria-pressed={isConsumed}
            disabled={isConsumed || isLogging}
            onClick={() => void onLogPlanned(food)}
          >
            {isLogging ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckCircle2Icon className="size-4" />
            )}
          </Button>
        ) : null}
        {isConsumed ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 rounded-full text-destructive hover:text-destructive"
            aria-label={`${name} o'chirish`}
            onClick={() => void onDelete(food)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function DashboardMealFoodDetailDrawer({
  open,
  onOpenChange,
  food,
  isLogging,
  isImageUploading,
  onEdit,
  onLogPlanned,
  onUploadImage,
}) {
  const name = get(food, "name", "Ovqat");
  const isConsumed = Boolean(food?.isConsumed);
  const isFromPlan = Boolean(food?.isFromPlanLinked);
  const grams = getMealGrams(food);
  const unit = getMealUnit(food);
  const ingredients = isArray(food?.ingredients) ? food.ingredients : [];
  const vitamins = food?.vitamins || null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom" nested>
      <DrawerContent
        className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
      >
        <DrawerHeader>
          <DrawerTitle>{name}</DrawerTitle>
          <DrawerDescription>
            {isConsumed ? "Log qilingan ovqat tafsilotlari" : "Rejadagi ovqat"}
          </DrawerDescription>
        </DrawerHeader>
        {food ? (
          <DrawerBody className="space-y-3 px-4 pb-0">
            <MealDetailImageCard
              food={food}
              canUpload={isConsumed}
              isUploading={isImageUploading}
              onUploadImage={onUploadImage}
            />

            <div
              className="grid grid-cols-2 gap-2"
            >
              <MealMetric
                label="Kaloriya"
                value={`${formatNumber(getMealCalories(food))} kcal`}
                tone="text-orange-500"
              />
              <MealMetric
                label="Miqdor"
                value={grams != null ? `${formatNumber(grams)}${unit}` : "-"}
              />
            </div>

            <div
              className="grid grid-cols-3 gap-2"
            >
              <MealMacroProgressCard
                label="Uglevod"
                value={getMealMacro(food, "carbs")}
                colorClassName="bg-lime-500"
              />
              <MealMacroProgressCard
                label="Oqsil"
                value={getMealMacro(food, "protein")}
                colorClassName="bg-orange-500"
              />
              <MealMacroProgressCard
                label="Yog'"
                value={getMealMacro(food, "fat")}
                colorClassName="bg-violet-500"
              />
            </div>

            {ingredients.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-sm font-black">
                  <UtensilsIcon className="size-4 text-primary" />
                  Ingredientlar
                </div>
                <div
                  className="space-y-2"
                >
                  {map(ingredients, (ingredient, index) => {
                    const ingredientName =
                      ingredient?.name || ingredient?.label || "Ingredient";
                    const ingredientGrams = getOptionalNumber(ingredient?.grams);
                    const ingredientCalories = getOptionalNumber(
                      ingredient?.calories ?? ingredient?.cal,
                    );

                    return (
                      <Card
                        key={ingredient?.id || `${ingredientName}-${index}`}
                        size="sm"
                        className="flex-row items-center gap-3 px-3 py-2 !gap-y-0 !ring-0"
                      >
                        <MealFoodImage
                          food={ingredient}
                          className="size-12 rounded-xl"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">
                            {ingredientName}
                          </span>
                          <span className="block truncate text-xs font-semibold text-muted-foreground">
                            {ingredientGrams != null
                              ? `${formatNumber(ingredientGrams)}g`
                              : ""}
                            {ingredientGrams != null &&
                            ingredientCalories != null
                              ? " · "
                              : ""}
                            {ingredientCalories != null
                              ? `${formatNumber(ingredientCalories)} kcal`
                              : ""}
                          </span>
                        </span>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {vitamins ? (
              <div className="rounded-2xl bg-primary/5 p-3">
                <p className="mb-2 text-xs font-black uppercase text-primary">
                  Vitaminlar va minerallar
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {map(toPairs(vitamins), ([key, value]) => (
                    <div
                      key={key}
                      className="flex min-w-0 items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate text-muted-foreground">
                        {key}
                      </span>
                      <span className="font-black">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </DrawerBody>
        ) : null}
        <DrawerFooter>
          {isConsumed ? (
            <Button
              type="button"
              className="rounded-full"
              aria-label="Tahrirlash"
              onClick={() => onEdit(food)}
            >
              <PencilIcon className="size-4" />
              Tahrirlash
            </Button>
          ) : isFromPlan ? (
            <Button
              type="button"
              className="rounded-full"
              aria-label={`${name} log qilish`}
              disabled={isLogging}
              onClick={() => void onLogPlanned(food)}
            >
              {isLogging ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckCircle2Icon className="size-4" />
              )}
              Log qilish
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DashboardMealEditDrawer({
  open,
  onOpenChange,
  meal,
  onConfirm,
}) {
  const [grams, setGrams] = React.useState(100);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const item = React.useMemo(() => buildPortionEditItem(meal), [meal]);

  React.useEffect(() => {
    if (!open || !meal) return;
    setGrams(getMealGrams(meal) || 100);
  }, [meal, open]);

  const handleSave = async (payload = {}) => {
    if (!meal?.id) return;

    const macros = payload.macros || {};
    const ingredients =
      payload.ingredients !== undefined
        ? payload.ingredients
        : payload.item?.ingredients;
    const patch = {
      grams: payload.grams ?? grams,
      cal: toFiniteNumber(macros.cal),
      protein: toFiniteNumber(macros.protein),
      carbs: toFiniteNumber(macros.carbs),
      fat: toFiniteNumber(macros.fat),
      fiber: toFiniteNumber(macros.fiber, getMealMacro(meal, "fiber")),
    };

    if (ingredients !== undefined) {
      patch.ingredients = ingredients;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({ meal, patch });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom" nested>
      <DrawerContent
        className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
      >
        {item ? (
          <FoodDetailPortionDrawer
            item={item}
            grams={grams}
            ingredients={item.ingredients}
            onGramsChange={setGrams}
            onSave={handleSave}
            isSaving={isSubmitting}
            saveLabel="Saqlash"
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

export default function DashboardMealDetailsDrawer({
  open,
  onOpenChange,
  dateKey,
  mealType,
  mealLabel,
  loggedItems = [],
  plannedItems = [],
  addDisabled = false,
  onAddMeal,
}) {
  const { addMeal, patchMeal, removeMeal } = useDailyTrackingActions();
  const { uploadMealCapture, isUploadingCapture } = useFoodScan();
  const [detailMeal, setDetailMeal] = React.useState(null);
  const [editMeal, setEditMeal] = React.useState(null);
  const [loggingKey, setLoggingKey] = React.useState(null);
  const [imageUploadKey, setImageUploadKey] = React.useState(null);
  const mergedItems = React.useMemo(
    () =>
      mergePlannedAndLoggedMealItems({
        items: loggedItems,
        plannedItems,
      }),
    [loggedItems, plannedItems],
  );

  React.useEffect(() => {
    if (open) return;
    setDetailMeal(null);
    setEditMeal(null);
    setLoggingKey(null);
    setImageUploadKey(null);
  }, [open]);

  const handleAdd = () => {
    if (addDisabled) return;

    onAddMeal?.(mealType);
    onOpenChange(false);
  };

  const handleLogPlanned = async (food) => {
    if (!food || food.isConsumed) return;

    const actionKey = getMealActionKey(food);
    setLoggingKey(actionKey);
    try {
      await addMeal(dateKey, mealType, buildPlannedMealPayload(food));
      toast.success(`${food.name || "Ovqat"} log qilindi`);
    } catch {
      toast.error("Ovqatni log qilib bo'lmadi");
    } finally {
      setLoggingKey(null);
    }
  };

  const handleDelete = async (food) => {
    if (!food?.id || !food.isConsumed) return;

    try {
      await removeMeal(dateKey, mealType, food.id);
      if (detailMeal?.id === food.id) {
        setDetailMeal(null);
      }
      toast("Ovqat o'chirildi", {
        action: {
          label: "Qaytarish",
          onClick: () => {
            void addMeal(dateKey, mealType, buildMealUndoPayload(food)).catch(
              () => {
                toast.error("Ovqatni qaytarib bo'lmadi");
              },
            );
          },
        },
      });
    } catch {
      toast.error("Ovqatni o'chirib bo'lmadi");
    }
  };

  const handleConfirmEdit = async ({ meal, patch }) => {
    try {
      await patchMeal(dateKey, mealType, meal.id, patch);
      toast.success("Ovqat yangilandi");
    } catch {
      toast.error("Ovqatni yangilab bo'lmadi");
      throw new Error("Meal update failed");
    }
  };

  const handleUploadImage = async (food, file) => {
    if (!food?.id || !food.isConsumed || !file) return;

    const actionKey = getMealActionKey(food);
    setImageUploadKey(actionKey);
    try {
      const imageUrl = await uploadMealCapture(file);
      if (!imageUrl) {
        throw new Error("Missing uploaded image URL");
      }

      await patchMeal(dateKey, mealType, food.id, { image: imageUrl });
      setDetailMeal((current) =>
        current?.id === food.id
          ? {
              ...current,
              image: imageUrl,
              imageUrl,
            }
          : current,
      );
      toast.success("Ovqat rasmi qo'shildi");
    } catch {
      toast.error("Ovqat rasmini yuklab bo'lmadi");
    } finally {
      setImageUploadKey(null);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent
          className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
        >
          <DrawerHeader>
            <DrawerTitle>{mealLabel}</DrawerTitle>
            <DrawerDescription>
              Log qilingan va rejadagi taomlar
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-2.5 px-4 pb-0">
            {mergedItems.length > 0 ? (
              map(mergedItems, (food, index) => (
                <DashboardMealFoodRow
                  key={food.id || `${food.name || "meal"}-${index}`}
                  food={food}
                  isLogging={loggingKey === getMealActionKey(food)}
                  onDelete={handleDelete}
                  onLogPlanned={handleLogPlanned}
                  onOpenDetails={setDetailMeal}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm font-black">Hali ovqat yo'q</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Shu bo'limga ovqat qo'shish uchun pastdagi tugmadan
                  foydalaning.
                </p>
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="button"
              className="rounded-full"
              aria-label={`${mealLabel} uchun ovqat qo'shish`}
              disabled={addDisabled}
              onClick={handleAdd}
            >
              <PlusIcon className="size-4" />
              Qo'shish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <DashboardMealFoodDetailDrawer
        open={Boolean(detailMeal)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDetailMeal(null);
        }}
        food={detailMeal}
        isLogging={
          detailMeal ? loggingKey === getMealActionKey(detailMeal) : false
        }
        isImageUploading={
          detailMeal
            ? imageUploadKey === getMealActionKey(detailMeal) ||
              isUploadingCapture
            : false
        }
        onEdit={setEditMeal}
        onLogPlanned={handleLogPlanned}
        onUploadImage={handleUploadImage}
      />

      <DashboardMealEditDrawer
        open={Boolean(editMeal)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditMeal(null);
        }}
        meal={editMeal}
        onConfirm={handleConfirmEdit}
      />
    </>
  );
}
