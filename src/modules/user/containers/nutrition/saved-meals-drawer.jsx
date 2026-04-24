import React from "react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { PencilIcon, Trash2Icon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useSavedMeals,
  useSavedMealsActions,
} from "@/hooks/app/use-saved-meals";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import MealIngredientsEditorDrawer from "./meal-ingredients-editor-drawer.jsx";

const buildLoggedMealFromSavedMeal = (savedMeal) => ({
  name: savedMeal.name,
  source: "saved-meal",
  savedMealId: savedMeal.id,
  cal: savedMeal.calories,
  protein: savedMeal.protein,
  carbs: savedMeal.carbs,
  fat: savedMeal.fat,
  fiber: savedMeal.fiber,
  grams: savedMeal.grams,
  image: savedMeal.imageUrl,
  ingredients: savedMeal.ingredients,
});

const SavedMealsDrawer = ({
  open,
  onOpenChange,
  dateKey,
  mealType,
  onAddMeal,
}) => {
  const { items, isLoading } = useSavedMeals();
  const { updateSavedMeal, deleteSavedMeal, isSaving } = useSavedMealsActions();
  const [editingMeal, setEditingMeal] = React.useState(null);

  const handleQuickLog = React.useCallback(
    async (savedMeal) => {
      if (!onAddMeal || !dateKey || !mealType) return;

      try {
        await onAddMeal(
          dateKey,
          mealType,
          buildLoggedMealFromSavedMeal(savedMeal),
        );
        toast.success(`${savedMeal.name} qo'shildi`);
      } catch {
        toast.error("Taomni log qilib bo'lmadi");
      }
    },
    [dateKey, mealType, onAddMeal],
  );

  const handleDelete = React.useCallback(
    async (savedMealId) => {
      try {
        await deleteSavedMeal(savedMealId);
        toast.success("Taom o'chirildi");
      } catch {
        toast.error("Taomni o'chirib bo'lmadi");
      }
    },
    [deleteSavedMeal],
  );

  const handleUpdate = React.useCallback(
    async (ingredients) => {
      if (!editingMeal) return;

      try {
        await updateSavedMeal(editingMeal.id, {
          name: editingMeal.name,
          source: editingMeal.source,
          imageUrl: editingMeal.imageUrl,
          ingredients,
        });
        toast.success("Taom yangilandi");
        setEditingMeal(null);
      } catch {
        toast.error("Taomni yangilab bo'lmadi");
      }
    },
    [editingMeal, updateSavedMeal],
  );

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>Mening taomlarim</DrawerTitle>
            <DrawerDescription>
              Oldin saqlangan taomlarni tez log qiling yoki ingredientlarini
              tahrirlang.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="p-0">
            <ScrollArea className="h-full px-5 pb-8">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-20 rounded-3xl" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">
                  Hali saqlangan taom yo&apos;q. AI orqali ovqat
                  qo&apos;shayotganda uni saqlab qo&apos;yishingiz mumkin.
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setEditingMeal(item)}
                      className="w-full cursor-pointer rounded-3xl border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted/30">
                          {item.imageUrl ? (
                            <img loading="lazy"
                              src={item.imageUrl}
                              alt={item.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-base">🍽️</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold">
                            {item.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                            <span className="rounded-full bg-muted px-2 py-0.5">
                              {item.calories} kcal
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5">
                              {item.ingredients.length} ingr.
                            </span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                              {Math.round(item.grams)} g
                            </span>
                            <span className="rounded-full bg-muted/70 px-2 py-0.5">
                              P {item.protein} · C {item.carbs} · F {item.fat}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="rounded-full text-muted-foreground"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingMeal(item);
                            }}
                            aria-label="Taomni tahrirlash"
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            className="rounded-full"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleQuickLog(item);
                            }}
                            aria-label="Tezkor log"
                          >
                            <ZapIcon className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="rounded-full text-muted-foreground hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(item.id);
                            }}
                            aria-label="Taomni o'chirish"
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DrawerBody>
        </NutritionDrawerContent>
      </Drawer>

      <MealIngredientsEditorDrawer
        open={Boolean(editingMeal)}
        onOpenChange={(nextOpen) => !nextOpen && setEditingMeal(null)}
        title={editingMeal?.name || "Taom"}
        description="Saved meal ingredientlarini tahrirlang."
        imageUrl={editingMeal?.imageUrl || null}
        initialIngredients={editingMeal?.ingredients || []}
        onSave={handleUpdate}
        isSaving={isSaving}
      />
    </>
  );
};

export default SavedMealsDrawer;
