import React from "react";
import { ChevronUpIcon, ImageIcon } from "lucide-react";
import map from "lodash/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RecipeImage from "./recipe-image.jsx";
import RecipeImagePickerDrawer from "./recipe-image-picker-drawer.jsx";
import RecipeOptionPickerDrawer from "./recipe-option-picker-drawer.jsx";

const categoryOptions = ["Nonushta", "Tushlik", "Kechki ovqat", "Tamaddi"];
const difficultyOptions = ["Oson", "O'rtacha", "Qiyin"];
const dietTags = [
  "Yuqori protein",
  "Kam kaloriyali",
  "Kam uglevodli",
  "Vegetarian",
  "Vegan",
  "Glutensiz",
  "Laktozasiz",
  "Paleo",
  "Keto",
];
const allergenTags = [
  "Gluten",
  "Sut mahsulotlari",
  "Tuxum",
  "Yeryong'oq",
  "Dengiz mahsulotlari",
  "Yong'oq",
  "Soya",
  "Susam",
];

const SelectField = ({ label, value, placeholder, onOpen, error }) => (
  <Field data-invalid={Boolean(error)}>
    <FieldLabel>{label}</FieldLabel>
    <button
      type="button"
      aria-label={label}
      className="flex h-11 w-full items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={onOpen}
    >
      <span className={value ? "text-foreground" : "text-muted-foreground"}>
        {value || placeholder}
      </span>
      <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
    <FieldError>{error}</FieldError>
  </Field>
);

const ToggleBadgeList = ({ values, selectedValues, onToggle }) => (
  <div className="flex flex-wrap gap-2">
    {map(values, (value) => {
      const checked = selectedValues.includes(value);

      return (
        <label key={value} className="cursor-pointer">
          <span className="sr-only">{value}</span>
          <Badge
            variant={checked ? "default" : "outline"}
            className="gap-2"
          >
            <Checkbox
              checked={checked}
              aria-label={value}
              onCheckedChange={() => onToggle(value)}
            />
            {value}
          </Badge>
        </label>
      );
    })}
  </div>
);

