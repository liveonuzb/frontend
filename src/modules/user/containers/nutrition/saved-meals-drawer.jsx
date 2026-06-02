import React from "react";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Input } from "@/components/ui/input.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import {
  ArrowDownAZIcon,
  CheckIcon,
  Clock3Icon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSavedMeals,
  useSavedMealsActions,
} from "@/hooks/app/use-saved-meals";
import { useSavedMealTemplates } from "@/hooks/app/use-saved-meal-templates";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import MealIngredientsEditorDrawer from "./meal-ingredients-editor-drawer.jsx";

import filter from "lodash/filter";
import includes from "lodash/includes";
import map from "lodash/map";
import orderBy from "lodash/orderBy";
import reduce from "lodash/reduce";
import toLower from "lodash/toLower";
import trim from "lodash/trim";
import take from "lodash/take";

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

const getSavedMealSortTime = (item) => {
  const value = item?.lastUsedAt || item?.updatedAt || item?.createdAt;
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

const SavedMealSkeleton = () => (
  <div className="flex items-center gap-3 rounded-3xl border bg-card px-3 py-2.5">
    <Skeleton className="size-12 shrink-0 rounded-2xl" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-2/3 rounded" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

const SavedMealsDrawer = ({
  open,
  onOpenChange,
  dateKey,
  mealType,
  onAddMeal,
  onAddMealsBatch,
  disabled = false,
}) => {
  const { items, isLoading } = useSavedMeals();
  const { updateSavedMeal, deleteSavedMeal, isSaving } = useSavedMealsActions();
  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useSavedMealTemplates();
  const [activeTab, setActiveTab] = React.useState("meals");
  const [editingMeal, setEditingMeal] = React.useState(null);
  const [editingTemplateId, setEditingTemplateId] = React.useState(null);
  const [templateName, setTemplateName] = React.useState("");
  const [selectedMealIds, setSelectedMealIds] = React.useState([]);
  const [sortMode, setSortMode] = React.useState("recent");

  const sortedItems = React.useMemo(() => {
    const getName = (item) => toLower(trim(item.name || ""));

    if (sortMode === "alphabet") {
      return orderBy(items, [getName], ["asc"]);
    }

    return orderBy(items, [getSavedMealSortTime, getName], ["desc", "asc"]);
  }, [items, sortMode]);

  const savedMealsById = React.useMemo(() => {
    return reduce(items, (acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [items]);

  const handleQuickLog = React.useCallback(
    async (savedMeal) => {
      if (!onAddMeal || !dateKey || !mealType) return;
      if (disabled) {
        toast.error("Tarmoq yo'q — taom log qilib bo'lmaydi");
        return;
      }

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
    [dateKey, disabled, mealType, onAddMeal],
  );

  const resetTemplateForm = React.useCallback(() => {
    setEditingTemplateId(null);
    setTemplateName("");
    setSelectedMealIds([]);
  }, []);

  const startCreateTemplate = React.useCallback(() => {
    setActiveTab("templates");
    setEditingTemplateId("new");
    setTemplateName("Mening nonushtam");
    setSelectedMealIds(map(take(sortedItems, 3), (item) => item.id));
  }, [sortedItems]);

  const startEditTemplate = React.useCallback((template) => {
    setActiveTab("templates");
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setSelectedMealIds(template.mealIds);
  }, []);

  const toggleTemplateMeal = React.useCallback((savedMealId) => {
    setSelectedMealIds((current) =>
      includes(current, savedMealId)
        ? filter(current, (item) => item !== savedMealId)
        : [...current, savedMealId],
    );
  }, []);

  const handleSaveTemplate = React.useCallback(() => {
    const safeName = trim(templateName);
    const mealIds = filter(selectedMealIds, (id) => savedMealsById[id]);

    if (!safeName) {
      toast.error("Shablon nomini kiriting");
      return;
    }

    if (mealIds.length === 0) {
      toast.error("Kamida bitta taom tanlang");
      return;
    }

    if (editingTemplateId === "new") {
      createTemplate({ name: safeName, mealIds });
      toast.success("Shablon yaratildi");
    } else {
      updateTemplate(editingTemplateId, { name: safeName, mealIds });
      toast.success("Shablon yangilandi");
    }

    resetTemplateForm();
  }, [
    createTemplate,
    editingTemplateId,
    resetTemplateForm,
    savedMealsById,
    selectedMealIds,
    templateName,
    updateTemplate,
  ]);

  const handleApplyTemplate = React.useCallback(
    async (template) => {
      if ((!onAddMeal && !onAddMealsBatch) || !dateKey || !mealType) return;
      if (disabled) {
        toast.error("Tarmoq yo'q — shablon log qilib bo'lmaydi");
        return;
      }

      const mealsToLog = filter(map(template.mealIds, (id) => savedMealsById[id]), Boolean);

      if (mealsToLog.length === 0) {
        toast.error("Shablonda mavjud taom topilmadi");
        return;
      }

      try {
        if (onAddMealsBatch) {
          await onAddMealsBatch(
            dateKey,
            map(mealsToLog, (savedMeal) => ({
              mealType,
              food: buildLoggedMealFromSavedMeal(savedMeal),
            })),
          );
        } else {
          for (const savedMeal of mealsToLog) {
            await onAddMeal(
              dateKey,
              mealType,
              buildLoggedMealFromSavedMeal(savedMeal),
            );
          }
        }
        toast.success(`${template.name} qo'shildi`);
      } catch {
        toast.error("Shablonni log qilib bo'lmadi");
      }
    },
    [dateKey, disabled, mealType, onAddMeal, onAddMealsBatch, savedMealsById],
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
              Taomlarni alohida yoki shablon sifatida tez log qiling.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="p-0">
            <ScrollArea className="h-full px-5 pb-8">
              <div className="sticky top-0 z-10 flex gap-2 bg-background pb-3 pt-1">
                <Button
                  type="button"
                  variant={activeTab === "meals" ? "default" : "outline"}
                  className="h-10 flex-1 rounded-2xl"
                  onClick={() => setActiveTab("meals")}
                >
                  Taomlar
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "templates" ? "default" : "outline"}
                  className="h-10 flex-1 rounded-2xl"
                  onClick={() => setActiveTab("templates")}
                >
                  Shablonlar
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-3 py-2">
                  {map([0, 1, 2], (index) => (
                    <SavedMealSkeleton key={index} />
                  ))}
                </div>
              ) : activeTab === "templates" ? (
                <div className="space-y-3 py-2">
                  {editingTemplateId ? (
                    <div className="space-y-3 rounded-3xl border bg-card p-4">
                      <Input
                        value={templateName}
                        onChange={(event) =>
                          setTemplateName(event.target.value)
                        }
                        placeholder="Shablon nomi"
                        className="rounded-2xl"
                      />

                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {map(sortedItems, (item) => {
                          const isChecked = includes(selectedMealIds, item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleTemplateMeal(item.id)}
                              className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors hover:bg-muted/30"
                            >
                              <Checkbox checked={isChecked} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.calories} kcal · {Math.round(item.grams)} g
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetTemplateForm}
                        >
                          Bekor qilish
                        </Button>
                        <Button type="button" onClick={handleSaveTemplate}>
                          <CheckIcon className="size-4" />
                          Saqlash
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full rounded-2xl border-dashed"
                      onClick={startCreateTemplate}
                    disabled={sortedItems.length === 0}
                    >
                      <PlusIcon className="size-4" />
                      Yangi shablon
                    </Button>
                  )}

                  {!editingTemplateId && templates.length === 0 ? (
                    <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">
                      Hali shablon yo&apos;q. Bir nechta saqlangan taomni
                      bitta guruhga yig'ib qo'ying.
                    </div>
                  ) : null}

                  {!editingTemplateId
                    ? map(templates, (template) => {
                        const templateMeals = filter(map(template.mealIds, (id) => savedMealsById[id]), Boolean);
                        return (
                          <div
                            key={template.id}
                            className="rounded-3xl border bg-card p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                                <LayersIcon className="size-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-bold">
                                  {template.name}
                                </h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {templateMeals.length} ta taom ·{" "}
                                  {reduce(templateMeals, (sum, item) => sum + item.calories, 0)}{" "}
                                  kcal
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  className="rounded-full text-muted-foreground"
                                  onClick={() => startEditTemplate(template)}
                                  aria-label="Shablonni tahrirlash"
                                >
                                  <PencilIcon className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-xs"
                                  className="rounded-full"
                                  disabled={disabled}
                                  onClick={() => void handleApplyTemplate(template)}
                                  aria-label="Shablonni log qilish"
                                >
                                  <ZapIcon className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  className="rounded-full text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteTemplate(template.id)}
                                  aria-label="Shablonni o'chirish"
                                >
                                  <Trash2Icon className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            {templateMeals.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {map(take(templateMeals, 4), (item) => (
                                  <span
                                    key={item.id}
                                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                                  >
                                    {item.name}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    : null}
                </div>
              ) : sortedItems.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed bg-muted/15 px-6 text-center text-sm text-muted-foreground">
                  Hali saqlangan taom yo&apos;q. AI orqali ovqat
                  qo&apos;shayotganda uni saqlab qo&apos;yishingiz mumkin.
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2 pb-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={sortMode === "recent" ? "default" : "outline"}
                      className="h-9 rounded-2xl px-3 text-xs"
                      onClick={() => setSortMode("recent")}
                    >
                      <Clock3Icon className="size-3.5" />
                      So'nggi
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={sortMode === "alphabet" ? "default" : "outline"}
                      className="h-9 rounded-2xl px-3 text-xs"
                      onClick={() => setSortMode("alphabet")}
                    >
                      <ArrowDownAZIcon className="size-3.5" />
                      Alifbo
                    </Button>
                  </div>

                  {map(sortedItems, (item) => (
                    <div
                      key={item.id}
                      onClick={() => setEditingMeal(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setEditingMeal(item);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.name} taomini tahrirlash`}
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
                            disabled={disabled}
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
