import React from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const RecipeSearchBar = ({ value, onChange, className }) => {
  const rt = useRecipeTranslation();
  const label = rt("search.label");

  return (
    <label className={className || "relative block self-end"}>
      <span className="sr-only">{label}</span>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        aria-label={label}
        className="pl-9"
        placeholder={rt("search.placeholder")}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
};

export default RecipeSearchBar;
