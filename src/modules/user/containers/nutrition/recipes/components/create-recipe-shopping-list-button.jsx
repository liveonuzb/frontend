import React from "react";
import { ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils.js";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const CreateRecipeShoppingListButton = ({
  isUpdating,
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
      disabled={isUpdating}
      onClick={onClick}
    >
      <ShoppingCartIcon className="size-4" />
      {children || rt("buttons.createShoppingList")}
    </Button>
  );
};

export default CreateRecipeShoppingListButton;
