import React from "react";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import {
  CameraIcon,
  PackageIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner.jsx";
import { useNutritionAiPantry } from "@/hooks/app/use-nutrition-ai.js";
import NutritionCard from "./ui/nutrition-card.jsx";

const formatDelta = (value) => {
  const amount = toNumber(value);
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${amount.toLocaleString("uz-UZ")} UZS`;
};

const CardList = ({ cards = [] }) => (
  <div className="grid gap-2">
    {map(cards, (card) => (
      <div
        key={card.type}
        className="rounded-xl border border-border/60 bg-background/70 p-3"
      >
        <p className="text-xs font-black uppercase text-muted-foreground">
          {card.title || card.type}
        </p>
        <div className="mt-2 grid gap-1.5">
          {map(card.items, (item, index) => (
            <p
              key={`${card.type}-${item.ingredientId || item.stepNumber || index}`}
              className="text-sm font-semibold text-foreground"
            >
              {item.name || item.body || item.title || `#${index + 1}`}
            </p>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function NutritionAiAssistantPanel({ currentPlan = null }) {
  const {
    pantryItems,
    createPantryItem,
    deletePantryItem,
    scanPantryImage,
    getRecipeAssistant,
    getSubstitutions,
    isLoading,
    isCreatingPantryItem,
    isDeletingPantryItem,
    isScanningPantry,
    isRecipeAssistantPending,
    isSubstitutionPending,
  } = useNutritionAiPantry();
  const [pantryName, setPantryName] = React.useState("");
  const [pantryQuantity, setPantryQuantity] = React.useState("1");
  const [pantryUnit, setPantryUnit] = React.useState("dona");
  const [scanSuggestions, setScanSuggestions] = React.useState([]);
  const [recipeFoodId, setRecipeFoodId] = React.useState("");
  const [recipeResult, setRecipeResult] = React.useState(null);
  const [substitutionIngredientId, setSubstitutionIngredientId] =
    React.useState("");
  const [substitutionGrams, setSubstitutionGrams] = React.useState("100");
  const [substitutionResult, setSubstitutionResult] = React.useState(null);

  const handleCreatePantryItem = async (event) => {
    event.preventDefault();
    const name = trim(pantryName);
    if (!name) return;

    await createPantryItem({
      name,
      quantity: toNumber(pantryQuantity) || 1,
      unit: trim(pantryUnit) || "dona",
    });
    setPantryName("");
    setPantryQuantity("1");
  };

  const handleScanFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await scanPantryImage(file);
    setScanSuggestions(result.suggestions || []);
    event.target.value = "";
  };

  const handleConfirmSuggestion = async (suggestion) => {
    await createPantryItem({
      ingredientId: suggestion.ingredientId || undefined,
      name: suggestion.name,
      quantity: 1,
      unit: "dona",
    });
    setScanSuggestions((items) =>
      items.filter((item) => item.name !== suggestion.name),
    );
  };

  const handleRecipeAssistant = async (event) => {
    event.preventDefault();
    const foodId = toNumber(recipeFoodId);
    if (!foodId) return;
    setRecipeResult(await getRecipeAssistant({ foodId }));
  };

  const handleSubstitutions = async (event) => {
    event.preventDefault();
    const ingredientId = toNumber(substitutionIngredientId);
    if (!ingredientId) return;
    setSubstitutionResult(
      await getSubstitutions({
        ingredientId,
        grams: toNumber(substitutionGrams) || 100,
      }),
    );
  };

  return (
    <NutritionCard className="p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <PackageIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black">Ombor</p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {currentPlan?.name || "AI yordamchi"}
                </p>
              </div>
            </div>
          </div>
          <Badge variant="secondary">Draft-only</Badge>
        </div>

        <form
          className="grid gap-2 sm:grid-cols-[1fr_96px_96px_auto]"
          onSubmit={handleCreatePantryItem}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="nutrition-ai-pantry-name">Nomi</Label>
            <Input
              id="nutrition-ai-pantry-name"
              value={pantryName}
              onChange={(event) => setPantryName(event.target.value)}
              placeholder="Guruch"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nutrition-ai-pantry-quantity">Miqdor</Label>
            <Input
              id="nutrition-ai-pantry-quantity"
              inputMode="decimal"
              value={pantryQuantity}
              onChange={(event) => setPantryQuantity(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="nutrition-ai-pantry-unit">Birlik</Label>
            <Input
              id="nutrition-ai-pantry-unit"
              value={pantryUnit}
              onChange={(event) => setPantryUnit(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="self-end"
            disabled={isCreatingPantryItem || !trim(pantryName)}
          >
            <PlusIcon data-icon="inline-start" />
            Qo'shish
          </Button>
        </form>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/25 px-3 py-3 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary">
            {isScanningPantry ? (
              <Spinner className="size-4" />
            ) : (
              <CameraIcon className="size-4" />
            )}
            Rasm scan
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp"
              disabled={isScanningPantry}
              onChange={handleScanFileChange}
            />
          </label>
          <div className="rounded-xl border border-border/60 bg-background/65 px-3 py-3 text-sm font-semibold text-muted-foreground">
            {isLoading
              ? "Yuklanmoqda..."
              : `${pantryItems.length} ta mahsulot omborda`}
          </div>
        </div>

        {scanSuggestions.length > 0 ? (
          <div className="grid gap-2">
            {map(scanSuggestions, (suggestion) => (
              <div
                key={`${suggestion.name}-${suggestion.ingredientId || "new"}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{suggestion.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {Math.round(toNumber(suggestion.confidence) * 100)}% ·{" "}
                    {suggestion.needsReview ? "tekshiruv" : "mos keldi"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleConfirmSuggestion(suggestion)}
                >
                  Tasdiqlash
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {pantryItems.length > 0 ? (
          <div className="grid gap-2">
            {map(pantryItems, (item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 rounded-full text-destructive hover:text-destructive"
                  disabled={isDeletingPantryItem}
                  aria-label={`${item.name}ni o'chirish`}
                  onClick={() => deletePantryItem(item.id)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 lg:grid-cols-2">
          <form
            className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3"
            onSubmit={handleRecipeAssistant}
          >
            <Label htmlFor="nutrition-ai-recipe-food">Recipe assistant</Label>
            <div className="flex gap-2">
              <Input
                id="nutrition-ai-recipe-food"
                inputMode="numeric"
                value={recipeFoodId}
                onChange={(event) => setRecipeFoodId(event.target.value)}
                placeholder="Food ID"
              />
              <Button
                type="submit"
                disabled={isRecipeAssistantPending || !toNumber(recipeFoodId)}
              >
                <SparklesIcon data-icon="inline-start" />
                AI
              </Button>
            </div>
            {recipeResult?.cards?.length ? (
              <CardList cards={recipeResult.cards} />
            ) : null}
          </form>

          <form
            className="grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3"
            onSubmit={handleSubstitutions}
          >
            <Label htmlFor="nutrition-ai-substitution-ingredient">
              UZS substitution
            </Label>
            <div className="grid gap-2 sm:grid-cols-[1fr_92px_auto]">
              <Input
                id="nutrition-ai-substitution-ingredient"
                inputMode="numeric"
                value={substitutionIngredientId}
                onChange={(event) =>
                  setSubstitutionIngredientId(event.target.value)
                }
                placeholder="Ingredient ID"
              />
              <Input
                aria-label="Substitution grams"
                inputMode="decimal"
                value={substitutionGrams}
                onChange={(event) => setSubstitutionGrams(event.target.value)}
              />
              <Button
                type="submit"
                disabled={
                  isSubstitutionPending || !toNumber(substitutionIngredientId)
                }
              >
                <WandSparklesIcon data-icon="inline-start" />
                Topish
              </Button>
            </div>
            {substitutionResult?.substitutions?.length ? (
              <div className="grid gap-2">
                {map(substitutionResult.substitutions, (item) => (
                  <div
                    key={item.replacementIngredientId}
                    className="rounded-xl border border-border/60 bg-background/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold">{item.replacementName}</p>
                      <Badge
                        variant={toNumber(item.deltaUzS) <= 0 ? "secondary" : "outline"}
                      >
                        {formatDelta(item.deltaUzS)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      kcal {toNumber(item.macroDelta?.calories)} · oqsil{" "}
                      {toNumber(item.macroDelta?.protein)}g
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.safety?.reason || "Safety checked"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </NutritionCard>
  );
}
