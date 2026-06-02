import React from "react";
import map from "lodash/map";
import { Button } from "@/components/ui/button";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const formatTagLabel = (value) =>
  String(value || "")
    .replace(/[-_]+/g, " ")
    .trim();

const RecipeTagChips = ({ tags, value, onChange }) => {
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
        {rt("chips.allTags")}
      </Button>
      {map(tags, (tag) => {
        const isSelected = value === tag;

        return (
          <Button
            key={tag}
            type="button"
            size="sm"
            variant={isSelected ? "default" : "outline"}
            aria-pressed={isSelected}
            className="h-8 shrink-0"
            onClick={() => onChange(tag)}
          >
            {formatTagLabel(tag)}
          </Button>
        );
      })}
    </div>
  );
};

export default RecipeTagChips;
