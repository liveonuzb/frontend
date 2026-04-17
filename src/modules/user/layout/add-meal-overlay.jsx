import React from "react";
import ActionDrawer from "@/modules/user/containers/nutrition/action-drawer.jsx";
import { useAddMealOverlayStore } from "@/store";

const AddMealOverlay = () => {
  const {
    isActionDrawerOpen,
    mealType,
    dateKey,
    initialNested,
    setActionDrawerOpen,
    closeAll,
  } = useAddMealOverlayStore();

  return (
    <ActionDrawer
      open={isActionDrawerOpen}
      onOpenChange={setActionDrawerOpen}
      dateKey={dateKey}
      mealType={mealType}
      initialNested={initialNested}
      onCloseAll={closeAll}
    />
  );
};

export default AddMealOverlay;