const RecipeBasicInfoStep = ({
  basicInfo,
  errors,
  imageUrl,
  onBasicInfoChange,
  onToggleTag,
  onToggleAllergen,
  onImagePick,
  onImageSelect,
  onImageRemove,
}) => {
  const [optionPicker, setOptionPicker] = React.useState("");
  const [imagePickerOpen, setImagePickerOpen] = React.useState(false);
  const activeOption =
    optionPicker === "category"
      ? {
          title: "Kategoriya tanlang",
          description: "Retsept qaysi ovqat vaqtiga yaqin?",
          options: categoryOptions,
          value: basicInfo.category,
          onSelect: (value) => onBasicInfoChange("category", value),
        }
      : optionPicker === "difficulty"
        ? {
            title: "Qiyinchilik darajasi",
            description: "User retseptni boshlashdan oldin murakkablikni ko'radi.",
            options: difficultyOptions,
            value: basicInfo.difficulty,
            onSelect: (value) => onBasicInfoChange("difficulty", value),
          }
        : null;

  return (
    <>
      <div className="flex flex-col gap-5">
        <FieldGroup className="gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="recipe-title">Retsept nomi</FieldLabel>
              <Input
                id="recipe-title"
                aria-label="Retsept nomi"
                value={basicInfo.title}
                placeholder="Masalan: Tovuqli quinoa salatasi"
                maxLength={100}
                onChange={(event) => onBasicInfoChange("title", event.target.value)}
              />
              <FieldDescription>{basicInfo.title.length}/100</FieldDescription>
              <FieldError>{errors.title}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="recipe-description">Qisqacha tavsif</FieldLabel>
              <Textarea
                id="recipe-description"
                aria-label="Qisqacha tavsif"
                value={basicInfo.description}
                placeholder="Retseptingiz haqida qisqacha ma'lumot bering..."
                maxLength={200}
                onChange={(event) =>
                  onBasicInfoChange("description", event.target.value)
                }
              />
              <FieldDescription>{basicInfo.description.length}/200</FieldDescription>
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SelectField
              label="Kategoriya"
              value={basicInfo.category}
              placeholder="Kategoriya tanlang"
              error={errors.category}
              onOpen={() => setOptionPicker("category")}
            />
            <SelectField
              label="Qiyinchilik darajasi"
              value={basicInfo.difficulty}
              placeholder="Tanlang"
              error={errors.difficulty}
              onOpen={() => setOptionPicker("difficulty")}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field data-invalid={Boolean(errors.prepTimeMinutes)}>
              <FieldLabel htmlFor="prep-time">Tayyorlash vaqti</FieldLabel>
              <Input
                id="prep-time"
                type="number"
                min="0"
                aria-label="Tayyorlash vaqti"
                value={basicInfo.prepTimeMinutes}
                onChange={(event) =>
                  onBasicInfoChange("prepTimeMinutes", event.target.value)
                }
              />
              <FieldError>{errors.prepTimeMinutes}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="cook-time">Pishirish vaqti</FieldLabel>
              <Input
                id="cook-time"
                type="number"
                min="0"
                aria-label="Pishirish vaqti"
                value={basicInfo.cookTimeMinutes}
                onChange={(event) =>
                  onBasicInfoChange("cookTimeMinutes", event.target.value)
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="total-time">Jami vaqt</FieldLabel>
              <Input
                id="total-time"
                type="number"
                min="0"
                aria-label="Jami vaqt"
                value={basicInfo.totalTimeMinutes}
                onChange={(event) =>
                  onBasicInfoChange("totalTimeMinutes", event.target.value)
                }
              />
            </Field>
            <Field data-invalid={Boolean(errors.servings)}>
              <FieldLabel htmlFor="servings">Porsiyalar soni</FieldLabel>
              <Input
                id="servings"
                type="number"
                min="1"
                aria-label="Porsiyalar soni"
                value={basicInfo.servings}
                onChange={(event) => onBasicInfoChange("servings", event.target.value)}
              />
              <FieldError>{errors.servings}</FieldError>
            </Field>
          </div>
        </FieldGroup>

        <FieldSet>
          <FieldLegend>Parhez teglar</FieldLegend>
          <ToggleBadgeList
            values={dietTags}
            selectedValues={basicInfo.tags}
            onToggle={onToggleTag}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend>Allergenlar</FieldLegend>
          <ToggleBadgeList
            values={allergenTags}
            selectedValues={basicInfo.allergens}
            onToggle={onToggleAllergen}
          />
        </FieldSet>

        <Field>
          <FieldLabel>Retsept rasmi (cover image)</FieldLabel>
          <button
            type="button"
            aria-label="Retsept rasmi tanlash"
            className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setImagePickerOpen(true)}
          >
            {imageUrl ? (
              <>
                <RecipeImage src={imageUrl} alt={basicInfo.title || "Retsept rasmi"} />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-black/60 px-4 py-3 text-white">
                  <span className="text-sm font-semibold">Rasmni almashtirish</span>
                  <ChevronUpIcon className="size-4" />
                </span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <span className="grid size-11 place-items-center rounded-xl bg-background shadow-sm">
                  <ImageIcon className="size-5" />
                </span>
                <span className="text-sm font-semibold">
                  Rasm yuklash yoki library'dan tanlash
                </span>
              </span>
            )}
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setImagePickerOpen(true)}>
              Rasm tanlash
            </Button>
            {imageUrl ? (
              <Button type="button" variant="ghost" size="sm" onClick={onImageRemove}>
                Rasmni olib tashlash
              </Button>
            ) : null}
          </div>
          <FieldDescription>
            JPG, PNG yoki WEBP. Maksimal o'lcham: 5MB. Tavsiya etilgan o'lcham: 1200x800px
          </FieldDescription>
        </Field>
      </div>

      {activeOption ? (
        <RecipeOptionPickerDrawer
          open={Boolean(activeOption)}
          onOpenChange={(nextOpen) => !nextOpen && setOptionPicker("")}
          {...activeOption}
        />
      ) : null}

      <RecipeImagePickerDrawer
        open={imagePickerOpen}
        imageUrl={imageUrl}
        onOpenChange={setImagePickerOpen}
        onPick={onImagePick}
        onSelect={onImageSelect}
        onRemove={onImageRemove}
      />
    </>
  );
};

export default RecipeBasicInfoStep;
