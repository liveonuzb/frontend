import React from "react";
import { CalendarPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const AddToMealPlanButton = ({
  isUpdating,
  disabled,
  onClick,
  className,
  children,
}) => {
  const rt = useRecipeTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      className={cn("h-11 w-full", className)}
      disabled={disabled || isUpdating}
      onClick={onClick}
    >
      <CalendarPlusIcon className="size-4" />
      {children || rt("buttons.addToMealPlan")}
    </Button>
  );
};

export default AddToMealPlanButton;
