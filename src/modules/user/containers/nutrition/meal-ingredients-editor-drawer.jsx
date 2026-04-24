import React from "react";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import IngredientEditDrawer from "./ingredient-edit-drawer.jsx";
import {
  addMealIngredient,
  formatIngredientHint,
  getMealIngredientTotals,
  getMealIngredientsGrams,
  normalizeMealIngredients,
  removeMealIngredient,
  toNumber,
  updateMealIngredient,
} from "./meal-ingredients.js";

const MacroSummary = ({ totals, grams }) => (
  <div className="rounded-3xl border bg-card p-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Jami
        </p>
        <div className="mt-0.5 text-2xl font-black tabular-nums">
          {totals.calories}
          <span className="ml-1 text-xs font-semibold text-muted-foreground">
            kcal
          </span>
        </div>
      </div>
      <div className="rounded-full border bg-background px-3 py-1 text-sm font-bold tabular-nums">
        {Math.round(grams)} g
      </div>
    </div>

    <div className="mt-3 grid grid-cols-3 gap-1.5">
      <div className="rounded-2xl bg-muted/40 px-2.5 py-2">
        <div className="text-[10px] text-muted-foreground">Oqsil</div>
        <div className="mt-0.5 text-sm font-black">{totals.protein} g</div>
      </div>
      <div className="rounded-2xl bg-muted/40 px-2.5 py-2">
        <div className="text-[10px] text-muted-foreground">Uglevod</div>
        <div className="mt-0.5 text-sm font-black">{totals.carbs} g</div>
      </div>
      <div className="rounded-2xl bg-muted/40 px-2.5 py-2">
        <div className="text-[10px] text-muted-foreground">Yog'</div>
        <div className="mt-0.5 text-sm font-black">{totals.fat} g</div>
      </div>
    </div>
  </div>
);

const IngredientRow = ({ ingredient, onEdit, onDelete }) => {
  const hint = React.useMemo(
    () => formatIngredientHint(ingredient),
    [ingredient],
  );

  return (
    <div className="rounded-2xl border bg-background/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{ingredient.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {Math.round(toNumber(ingredient.grams, 0))} g
            </span>
            {hint ? <span>{hint}</span> : null}
            {ingredient.matchStatus === "unmatched" ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                Tekshirish
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-xs"
            onClick={onEdit}
          >
            <PencilIcon className="size-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-full text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`${ingredient.name} ingredientini o'chirish`}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const MealIngredientsEditorDrawer = ({
  open,
  onOpenChange,
  title,
  description = "Ingredientlar va porsiyalarni tahrirlang.",
  imageUrl = null,
  initialIngredients = [],
  onSave,
  isSaving = false,
}) => {
  const [ingredients, setIngredients] = React.useState(() =>
    normalizeMealIngredients(initialIngredients),
  );
  const [ingredientEditor, setIngredientEditor] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setIngredients(normalizeMealIngredients(initialIngredients));
      setIngredientEditor(null);
    }
  }, [initialIngredients, open]);

  const normalizedIngredients = React.useMemo(
    () => normalizeMealIngredients(ingredients),
    [ingredients],
  );
  const totals = React.useMemo(
    () => getMealIngredientTotals(normalizedIngredients),
    [normalizedIngredients],
  );
  const totalGrams = React.useMemo(
    () => getMealIngredientsGrams(normalizedIngredients),
    [normalizedIngredients],
  );

  const handleSave = React.useCallback(() => {
    onSave?.(normalizedIngredients, totals);
  }, [normalizedIngredients, onSave, totals]);

  const handleSaveIngredient = React.useCallback(
    (ingredient) => {
      setIngredients((current) =>
        ingredientEditor?.mode === "add"
          ? addMealIngredient(current, ingredient)
          : updateMealIngredient(current, ingredient.id, ingredient),
      );
    },
    [ingredientEditor?.mode],
  );

  const handleDeleteIngredient = React.useCallback((ingredientId) => {
    setIngredients((current) => removeMealIngredient(current, ingredientId));
  }, []);

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <NutritionDrawerContent size="sm">
          <DrawerHeader className="border-b border-border/40">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            {imageUrl ? (
              <div
                className="overflow-hidden rounded-2xl bg-muted"
                style={{ aspectRatio: "16/9" }}
              >
                <img loading="lazy"
                  src={imageUrl}
                  alt={title}
                  className="h-full max-h-40 w-full object-cover"
                />
              </div>
            ) : null}

            <MacroSummary totals={totals} grams={totalGrams} />

            <div className="rounded-2xl border border-border/50 bg-muted/10 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <div>
                  <p className="text-sm font-semibold">Ingredientlar</p>
                  <p className="text-[11px] text-muted-foreground">
                    Har bir ingredient alohida drawerda tahrirlanadi.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 rounded-full px-3 text-xs"
                  onClick={() =>
                    setIngredientEditor({ mode: "add", ingredient: null })
                  }
                >
                  <PlusIcon className="size-3.5" />
                  Qo'shish
                </Button>
              </div>

              {normalizedIngredients.length ? (
                <div className="space-y-2">
                  {normalizedIngredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      onEdit={() =>
                        setIngredientEditor({ mode: "edit", ingredient })
                      }
                      onDelete={() => handleDeleteIngredient(ingredient.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  Ingredient yo'q. Qo'shish tugmasi orqali kiriting.
                </div>
              )}
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              onClick={handleSave}
              disabled={isSaving || !normalizedIngredients.length}
            >
              {isSaving ? "Saqlanmoqda" : "Saqlash"}
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>

      <IngredientEditDrawer
        open={Boolean(ingredientEditor)}
        mode={ingredientEditor?.mode || "edit"}
        ingredient={ingredientEditor?.ingredient}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIngredientEditor(null);
          }
        }}
        onSave={handleSaveIngredient}
      />
    </>
  );
};

export default MealIngredientsEditorDrawer;
