import React from "react";
import { HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const FavoriteButton = ({
  isFavorite,
  isUpdating,
  onClick,
  className,
  labelWhenSaved,
  labelWhenUnsaved,
}) => {
  const rt = useRecipeTranslation();
  const savedLabel = labelWhenSaved || rt("buttons.saved");
  const unsavedLabel = labelWhenUnsaved || rt("buttons.save");

  return (
    <Button
      type="button"
      variant={isFavorite ? "default" : "outline"}
      size="icon-sm"
      disabled={isUpdating}
      aria-pressed={Boolean(isFavorite)}
      aria-label={isFavorite ? savedLabel : unsavedLabel}
      className={className}
      onClick={onClick}
    >
      <HeartIcon className={cn("size-4", isFavorite && "fill-current")} />
    </Button>
  );
};

export default FavoriteButton;
