import React from "react";
import { UtensilsIcon } from "lucide-react";
import { cn } from "@/lib/utils.js";

const RecipeImage = ({ recipe, src, alt, className }) => {
  const imageUrl = src || recipe?.imageUrl;
  const imageAlt = alt ?? recipe?.title ?? "Retsept rasmi";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={imageAlt}
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center bg-muted text-muted-foreground",
        className,
      )}
    >
      <UtensilsIcon className="size-8" />
    </div>
  );
};

export default RecipeImage;
