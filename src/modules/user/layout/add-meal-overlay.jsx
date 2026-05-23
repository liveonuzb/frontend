import React from "react";
import ActionDrawer from "@/modules/user/containers/nutrition/action-drawer.jsx";
import SavedMealsDrawer from "@/modules/user/containers/nutrition/saved-meals-drawer.jsx";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import useOnlineStatus from "@/hooks/utils/use-online-status.js";
import { useAddMealOverlayStore } from "@/store";

const AddMealOverlay = () => {
  const [isSavedMealsOpen, setIsSavedMealsOpen] = React.useState(false);
  const {
    isActionDrawerOpen,
    mealType,
    dateKey,
    initialNested,
    setActionDrawerOpen,
    closeAll,
  } = useAddMealOverlayStore();
  const { addMeal, addMealsBatch } = useDailyTrackingActions();
  const isOnline = useOnlineStatus();

  return (
    <>
      <ActionDrawer
        open={isActionDrawerOpen}
        onOpenChange={setActionDrawerOpen}
        dateKey={dateKey}
        mealType={mealType}
        initialNested={initialNested}
        onOpenSavedMeals={() => setIsSavedMealsOpen(true)}
        onCloseAll={closeAll}
        disabled={!isOnline}
      />
      <SavedMealsDrawer
        open={isSavedMealsOpen}
        onOpenChange={setIsSavedMealsOpen}
        dateKey={dateKey}
        mealType={mealType}
        onAddMeal={addMeal}
        onAddMealsBatch={addMealsBatch}
        disabled={!isOnline}
      />
    </>
  );
};

export default AddMealOverlay;
