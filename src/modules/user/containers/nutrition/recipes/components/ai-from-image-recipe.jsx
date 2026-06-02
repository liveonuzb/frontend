import React from "react";
import {
  InfoIcon,
  LightbulbIcon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import map from "lodash/map";
import size from "lodash/size";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import NutritionSummary from "./nutrition-summary.jsx";
import RecipeImage from "./recipe-image.jsx";
import {
  AI_SUGGESTED_RECIPE,
  INITIAL_DETECTED_INGREDIENTS,
  SAMPLE_THUMBNAILS,
  getRecipeNutrition,
} from "../recipe-mock-data.js";

const TipItem = ({ icon: Icon, title, description }) => (
  <div className="flex gap-3">
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
      <Icon className="size-5" />
    </span>
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const AIFromImageRecipe = ({ onCreateRecipe, onAddToMealPlan }) => {
  const inputRef = React.useRef(null);
  const objectUrlRef = React.useRef("");
  const [selectedImage, setSelectedImage] = React.useState(SAMPLE_THUMBNAILS[0]);
  const [detectedIngredients, setDetectedIngredients] = React.useState(
    INITIAL_DETECTED_INGREDIENTS,
  );
  const [newIngredient, setNewIngredient] = React.useState("");
  const nutrition = getRecipeNutrition(AI_SUGGESTED_RECIPE, 1);

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleImagePick = React.useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file || typeof URL === "undefined") {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextUrl;
    setSelectedImage(nextUrl);
    toast.success("Rasm yuklandi, ingredientlar aniqlanmoqda");
    event.target.value = "";
  }, []);

  const handleRemoveIngredient = React.useCallback((ingredientId) => {
    setDetectedIngredients((current) =>
      current.filter((ingredient) => ingredient.id !== ingredientId),
    );
  }, []);

  const handleAddIngredient = React.useCallback(() => {
    const trimmed = newIngredient.trim();
    if (!trimmed) {
      return;
    }

    setDetectedIngredients((current) => [
      ...current,
      {
        id: `manual-${trimmed}-${Date.now()}`,
        name: trimmed,
        confidence: 100,
      },
    ]);
    setNewIngredient("");
  }, [newIngredient]);

  const handleGenerateAnother = React.useCallback(() => {
    toast.success("Yangi AI tavsiya yaratildi");
  }, []);

  const handleGenerateFromIngredients = React.useCallback(() => {
    toast.success("Ingredientlarga mos retsept yaratildi");
  }, []);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingredient rasmini yuklang</CardTitle>
            <p className="text-sm text-muted-foreground">
              Retsept olish uchun ingredientlaringizni suratga oling yoki yuklang
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <button
              type="button"
              className="relative flex min-h-44 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => inputRef.current?.click()}
            >
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Ingredient rasmi"
                    className="absolute inset-0 size-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute inset-0 bg-black/35" />
                </>
              ) : null}
              <span className="relative grid size-12 place-items-center rounded-full bg-background text-primary">
                <UploadCloudIcon className="size-6" />
              </span>
              <span className="relative text-sm font-medium text-white drop-shadow-sm">
                Rasmni shu yerga torting yoki tanlang
              </span>
              <span className="relative text-xs text-white/90 drop-shadow-sm">
                JPG, PNG, HEIC formatlari · Maks. 10MB
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              aria-label="Ingredient rasmi yuklash"
              className="hidden"
              onChange={handleImagePick}
            />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Yoki namunaviy rasmlardan foydalaning
              </p>
              <div className="grid grid-cols-5 gap-2">
                {map(SAMPLE_THUMBNAILS, (thumbnail) => (
                  <button
                    key={thumbnail}
                    type="button"
                    className={`aspect-square overflow-hidden rounded-xl border bg-muted ${
                      selectedImage === thumbnail ? "border-primary" : "border-border"
                    }`}
                    aria-label="Ingredient namunasi tanlash"
                    onClick={() => {
                      setSelectedImage(thumbnail);
                      toast.success("Namuna rasmi tanlandi");
                    }}
                  >
                    <img
                      src={thumbnail}
                      alt="Ingredient namunasi"
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Aniqlangan ingredientlar</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI ingredientlarni aniqladi. Keraksizlarini olib tashlang yoki qo'shing.
              </p>
            </div>
            <Badge variant="secondary">{size(detectedIngredients)} ta</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {map(detectedIngredients, (ingredient) => (
                <div
                  key={ingredient.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-background px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {ingredient.name}
                    </span>
                    <span className="text-xs text-primary">
                      {ingredient.confidence}%
                      {ingredient.confidence < 88 ? " · tekshiring" : ""}
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${ingredient.name} olib tashlash`}
                    onClick={() => handleRemoveIngredient(ingredient.id)}
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                aria-label="Ingredient qo'shish"
                placeholder="Ingredient qo'shish"
                value={newIngredient}
                onChange={(event) => setNewIngredient(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddIngredient}
              >
                <PlusIcon data-icon="inline-start" />
                Ingredient qo'shish
              </Button>
            </div>
            <Button type="button" onClick={handleGenerateFromIngredients}>
              <SparklesIcon data-icon="inline-start" />
              Shu ingredientlardan recipe chiqarish
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <Badge variant="secondary" className="gap-1">
            <SparklesIcon className="size-3" />
            AI tavsiya
          </Badge>
          <Button type="button" variant="outline" size="sm" onClick={handleGenerateAnother}>
            <RefreshCwIcon data-icon="inline-start" />
            Boshqasini yaratish
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="aspect-[16/9] overflow-hidden rounded-xl bg-muted">
            <RecipeImage recipe={AI_SUGGESTED_RECIPE} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-foreground">
              {AI_SUGGESTED_RECIPE.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {AI_SUGGESTED_RECIPE.description}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Badge variant="outline">{AI_SUGGESTED_RECIPE.totalTimeMinutes} daqiqa</Badge>
            <Badge variant="outline">{AI_SUGGESTED_RECIPE.difficulty}</Badge>
            <Badge variant="outline">{AI_SUGGESTED_RECIPE.caloriesPerServing} kkal</Badge>
            <Badge variant="outline">{AI_SUGGESTED_RECIPE.servings} porsiya</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Asosiy ingredientlar
            </h3>
            {map(AI_SUGGESTED_RECIPE.ingredients, (ingredient) => (
              <div
                key={ingredient.id}
                className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0"
              >
                <span>{ingredient.name}</span>
                <span className="text-muted-foreground">
                  {ingredient.quantity} {ingredient.unit}
                </span>
              </div>
            ))}
          </div>
          <NutritionSummary nutrition={nutrition} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => onCreateRecipe?.(AI_SUGGESTED_RECIPE)}>
              Tahrirlash
            </Button>
            <Button type="button" onClick={() => onCreateRecipe?.(AI_SUGGESTED_RECIPE)}>
              <PlusIcon data-icon="inline-start" />
              Retsept yaratish
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={() => onAddToMealPlan?.(AI_SUGGESTED_RECIPE)}>
            Meal plan ga qo'shish
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Yaxshi natija uchun</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <TipItem
              icon={LightbulbIcon}
              title="Yaxshi yoritish"
              description="Tabiiy yorug'likda yoki yaxshi yoritilgan joyda suratga oling."
            />
            <TipItem
              icon={ShieldCheckIcon}
              title="Aniq va yaqin"
              description="Ingredientlar ravshan va yaqin ko'rinadigan bo'lsin."
            />
            <TipItem
              icon={InfoIcon}
              title="Fon soddaligi"
              description="Sodda fon ingredientlarni aniqlash aniqligini oshiradi."
            />
            <TipItem
              icon={SparklesIcon}
              title="Har xil ingredientlar"
              description="Bir nechta turdagi ingredientlarni bitta rasmda joylashtiring."
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            <h3 className="text-base font-semibold text-foreground">AI haqida</h3>
            <p className="text-sm text-muted-foreground">
              Natijani tekshiring va o'zingizga moslab tahrirlang.
            </p>
            <Button type="button" variant="link" className="h-auto justify-start px-0">
              Ko'proq ma'lumot
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex gap-3 p-5">
            <LockIcon className="mt-0.5 size-4 text-primary" />
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-foreground">
                Maxfiylik kafolati
              </h3>
              <p className="text-sm text-muted-foreground">
                Yuklagan rasmlaringiz faqat retsept yaratish uchun ishlatiladi va saqlanmaydi.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIFromImageRecipe;
