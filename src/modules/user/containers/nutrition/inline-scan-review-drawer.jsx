import React from "react";
import { Input } from "@/components/ui/input.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer.jsx";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import {
  MealDraftCard,
  MealDraftSummaryCard,
} from "./meal-draft-review.jsx";
import {
  getDraftImageUrl,
  getDraftNutritionPreview,
  getDraftPortion,
} from "./meal-draft-review-utils.js";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";

import { toNumber, trim } from "lodash";

export default function InlineScanReviewDrawer({
  open,
  onOpenChange,
  scan,
  goals,
  onConfirm,
  onConfirmAll,
  onDiscard,
  groupDraftCount = 0,
  isSaving = false,
}) {
  const [draft, setDraft] = React.useState(null);
  const [manualMacros, setManualMacros] = React.useState(null);
  const [manualGrams, setManualGrams] = React.useState(null);
  const [manualTouched, setManualTouched] = React.useState(false);

  /*
   * Opening a scan review drawer copies the selected draft into local editable
   * form state, including manual macro overrides.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open && scan?.item) {
      const nextDraft = {
        ...scan.item,
        imageUrl: scan.imageUrl || scan.imageDataUrl || getDraftImageUrl(scan.item),
      };
      const preview = getDraftNutritionPreview(nextDraft);
      setDraft(nextDraft);
      setManualMacros({
        calories: preview.calories,
        protein: preview.protein,
        carbs: preview.carbs,
        fat: preview.fat,
        fiber: preview.fiber,
      });
      setManualGrams(getDraftPortion(nextDraft));
      setManualTouched(false);
    }
  }, [open, scan]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setMacroValue = React.useCallback((key, value) => {
    const numeric = Math.max(0, toNumber(value) || 0);
    setManualTouched(true);
    setManualMacros((current) => ({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      ...(current || {}),
      [key]: numeric,
    }));
  }, []);

  const handleIngredientUpdate = React.useCallback((ingredientId, ingredient) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            ingredients: updateMealIngredient(
              current.ingredients,
              ingredientId,
              ingredient,
            ),
          }
        : current,
    );
  }, []);

  const handleIngredientRemove = React.useCallback((ingredientId) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            ingredients: removeMealIngredient(current.ingredients, ingredientId),
          }
        : current,
    );
  }, []);

  const handleIngredientAdd = React.useCallback((ingredient) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            ingredients: addMealIngredient(current.ingredients, ingredient),
          }
        : current,
    );
  }, []);

  const imageUrl = scan?.imageUrl || scan?.imageDataUrl || getDraftImageUrl(draft);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <NutritionDrawerContent size="lg">
        <DrawerHeader className="border-b border-border/40">
          <DrawerTitle>AI topgan ovqatni tekshirish</DrawerTitle>
          <DrawerDescription>
            Nom, porsiya va ingredientlarni saqlashdan oldin tahrirlang.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-4">
          {imageUrl ? (
            <div
              className="overflow-hidden rounded-2xl bg-muted"
              style={{ aspectRatio: "16/9" }}
            >
              <img
                loading="lazy"
                src={imageUrl}
                alt={draft?.title || "Ovqat rasmi"}
                className="h-full max-h-56 w-full object-cover"
              />
            </div>
          ) : null}

          <Input
            value={draft?.title || ""}
            onChange={(event) =>
              setDraft((current) =>
                current ? { ...current, title: event.target.value } : current,
              )
            }
            placeholder="Ovqat nomi"
          />

          <MealDraftSummaryCard items={draft ? [draft] : []} goals={goals} />

          <div className="rounded-2xl border bg-card p-3">
            <div className="mb-3">
              <p className="text-sm font-semibold">Porsiya va makrolar</p>
              <p className="text-[11px] text-muted-foreground">
                AI qiymatlarini kerak bo'lsa qo'lda tuzating.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Input
                type="number"
                min="0"
                value={manualGrams ?? 0}
                onChange={(event) => {
                  setManualTouched(true);
                  setManualGrams(Math.max(0, toNumber(event.target.value) || 0));
                }}
                aria-label="Porsiya gramm"
              />
              <Input
                type="number"
                min="0"
                value={manualMacros?.calories ?? 0}
                onChange={(event) =>
                  setMacroValue("calories", event.target.value)
                }
                aria-label="Kaloriya"
              />
              <Input
                type="number"
                min="0"
                value={manualMacros?.protein ?? 0}
                onChange={(event) => setMacroValue("protein", event.target.value)}
                aria-label="Oqsil"
              />
              <Input
                type="number"
                min="0"
                value={manualMacros?.carbs ?? 0}
                onChange={(event) => setMacroValue("carbs", event.target.value)}
                aria-label="Uglevod"
              />
              <Input
                type="number"
                min="0"
                value={manualMacros?.fat ?? 0}
                onChange={(event) => setMacroValue("fat", event.target.value)}
                aria-label="Yog'"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-semibold text-muted-foreground sm:grid-cols-5">
              <span>gramm</span>
              <span>kcal</span>
              <span>oqsil</span>
              <span>uglevod</span>
              <span>yog'</span>
            </div>
          </div>

          {draft ? (
            <MealDraftCard
              item={draft}
              onIngredientUpdate={handleIngredientUpdate}
              onIngredientRemove={handleIngredientRemove}
              onIngredientAdd={handleIngredientAdd}
              onRemove={onDiscard}
            />
          ) : null}
        </DrawerBody>

        <DrawerFooter>
          {groupDraftCount > 1 ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onConfirmAll}
            >
              Hammasini tasdiqlash
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={isSaving || !trim(draft?.title)}
            onClick={() =>
              draft &&
              onConfirm?.({
                ...draft,
                manualNutritionOverride: manualTouched ? manualMacros : null,
                manualGramsOverride: manualTouched ? manualGrams : null,
              })
            }
          >
            {isSaving ? "Saqlanmoqda" : "Tasdiqlash"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
          >
            Bekor qilish
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
}
