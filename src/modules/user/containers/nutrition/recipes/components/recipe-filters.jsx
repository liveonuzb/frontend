import React from "react";
import {
  HeartIcon,
  ListFilterIcon,
  PackageCheckIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import filter from "lodash/filter";
import map from "lodash/map";
import size from "lodash/size";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const sortOptions = [
  { value: "newest", labelKey: "filters.sortOptions.newest" },
  { value: "popular", labelKey: "filters.sortOptions.popular" },
  { value: "highestRated", labelKey: "filters.sortOptions.highestRated" },
  { value: "highestProtein", labelKey: "filters.sortOptions.highestProtein" },
  { value: "lowestCalories", labelKey: "filters.sortOptions.lowestCalories" },
  { value: "fastest", labelKey: "filters.sortOptions.fastest" },
  { value: "featured", labelKey: "filters.sortOptions.featured" },
];

const difficultyOptions = [
  { value: "easy", labelKey: "filters.difficultyOptions.easy" },
  { value: "medium", labelKey: "filters.difficultyOptions.medium" },
  { value: "hard", labelKey: "filters.difficultyOptions.hard" },
];

const emptyDraft = {
  sort: "newest",
  categoryId: "",
  cuisineId: "",
  dietaryTag: "",
  excludeAllergenTag: "",
  difficulty: "",
  maxTotalTimeMinutes: "",
  minProtein: "",
  minCalories: "",
  maxCalories: "",
  featuredOnly: false,
  favoriteOnly: false,
  pantryOnly: false,
};

const formatTagLabel = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .trim();

const getDraftFromProps = ({
  sort,
  categoryId,
  cuisineId,
  dietaryTag,
  excludeAllergenTag,
  difficulty,
  maxTotalTimeMinutes,
  minProtein,
  minCalories,
  maxCalories,
  featuredOnly,
  favoriteOnly,
  pantryOnly = false,
}) => ({
  sort,
  categoryId,
  cuisineId,
  dietaryTag,
  excludeAllergenTag,
  difficulty,
  maxTotalTimeMinutes,
  minProtein,
  minCalories,
  maxCalories,
  featuredOnly,
  favoriteOnly,
  pantryOnly,
});

const FilterField = ({ label, children }) => (
  <label className="space-y-1.5">
    <span className="text-xs font-bold uppercase text-muted-foreground">
      {label}
    </span>
    {children}
  </label>
);

const FilterNumberInput = ({ label, value, onChange, placeholder }) => (
  <FilterField label={label}>
    <Input
      type="number"
      min="0"
      value={value}
      aria-label={label}
      className="h-9"
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  </FilterField>
);

const FilterPicker = ({ label, value, options, onChange, placeholder }) => (
  <FilterField label={label}>
    <OptionDrawerPicker
      nested
      value={value}
      options={options}
      title={label}
      ariaLabel={label}
      placeholder={placeholder}
      searchPlaceholder="Qidirish..."
      triggerClassName="h-9 rounded-4xl bg-input/30 font-semibold"
      onChange={onChange}
    />
  </FilterField>
);

const RecipeFilters = ({
  sort,
  categoryId,
  cuisineId,
  dietaryTag,
  excludeAllergenTag,
  difficulty,
  maxTotalTimeMinutes,
  minProtein,
  minCalories,
  maxCalories,
  featuredOnly,
  favoriteOnly,
  pantryOnly,
  hasActiveFilters,
  activeFilterCount,
  categories,
  cuisines,
  dietaryTags,
  allergenTags,
  className,
  onSortChange,
  onCategoryChange,
  onCuisineChange,
  onDietaryTagChange,
  onExcludeAllergenTagChange,
  onDifficultyChange,
  onMaxTotalTimeMinutesChange,
  onMinProteinChange,
  onMinCaloriesChange,
  onMaxCaloriesChange,
  onFeaturedOnlyToggle,
  onFavoriteOnlyToggle,
  onPantryOnlyToggle = () => {},
  onClearFilters,
}) => {
  const rt = useRecipeTranslation();
  const [open, setOpen] = React.useState(false);
  const currentDraft = React.useMemo(
    () =>
      getDraftFromProps({
        sort,
        categoryId,
        cuisineId,
        dietaryTag,
        excludeAllergenTag,
        difficulty,
        maxTotalTimeMinutes,
        minProtein,
        minCalories,
        maxCalories,
        featuredOnly,
        favoriteOnly,
        pantryOnly,
      }),
    [
      categoryId,
      cuisineId,
      dietaryTag,
      difficulty,
      excludeAllergenTag,
      favoriteOnly,
      featuredOnly,
      maxCalories,
      maxTotalTimeMinutes,
      minCalories,
      minProtein,
      pantryOnly,
      sort,
    ],
  );
  const [draft, setDraft] = React.useState(currentDraft);

  const fallbackActiveFilterCount = React.useMemo(
    () =>
      size(
        filter(
          [
            sort !== "newest",
            categoryId,
            cuisineId,
            dietaryTag,
            excludeAllergenTag,
            difficulty,
            maxTotalTimeMinutes,
            minProtein,
            minCalories,
            maxCalories,
            featuredOnly,
            favoriteOnly,
            pantryOnly,
          ],
          Boolean,
        ),
      ),
    [
      categoryId,
      cuisineId,
      dietaryTag,
      difficulty,
      excludeAllergenTag,
      favoriteOnly,
      featuredOnly,
      maxCalories,
      maxTotalTimeMinutes,
      minCalories,
      minProtein,
      pantryOnly,
      sort,
    ],
  );
  const resolvedActiveFilterCount =
    activeFilterCount ?? fallbackActiveFilterCount;

  const sortPickerOptions = React.useMemo(
    () =>
      map(sortOptions, (item) => ({
        value: item.value,
        label: rt(item.labelKey),
      })),
    [rt],
  );
  const categoryOptions = React.useMemo(
    () => [
      { value: "", label: rt("common.all") },
      ...map(categories, (item) => ({
        value: String(item.id),
        label: item.label,
      })),
    ],
    [categories, rt],
  );
  const cuisineOptions = React.useMemo(
    () => [
      { value: "", label: rt("common.all") },
      ...map(cuisines, (item) => ({
        value: String(item.id),
        label: item.label,
      })),
    ],
    [cuisines, rt],
  );
  const dietaryTagOptions = React.useMemo(
    () => [
      { value: "", label: rt("common.all") },
      ...map(dietaryTags, (item) => ({
        value: item,
        label: formatTagLabel(item),
      })),
    ],
    [dietaryTags, rt],
  );
  const allergenOptions = React.useMemo(
    () => [
      { value: "", label: rt("common.none") },
      ...map(allergenTags, (item) => ({
        value: item,
        label: formatTagLabel(item),
      })),
    ],
    [allergenTags, rt],
  );
  const difficultyPickerOptions = React.useMemo(
    () => [
      { value: "", label: rt("common.all") },
      ...map(difficultyOptions, (item) => ({
        value: item.value,
        label: rt(item.labelKey),
      })),
    ],
    [rt],
  );

  const updateDraft = React.useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setDraft(currentDraft);
      }
    },
    [currentDraft],
  );

  const handleApply = React.useCallback(() => {
    onSortChange(draft.sort);
    onCategoryChange(draft.categoryId);
    onCuisineChange(draft.cuisineId);
    onDietaryTagChange(draft.dietaryTag);
    onExcludeAllergenTagChange(draft.excludeAllergenTag);
    onDifficultyChange(draft.difficulty);
    onMaxTotalTimeMinutesChange(draft.maxTotalTimeMinutes);
    onMinProteinChange(draft.minProtein);
    onMinCaloriesChange(draft.minCalories);
    onMaxCaloriesChange(draft.maxCalories);
    if (draft.featuredOnly !== featuredOnly) {
      onFeaturedOnlyToggle();
    }
    if (draft.favoriteOnly !== favoriteOnly) {
      onFavoriteOnlyToggle();
    }
    if (draft.pantryOnly !== pantryOnly) {
      onPantryOnlyToggle();
    }
    setOpen(false);
  }, [
    draft,
    favoriteOnly,
    featuredOnly,
    onCategoryChange,
    onCuisineChange,
    onDietaryTagChange,
    onDifficultyChange,
    onExcludeAllergenTagChange,
    onFavoriteOnlyToggle,
    onFeaturedOnlyToggle,
    onMaxCaloriesChange,
    onMaxTotalTimeMinutesChange,
    onMinCaloriesChange,
    onMinProteinChange,
    onPantryOnlyToggle,
    onSortChange,
    pantryOnly,
  ]);

  const handleClear = React.useCallback(() => {
    setDraft(emptyDraft);
    onClearFilters();
    setOpen(false);
  }, [onClearFilters]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <Button
          type="button"
          variant="outline"
          aria-label={
            resolvedActiveFilterCount
              ? `${rt("filters.trigger")} ${resolvedActiveFilterCount}`
              : rt("filters.trigger")
          }
          onClick={() => setOpen(true)}
        >
          <ListFilterIcon className="size-4" />
          {rt("filters.trigger")}
          {resolvedActiveFilterCount ? (
            <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {resolvedActiveFilterCount}
            </span>
          ) : null}
        </Button>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{rt("filters.title")}</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <div className="grid gap-4">
              <FilterPicker
                label={rt("filters.sort")}
                value={draft.sort}
                options={sortPickerOptions}
                onChange={(value) => updateDraft("sort", value)}
              />
              <FilterPicker
                label={rt("filters.category")}
                value={draft.categoryId}
                options={categoryOptions}
                onChange={(value) => updateDraft("categoryId", value)}
              />
              <FilterPicker
                label={rt("filters.cuisine")}
                value={draft.cuisineId}
                options={cuisineOptions}
                onChange={(value) => updateDraft("cuisineId", value)}
              />
              <FilterPicker
                label={rt("filters.tag")}
                value={draft.dietaryTag}
                options={dietaryTagOptions}
                onChange={(value) => updateDraft("dietaryTag", value)}
              />
              <FilterPicker
                label={rt("filters.allergen")}
                value={draft.excludeAllergenTag}
                options={allergenOptions}
                onChange={(value) =>
                  updateDraft("excludeAllergenTag", value)
                }
              />
              <FilterPicker
                label={rt("filters.difficulty")}
                value={draft.difficulty}
                options={difficultyPickerOptions}
                onChange={(value) => updateDraft("difficulty", value)}
              />

              <div className="grid gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  {rt("filters.presets")}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => updateDraft("maxTotalTimeMinutes", "30")}
                  >
                    {rt("filters.presetFast")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => updateDraft("minProtein", "25")}
                  >
                    {rt("filters.presetProtein")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateDraft("minCalories", "350");
                      updateDraft("maxCalories", "650");
                    }}
                  >
                    {rt("filters.presetCalories")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FilterNumberInput
                  label={rt("filters.maxTotalTime")}
                  value={draft.maxTotalTimeMinutes}
                  placeholder={rt("common.minutesShort")}
                  onChange={(value) => updateDraft("maxTotalTimeMinutes", value)}
                />
                <FilterNumberInput
                  label={rt("filters.minProtein")}
                  value={draft.minProtein}
                  placeholder="g"
                  onChange={(value) => updateDraft("minProtein", value)}
                />
                <FilterNumberInput
                  label={rt("filters.minCalories")}
                  value={draft.minCalories}
                  placeholder={rt("nutrition.calories")}
                  onChange={(value) => updateDraft("minCalories", value)}
                />
                <FilterNumberInput
                  label={rt("filters.maxCalories")}
                  value={draft.maxCalories}
                  placeholder={rt("nutrition.calories")}
                  onChange={(value) => updateDraft("maxCalories", value)}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant={draft.featuredOnly ? "default" : "outline"}
                  aria-pressed={draft.featuredOnly}
                  aria-label={rt("filters.featuredAria")}
                  onClick={() =>
                    updateDraft("featuredOnly", !draft.featuredOnly)
                  }
                >
                  <SparklesIcon
                    className={cn("size-4", draft.featuredOnly && "fill-current")}
                  />
                  {rt("filters.featured")}
                </Button>
                <Button
                  type="button"
                  variant={draft.favoriteOnly ? "default" : "outline"}
                  aria-pressed={draft.favoriteOnly}
                  aria-label={rt("filters.savedOnly")}
                  onClick={() =>
                    updateDraft("favoriteOnly", !draft.favoriteOnly)
                  }
                >
                  <HeartIcon
                    className={cn("size-4", draft.favoriteOnly && "fill-current")}
                  />
                  {rt("filters.savedOnly")}
                </Button>
                <Button
                  type="button"
                  variant={draft.pantryOnly ? "default" : "outline"}
                  aria-pressed={draft.pantryOnly}
                  aria-label={rt("filters.pantryOnly")}
                  onClick={() =>
                    updateDraft("pantryOnly", !draft.pantryOnly)
                  }
                >
                  <PackageCheckIcon
                    className={cn("size-4", draft.pantryOnly && "fill-current")}
                  />
                  {rt("filters.pantryOnly")}
                </Button>
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter className="sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {rt("filters.cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!hasActiveFilters}
              aria-label={rt("filters.clearAria")}
              onClick={handleClear}
            >
              <XIcon className="size-4" />
              {rt("filters.clear")}
            </Button>
            <Button type="button" onClick={handleApply}>
              {rt("filters.apply")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Button
        type="button"
        variant="ghost"
        disabled={!hasActiveFilters}
        aria-label={rt("filters.clearAria")}
        onClick={onClearFilters}
      >
        <XIcon className="size-4" />
        <span className="hidden sm:inline">{rt("filters.clear")}</span>
      </Button>
    </div>
  );
};

export default RecipeFilters;
