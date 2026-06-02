import React from "react";
import { UtensilsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const AddToMealLogButton = ({ isUpdating, onClick, className, children }) => {
  const rt = useRecipeTranslation();

  return (
    <Button
      type="button"
      className={cn("h-11 w-full", className)}
      disabled={isUpdating}
      onClick={onClick}
    >
      <UtensilsIcon className="size-4" />
      {children || rt("buttons.addToMealLog")}
    </Button>
  );
};

export default AddToMealLogButton;
