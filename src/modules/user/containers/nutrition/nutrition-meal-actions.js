import React from "react";
import { UndoIcon } from "lucide-react";
import { toast } from "sonner";
import { normalizeDayData } from "@/modules/user/lib/nutrition-normalizers";

import isArray from "lodash/isArray";
import map from "lodash/map";

export const buildMealTransferPayload = (food = {}, targetDate) => ({
  ...food,
  id: undefined,
  isConsumed: undefined,
  isFromPlanLinked: undefined,
  isPlanned: undefined,
  source: food.source ?? "manual",
  addedAt: new Date(`${targetDate}T12:00:00`).toISOString(),
});

export const buildPlannedMealPayload = (food = {}, payload = {}) => {
  const macros = payload.macros || {};

  return {
    ...food,
    addedFromPlan: true,
    source: "meal-plan",
    grams: payload.grams ?? food.grams,
    cal: macros.cal ?? food.cal,
    protein: macros.protein ?? food.protein,
    carbs: macros.carbs ?? food.carbs,
    fat: macros.fat ?? food.fat,
    image: payload.image ?? food.image ?? null,
    ingredients: payload.ingredients ?? food.ingredients ?? [],
  };
};

export const buildMealImagePatch = ({
  imageDataUrl,
  adjustedGrams,
  macros,
}) => {
  if (adjustedGrams != null && macros) {
    return {
      ...(imageDataUrl != null ? { image: imageDataUrl } : {}),
      ...(imageDataUrl != null ? { source: "camera" } : {}),
      grams: adjustedGrams,
      cal: macros.cal,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
    };
  }

  if (imageDataUrl != null) {
    return {
      image: imageDataUrl,
      source: "camera",
    };
  }

  return null;
};

export const buildHistoryCopyPayload = (food = {}, now = new Date()) => ({
  ...food,
  source: food.source ?? "manual",
  addedAt: now.toISOString(),
});

export const buildCopyToTodayPayload = (food = {}) => ({
  ...food,
  id: undefined,
  source: "history-copy",
  addedAt: undefined,
  isConsumed: undefined,
  isFromPlanLinked: undefined,
});

