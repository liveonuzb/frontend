import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useFoodScan } from "@/hooks/app/use-food-catalog";
import { useSavedMealsActions } from "@/hooks/app/use-saved-meals";
import useHealthGoals from "@/hooks/app/use-health-goals";
import {
  buildMealPayloadFromDraft,
  getDraftImageUrl,
  MealDraftCard,
  MealDraftSummaryCard,
} from "./meal-draft-review.jsx";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";
import SaveToMyMealsButton from "./save-to-my-meals-button.jsx";

const formatLoggedAtHint = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTargetDateLabel = (value) => {
  if (!value) {
    return null;
  }

  return new Date(`${value}T12:00:00`).toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

export default function AiMealDraftDrawer({
  dateKey,
  mealType,
  initialText = "",
  inputSource = "text",
  loggedAtHint = null,
  targetDateKey = null,
  onClose,
}) {
  const [analysisItems, setAnalysisItems] = React.useState([]);
  const [analysisError, setAnalysisError] = React.useState(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveToMyMeals, setSaveToMyMeals] = React.useState(false);
  const autoAnalyzeRef = React.useRef(false);
  const sourceText = React.useMemo(
    () => String(initialText || "").trim(),
    [initialText],
  );

  const { addMeal: addMealAction } = useDailyTrackingActions();
  const { createSavedMeal } = useSavedMealsActions();
  const { analyzeMealTextDraft } = useFoodScan();
  const { goals } = useHealthGoals();
  const loggedAtHintLabel = React.useMemo(
    () => formatLoggedAtHint(loggedAtHint),
    [loggedAtHint],
  );
  const targetDateLabel = React.useMemo(
    () => formatTargetDateLabel(targetDateKey),
    [targetDateKey],
  );

  React.useEffect(() => {
    setAnalysisItems([]);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setIsSaving(false);
    setSaveToMyMeals(false);
    autoAnalyzeRef.current = false;
  }, [
    initialText,
    mealType,
    dateKey,
    inputSource,
    loggedAtHint,
    targetDateKey,
  ]);

  const handleAnalyze = React.useCallback(
    async (overrideText) => {
      const normalizedText = String(overrideText ?? sourceText).trim();

      if (!normalizedText) {
        toast.error("Ovqat matnini kiriting");
        return;
      }

      setIsAnalyzing(true);
      setAnalysisItems([]);
      setAnalysisError(null);

      try {
        const response = await analyzeMealTextDraft({
          text: normalizedText,
          mode: inputSource === "audio" ? "audio" : "text",
        });
        const items = Array.isArray(response?.items) ? response.items : [];
        setAnalysisItems(items);

        if (items.length === 0) {
          setAnalysisError("AI bu matndan draft tayyorlay olmadi.");
        }
      } catch (error) {
        const message =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          "Matnni AI orqali tahlil qilib bo'lmadi";
        setAnalysisError(message);
        toast.error(message);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [analyzeMealTextDraft, inputSource, sourceText],
  );

  React.useEffect(() => {
    if (!initialText.trim() || autoAnalyzeRef.current) {
      return;
    }

    autoAnalyzeRef.current = true;
    void handleAnalyze(initialText);
  }, [handleAnalyze, initialText]);

  const handleIngredientUpdate = React.useCallback(
    (draftId, ingredientId, ingredient) => {
      setAnalysisItems((current) =>
        current.map((item) =>
          item.id === draftId
            ? {
                ...item,
                ingredients: updateMealIngredient(
                  item.ingredients,
                  ingredientId,
                  ingredient,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleIngredientRemove = React.useCallback((draftId, ingredientId) => {
    setAnalysisItems((current) =>
      current.map((item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: removeMealIngredient(item.ingredients, ingredientId),
            }
          : item,
      ),
    );
  }, []);

  const handleIngredientAdd = React.useCallback((draftId, ingredient) => {
    setAnalysisItems((current) =>
      current.map((item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: addMealIngredient(item.ingredients, ingredient),
            }
          : item,
      ),
    );
  }, []);

  const handleRemoveItem = React.useCallback((draftId) => {
    setAnalysisItems((current) =>
      current.filter((item) => item.id !== draftId),
    );
  }, []);

  const handleConfirmItem = React.useCallback((draftId) => {
    setAnalysisItems((current) =>
      current.map((item) =>
        item.id === draftId
          ? {
              ...item,
              confidence: 1,
              reviewNeeded: false,
              ingredients: Array.isArray(item.ingredients)
                ? item.ingredients.map((ingredient) => ({
                    ...ingredient,
                    reviewNeeded: false,
                  }))
                : [],
              aiNotes: item.aiNotes || "Foydalanuvchi tomonidan tasdiqlandi.",
            }
          : item,
      ),
    );
  }, []);

  const handleSave = React.useCallback(async () => {
    if (analysisItems.length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      for (const item of analysisItems) {
        let savedMealId = null;
        if (saveToMyMeals) {
          const savedMeal = await createSavedMeal({
            name: item.title || "Ovqat",
            source: inputSource,
            imageUrl: getDraftImageUrl(item),
            ingredients: item.ingredients,
          });
          savedMealId = savedMeal.id;
        }

        await addMealAction(targetDateKey || dateKey, mealType, {
          ...buildMealPayloadFromDraft(item, {
            source: inputSource,
            addedAt: inputSource === "audio" ? loggedAtHint : undefined,
            savedMealId,
          }),
          addedFromPlan: false,
        });
      }

      toast.success(
        analysisItems.length === 1
          ? `${analysisItems[0].title} qo'shildi!`
          : `${analysisItems.length} ta ovqat qo'shildi!`,
      );
      onClose?.();
    } catch {
      toast.error("Ovqatlarni qo'shib bo'lmadi");
    } finally {
      setIsSaving(false);
    }
  }, [
    addMealAction,
    analysisItems,
    dateKey,
    inputSource,
    isSaving,
    loggedAtHint,
    mealType,
    onClose,
    createSavedMeal,
    saveToMyMeals,
    targetDateKey,
  ]);

  return (
    <>
      <DrawerHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DrawerTitle>
              {inputSource === "audio"
                ? "Audio orqali topilgan ovqatlar"
                : "AI orqali topilgan ovqatlar"}
            </DrawerTitle>
            <DrawerDescription>
              Bu drawer faqat AI draft review uchun. Katalog bilan aralashmaydi.
            </DrawerDescription>
          </div>
          <SaveToMyMealsButton
            checked={saveToMyMeals}
            onCheckedChange={setSaveToMyMeals}
          />
        </div>

        {inputSource === "audio" && loggedAtHintLabel ? (
          <div className="rounded-2xl border px-3 py-3 text-sm">
            <span className="text-muted-foreground">Aniqlangan vaqt:</span>{" "}
            <span className="font-semibold">{loggedAtHintLabel}</span>
          </div>
        ) : null}

        {inputSource === "audio" && targetDateLabel ? (
          <div className="rounded-2xl border px-3 py-3 text-sm">
            <span className="text-muted-foreground">Aniqlangan kun:</span>{" "}
            <span className="font-semibold capitalize">{targetDateLabel}</span>
          </div>
        ) : null}

        {sourceText ? (
          <div className="rounded-2xl border bg-muted/15 px-3 py-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {inputSource === "audio" ? "Audio matni" : "Matn manbasi"}
              </span>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                AI natijasi
              </span>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm font-medium">
              {sourceText}
            </p>
          </div>
        ) : null}
      </DrawerHeader>

      <DrawerBody className="p-0">
        <ScrollArea className="h-full px-5">
          {isAnalyzing ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-muted/20 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full border bg-background">
                <Loader2Icon className="size-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">
                  Matn AI orqali tahlil qilinmoqda
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ingredientlar va porsiyalar tayyorlanmoqda.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              <MealDraftSummaryCard
                items={analysisItems}
                goals={goals}
                emptyTitle="Ovqat topilmadi"
                emptyDescription={
                  analysisError || "AI bu matndan draft tayyorlay olmadi."
                }
              />

              {analysisItems.length > 0 ? (
                <div className="space-y-3">
                  {analysisItems.map((item) => (
                    <MealDraftCard
                      key={item.id}
                      item={item}
                      onIngredientUpdate={(ingredientId, ingredient) =>
                        handleIngredientUpdate(
                          item.id,
                          ingredientId,
                          ingredient,
                        )
                      }
                      onIngredientRemove={(ingredientId) =>
                        handleIngredientRemove(item.id, ingredientId)
                      }
                      onIngredientAdd={(ingredient) =>
                        handleIngredientAdd(item.id, ingredient)
                      }
                      onRemove={() => handleRemoveItem(item.id)}
                      onConfirm={() => handleConfirmItem(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">
                  AI natijasi shu drawer ichida ko&apos;rinadi.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DrawerBody>

      <DrawerFooter>
        <Button
          type="button"
          variant="outline"
          disabled={!sourceText || isAnalyzing || isSaving}
          onClick={() => void handleAnalyze()}
        >
          {isAnalyzing ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SparklesIcon className="size-4" />
          )}
          Qayta aniqlash
        </Button>
        <Button
          onClick={handleSave}
          disabled={analysisItems.length === 0 || isSaving || isAnalyzing}
        >
          {isSaving ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Saqlanmoqda
            </>
          ) : (
            "Tasdiqlash va qo'shish"
          )}
        </Button>
      </DrawerFooter>
    </>
  );
}
