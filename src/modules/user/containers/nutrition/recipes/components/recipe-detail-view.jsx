import React from "react";
import {
  AppleIcon,
  BookOpenIcon,
  BookmarkIcon,
  CalendarPlusIcon,
  CheckIcon,
  ChefHatIcon,
  ClockIcon,
  EditIcon,
  HeartIcon,
  InfoIcon,
  ListChecksIcon,
  MinusIcon,
  MoreVerticalIcon,
  PlusIcon,
  Share2Icon,
} from "lucide-react";
import find from "lodash/find";
import map from "lodash/map";
import slice from "lodash/slice";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils.js";
import CreateRecipeShoppingListButton from "./create-recipe-shopping-list-button.jsx";
import NutritionSummary from "./nutrition-summary.jsx";
import RecipeImage from "./recipe-image.jsx";
import {
  formatQuantity,
  getRecipeNutrition,
} from "../recipe-ui-utils.js";

const TimeSummaryItem = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3">
    <Icon className="size-4 text-primary" />
    <div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

const getMetaValue = (value, fallback = "Ko'rsatilmagan") => {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : fallback;
  }

  return value || fallback;
};

const RecipeMetaGrid = ({ recipe }) => {
  const metaItems = [
    {
      label: "Kategoriya",
      value: getMetaValue(recipe.category || recipe.categoryLabels),
    },
    {
      label: "Oshxona",
      value: getMetaValue(recipe.cuisineLabels),
    },
    {
      label: "Qiyinchilik",
      value: getMetaValue(recipe.difficulty),
    },
    {
      label: "Allergenlar",
      value: getMetaValue(recipe.allergens, "Belgilanmagan"),
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {map(metaItems, (item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-background p-3 text-sm"
        >
          <div className="font-semibold text-foreground">{item.label}</div>
          <div className="mt-1 text-muted-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

const IngredientsChecklist = ({
  recipe,
  servings,
  isUpdating,
  onServingsChange,
  onCreateShoppingList,
}) => {
  const [checkedMap, setCheckedMap] = React.useState({});

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Masalliqlar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Porsiyani kamaytirish"
            disabled={servings <= 1}
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
          >
            <MinusIcon />
          </Button>
          <span className="min-w-16 text-center text-sm font-semibold">
            {servings} porsiya
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="Porsiyani oshirish"
            onClick={() => onServingsChange(servings + 1)}
          >
            <PlusIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {map(recipe.ingredients, (ingredient) => {
          const checked = Boolean(checkedMap[ingredient.id]);

          return (
            <label
              key={ingredient.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Checkbox
                  checked={checked}
                  aria-label={`${ingredient.name} tayyor`}
                  onCheckedChange={(value) =>
                    setCheckedMap((current) => ({
                      ...current,
                      [ingredient.id]: Boolean(value),
                    }))
                  }
                />
                <span
                  className={cn(
                    "truncate text-foreground",
                    checked && "text-muted-foreground line-through",
                  )}
                >
                  {ingredient.name}
                </span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatQuantity(
                  ingredient.displayAmount ?? ingredient.quantity,
                  ingredient.displayUnit ?? ingredient.unit,
                  servings,
                )}
              </span>
            </label>
          );
        })}
        {onCreateShoppingList ? (
          <CreateRecipeShoppingListButton
            className="mt-3"
            isUpdating={isUpdating}
            onClick={onCreateShoppingList}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

const InstructionsTimeline = ({ steps }) => (
  <Card>
    <CardHeader>
      <CardTitle>Tayyorlash bosqichlari</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {map(steps, (step, index) => (
        <div key={step.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
          <div className="flex flex-col items-center">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span className="mt-2 h-full min-h-8 w-px bg-border" />
            ) : null}
          </div>
          <div className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              {step.durationMinutes ? (
                <Badge variant="outline">{step.durationMinutes} daq</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {step.description || step.body}
            </p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

const NutritionComposition = ({ nutrition }) => (
  <Card>
    <CardHeader className="flex-row items-center justify-between">
      <CardTitle>Oziqaviy tarkibi</CardTitle>
      <span className="text-sm text-muted-foreground">1 porsiya uchun</span>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div className="grid aspect-square place-items-center rounded-full border border-border bg-muted">
          <div className="text-center">
            <div className="text-3xl font-semibold text-foreground">
              {nutrition.calories}
            </div>
            <div className="text-sm text-muted-foreground">kkal</div>
          </div>
        </div>
        <NutritionSummary
          nutrition={nutrition}
          className="grid-cols-1 sm:grid-cols-3"
        />
      </div>
      <Separator />
      <div className="flex flex-col text-sm">
        <div className="flex justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Tolalar</span>
          <span className="font-medium">{nutrition.fiber} g</span>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Shakar</span>
          <span className="font-medium">{nutrition.sugar} g</span>
        </div>
        <div className="flex justify-between border-b border-border py-2">
          <span className="text-muted-foreground">Natriy</span>
          <span className="font-medium">{nutrition.sodium} mg</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-muted-foreground">Xolesterin</span>
          <span className="font-medium">45 mg</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const RelatedRecipes = () => (
  <Card>
    <CardHeader>
      <CardTitle>O'xshash retseptlar</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">
          Hozircha o'xshash retseptlar mavjud emas.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Retseptlar katalogidan boshqa variantlarni ko'rishingiz mumkin.
        </p>
      </div>
      <Button type="button" variant="outline" asChild>
        <Link to="/user/nutrition/recipes">Retseptlarga qaytish</Link>
      </Button>
    </CardContent>
  </Card>
);

const detailSections = [
  {
    value: "ingredients",
    title: "Masalliqlar",
    description: "Porsiya bo'yicha miqdorlar va checklist",
    icon: ListChecksIcon,
  },
  {
    value: "steps",
    title: "Qadamlar",
    description: "Tayyorlash bosqichlarini ko'rish",
    icon: BookOpenIcon,
  },
  {
    value: "nutrition",
    title: "Nutrition",
    description: "Kaloriya, makro va qo'shimcha tarkib",
    icon: AppleIcon,
  },
  {
    value: "more",
    title: "Maslahatlar",
    description: "O'xshash retseptlar va ulashish",
    icon: InfoIcon,
  },
];

const DetailSectionButton = ({ section, meta, onClick }) => {
  const Icon = section.icon;

  return (
    <button
      type="button"
      className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {section.title}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {section.description}
          </span>
        </span>
      </span>
      {meta ? <Badge variant="secondary">{meta}</Badge> : null}
    </button>
  );
};

const DetailSectionDrawer = ({
  open,
  section,
  recipe,
  servings,
  steps,
  nutrition,
  onOpenChange,
  onServingsChange,
  onCreateShoppingList,
  isUpdating,
}) => {
  const activeSection = find(detailSections, (item) => item.value === section);

  if (!activeSection) {
    return null;
  }

  return (
    <Drawer nested open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88vh] data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
        <DrawerHeader className="border-b border-border/40">
          <DrawerTitle>{activeSection.title}</DrawerTitle>
          <DrawerDescription>{activeSection.description}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-5">
          {section === "ingredients" ? (
            <IngredientsChecklist
              recipe={recipe}
              servings={servings}
              isUpdating={isUpdating}
              onServingsChange={onServingsChange}
              onCreateShoppingList={onCreateShoppingList}
            />
          ) : null}
          {section === "steps" ? <InstructionsTimeline steps={steps} /> : null}
          {section === "nutrition" ? (
            <NutritionComposition nutrition={nutrition} />
          ) : null}
          {section === "more" ? (
            <div className="flex flex-col gap-4">
              <RelatedRecipes />
              <Card>
                <CardContent className="flex flex-col gap-2 p-5">
                  <h2 className="text-base font-semibold text-foreground">
                    Foydali maslahat
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Quinoani tayyorlashdan oldin uni yaxshilab yuvish yengil va
                    mazali bo'lishiga yordam beradi.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-3 p-5">
                  <h2 className="text-base font-semibold text-foreground">
                    Ushbu retseptni yoqtirdingizmi?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Do'stlaringiz bilan bo'lishing va ularni ilhomlantiring.
                  </p>
                  <Button type="button" variant="outline">
                    <Share2Icon data-icon="inline-start" />
                    Ulashish
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

const RecipeDetailView = ({
  recipe,
  servings,
  isFavorite,
  isUpdating,
  onServingsChange,
  onFavorite,
  onSave,
  onAddToMealPlan,
  onCreateShoppingList,
  onEdit,
  onStartCooking,
  variant = "page",
}) => {
  const [sectionDrawer, setSectionDrawer] = React.useState("");
  const nutrition = getRecipeNutrition(recipe, servings);
  const steps = recipe.steps || recipe.instructions || [];
  const isDrawer = variant === "drawer";
  const sectionMeta = {
    ingredients: `${recipe.ingredients?.length || 0} ta`,
    steps: `${steps.length} qadam`,
    nutrition: `${nutrition.calories} kkal`,
    more: "Ko'rish",
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="grid gap-5 p-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              <RecipeImage recipe={recipe} />
              <Badge variant="secondary" className="absolute left-3 top-3">
                {recipe.totalTimeMinutes} daq
              </Badge>
              <Button
                type="button"
                variant={isFavorite ? "default" : "outline"}
                size="icon-sm"
                aria-label={
                  isFavorite
                    ? "Sevimlilardan olib tashlash"
                    : "Sevimlilarga qo'shish"
                }
                aria-pressed={Boolean(isFavorite)}
                className="absolute right-3 top-3 bg-background/90"
                disabled={isUpdating}
                onClick={onFavorite}
              >
                <HeartIcon
                  className={cn("size-4", isFavorite && "fill-current")}
                />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-primary bg-muted">
                <RecipeImage recipe={recipe} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {map(slice(recipe.tags, 0, 4), (tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div>
              <Badge variant="outline" className="mb-2">
                RETSEPT
              </Badge>
              <h1
                className={cn(
                  "font-semibold text-foreground",
                  isDrawer ? "text-2xl md:text-3xl" : "text-3xl",
                )}
              >
                {recipe.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {recipe.description}
              </p>
            </div>
            <NutritionSummary nutrition={nutrition} />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <TimeSummaryItem
                icon={ClockIcon}
                value={`${recipe.prepTimeMinutes} daqiqa`}
                label="Tayyorlash vaqti"
              />
              <TimeSummaryItem
                icon={ClockIcon}
                value={`${recipe.cookTimeMinutes} daqiqa`}
                label="Pishirish vaqti"
              />
              <TimeSummaryItem
                icon={ClockIcon}
                value={`${recipe.totalTimeMinutes} daqiqa`}
                label="Jami vaqt"
              />
              <TimeSummaryItem
                icon={CheckIcon}
                value={`${servings} porsiya`}
                label="Porsiya"
              />
            </div>
            <RecipeMetaGrid recipe={recipe} />
          </div>
        </CardContent>
      </Card>

      {isDrawer ? (
        <div className="grid gap-2">
          {map(detailSections, (section) => (
            <DetailSectionButton
              key={section.value}
              section={section}
              meta={sectionMeta[section.value]}
              onClick={() => setSectionDrawer(section.value)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <IngredientsChecklist
              recipe={recipe}
              servings={servings}
              isUpdating={isUpdating}
              onServingsChange={onServingsChange}
              onCreateShoppingList={onCreateShoppingList}
            />
            <div className="flex flex-col gap-5">
              <InstructionsTimeline steps={steps} />
              <NutritionComposition nutrition={nutrition} />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <RelatedRecipes />
            <Card>
              <CardContent className="flex flex-col gap-2 p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Foydali maslahat
                </h2>
                <p className="text-sm text-muted-foreground">
                  Quinoani tayyorlashdan oldin uni yaxshilab yuvish yengil va
                  mazali bo'lishiga yordam beradi.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Ushbu retseptni yoqtirdingizmi?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Do'stlaringiz bilan bo'lishing va ularni ilhomlantiring.
                </p>
                <Button type="button" variant="outline">
                  <Share2Icon data-icon="inline-start" />
                  Ulashish
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Card className="sticky bottom-3 z-10 bg-card/95 backdrop-blur">
        <CardFooter className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_auto]">
          <Button
            type="button"
            className="col-span-2 sm:col-span-1"
            onClick={onStartCooking}
            disabled={!steps.length}
          >
            <ChefHatIcon data-icon="inline-start" />
            Pishirishni boshlash
          </Button>
          <Button type="button" onClick={onAddToMealPlan}>
            <CalendarPlusIcon data-icon="inline-start" />
            Qo'shish
          </Button>
          {onCreateShoppingList ? (
            <CreateRecipeShoppingListButton
              className="col-span-2 h-10 sm:col-span-1"
              isUpdating={isUpdating}
              onClick={onCreateShoppingList}
            >
              Xarid ro'yxati
            </CreateRecipeShoppingListButton>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={isUpdating}
            onClick={onSave}
          >
            <BookmarkIcon data-icon="inline-start" />
            Saqlash
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            <EditIcon data-icon="inline-start" />
            Tahrirlash
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Ko'proq"
          >
            <MoreVerticalIcon />
          </Button>
        </CardFooter>
      </Card>

      <DetailSectionDrawer
        open={Boolean(sectionDrawer)}
        section={sectionDrawer}
        recipe={recipe}
        servings={servings}
        steps={steps}
        nutrition={nutrition}
        onOpenChange={(nextOpen) => !nextOpen && setSectionDrawer("")}
        onServingsChange={onServingsChange}
        onCreateShoppingList={onCreateShoppingList}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default RecipeDetailView;