export const useNutritionMealActions = ({
  addMealAction,
  addWaterCup,
  date,
  dateKey,
  mealTransferContext,
  meals,
  patchMeal,
  refetchYesterday,
  removeMealAction,
  setMealTransferContext,
  todayKey,
}) => {
  const handleRemoveFood = React.useCallback(
    async (type, food) => {
      try {
        await removeMealAction(dateKey, type, food.id);
        toast("Ovqat o'chirildi", {
          action: {
            label: "Qaytarish",
            onClick: () => {
              void addMealAction(dateKey, type, food).catch(() => {
                toast.error("Ovqatni qaytarib bo'lmadi");
              });
            },
          },
          icon: React.createElement(UndoIcon, { className: "size-4" }),
          duration: 5000,
        });
      } catch {
        toast.error("Ovqatni o'chirib bo'lmadi");
      }
    },
    [addMealAction, dateKey, removeMealAction],
  );

  const handleBulkRemoveFoods = React.useCallback(
    async (selectedItems) => {
      if (!isArray(selectedItems) || selectedItems.length === 0) {
        return;
      }

      try {
        for (const item of selectedItems) {
          if (!item?.mealType || !item?.food?.id) continue;
          await removeMealAction(dateKey, item.mealType, item.food.id);
        }
        toast.success(`${selectedItems.length} ta ovqat o'chirildi`);
      } catch {
        toast.error("Tanlangan ovqatlarni o'chirib bo'lmadi");
      }
    },
    [dateKey, removeMealAction],
  );

  const handleTransferMeal = React.useCallback(
    ({ mode, mealType, food }) => {
      if (!food?.id) return;

      setMealTransferContext({
        mode,
        sourceDate: dateKey,
        sourceMealType: mealType,
        food,
      });
    },
    [dateKey, setMealTransferContext],
  );

  const handleConfirmMealTransfer = React.useCallback(
    async ({ mode, food, targetDate, targetMealType }) => {
      if (!mealTransferContext || !food?.id || !targetDate || !targetMealType) {
        return;
      }

      const isMove = mode === "move";
      const sourceDate = mealTransferContext.sourceDate;
      const sourceMealType = mealTransferContext.sourceMealType;

      if (
        isMove &&
        sourceDate === targetDate &&
        sourceMealType === targetMealType
      ) {
        toast("Bu ovqat allaqachon shu kunda va shu bo'limda turibdi");
        return;
      }

      try {
        await addMealAction(
          targetDate,
          targetMealType,
          buildMealTransferPayload(food, targetDate),
        );

        if (isMove) {
          await removeMealAction(sourceDate, sourceMealType, food.id);
        }

        toast.success(isMove ? "Ovqat ko'chirildi" : "Ovqatdan nusxa olindi");
        setMealTransferContext(null);
      } catch {
        toast.error(
          isMove
            ? "Ovqatni ko'chirib bo'lmadi"
            : "Ovqatdan nusxa olib bo'lmadi",
        );
      }
    },
    [
      addMealAction,
      mealTransferContext,
      removeMealAction,
      setMealTransferContext,
    ],
  );

  const handleTogglePlanned = React.useCallback(
    async (typeKey, food) => {
      try {
        if (food.isConsumed) {
          await removeMealAction(dateKey, typeKey, food.id);
          return;
        }

        const foodToLog = { ...food };
        delete foodToLog.isPlanned;
        delete foodToLog.isConsumed;
        delete foodToLog.colType;
        await addMealAction(dateKey, typeKey, {
          ...foodToLog,
          addedFromPlan: true,
          source: "meal-plan",
        });
      } catch {
        toast.error("Ovqat rejasini yangilab bo'lmadi");
      }
    },
    [addMealAction, dateKey, removeMealAction],
  );

  const handleLogPlanned = React.useCallback(
    async (typeKey, food, payload = {}) => {
      try {
        await addMealAction(
          dateKey,
          typeKey,
          buildPlannedMealPayload(food, payload),
        );
      } catch {
        toast.error("Ovqatni log qilib bo'lmadi");
      }
    },
    [addMealAction, dateKey],
  );

  const handleCopyFromYesterday = React.useCallback(
    async (mealType) => {
      try {
        const result = await refetchYesterday();
        const yesterdayMeals =
          normalizeDayData(result.data?.data).meals?.[mealType] || [];

        if (yesterdayMeals.length === 0) {
          toast("Kecha bu ovqat bo'sh edi");
          return;
        }

        const currentBarcodes = new Set(
          map(meals[mealType], (f) => f.barcode || f.id),
        );
        let addedCount = 0;

        for (const food of yesterdayMeals) {
          if (!currentBarcodes.has(food.barcode || food.id)) {
            await addMealAction(
              dateKey,
              mealType,
              buildHistoryCopyPayload(food),
            );
            addedCount++;
          }
        }

        if (addedCount > 0) {
          toast.success(`${addedCount} ta ovqat kechadan nusxalandi`);
        } else {
          toast("Barcha ovqatlar allaqachon qo'shilgan");
        }
      } catch {
        toast.error("Kechagi ovqatlarni yuklab bo'lmadi");
      }
    },
    [addMealAction, dateKey, meals, refetchYesterday],
  );

  const handleMealImageUpload = React.useCallback(
    (mealType, foodId, imageDataUrl, adjustedGrams, macros) => {
      const patch = buildMealImagePatch({
        imageDataUrl,
        adjustedGrams,
        macros,
      });

      if (!patch) {
        return;
      }

      void patchMeal(dateKey, mealType, foodId, patch).catch(() => {
        toast.error(
          adjustedGrams != null && macros
            ? "Ovqatni yangilab bo'lmadi"
            : "Rasmni saqlab bo'lmadi",
        );
      });
    },
    [dateKey, patchMeal],
  );

  const handleUpdateMeal = React.useCallback(
    (mealType, foodId, patch) => {
      void patchMeal(dateKey, mealType, foodId, patch).catch(() => {
        toast.error("Ovqatni yangilab bo'lmadi");
      });
    },
    [dateKey, patchMeal],
  );

  const handleCopyMealToToday = React.useCallback(
    async (mealType, food) => {
      try {
        await addMealAction(todayKey, mealType, buildCopyToTodayPayload(food));
        toast.success(`${food.name || "Ovqat"} bugunga qo'shildi`);
      } catch {
        toast.error("Ovqatni bugunga qo'shib bo'lmadi");
      }
    },
    [addMealAction, todayKey],
  );

  const handleAddWaterCup = React.useCallback(async () => {
    try {
      await addWaterCup(date, 250);
      toast.success("250 ml suv qo'shildi");
    } catch {
      toast.error("Suvni qo'shib bo'lmadi");
    }
  }, [addWaterCup, date]);

  return {
    handleAddWaterCup,
    handleBulkRemoveFoods,
    handleConfirmMealTransfer,
    handleCopyFromYesterday,
    handleCopyMealToToday,
    handleLogPlanned,
    handleMealImageUpload,
    handleRemoveFood,
    handleTogglePlanned,
    handleTransferMeal,
    handleUpdateMeal,
  };
};
