import React from "react";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import RecipeDetailView from "./recipe-detail-view.jsx";

const RecipeDetailDrawer = ({
  open,
  recipe,
  servings,
  isFavorite,
  isUpdating,
  onOpenChange,
  onServingsChange,
  onFavorite,
  onSave,
  onAdd,
  onEdit,
  onStartCooking,
}) => {
  if (!recipe) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[94vh] data-[vaul-drawer-direction=bottom]:md:max-w-5xl">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Retsept tafsilotlari</DrawerTitle>
          <DrawerDescription>{recipe.title}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-5">
          <RecipeDetailView
            recipe={recipe}
            servings={servings}
            isFavorite={isFavorite}
            isUpdating={isUpdating}
            variant="drawer"
            onServingsChange={onServingsChange}
            onFavorite={onFavorite}
            onSave={onSave}
            onAddToMealPlan={onAdd}
            onEdit={onEdit}
            onStartCooking={onStartCooking}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RecipeDetailDrawer;
