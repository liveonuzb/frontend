import React from "react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const RecipeCategoryChips = ({ categories, value, onChange }) => {
  const rt = useRecipeTranslation();

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <Button
        type="button"
        size="sm"
        variant={value ? "outline" : "default"}
        aria-pressed={!value}
        className="h-8 shrink-0"
        onClick={() => onChange("")}
      >
        {rt("common.all")}
      </Button>
      {map(categories, (category) => {
        const categoryValue = String(category.id);
        const isSelected = value === categoryValue;

        return (
          <Button
            key={categoryValue}
            type="button"
            size="sm"
            variant={isSelected ? "default" : "outline"}
            aria-pressed={isSelected}
            className="h-8 shrink-0"
            onClick={() => onChange(categoryValue)}
          >
            {category.label}
          </Button>
        );
      })}
    </div>
  );
};

export default RecipeCategoryChips;
