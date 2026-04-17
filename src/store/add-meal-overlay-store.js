import { create } from "zustand";

const getDefaultMealType = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 18) return "snack";
  if (hour >= 18 && hour < 23) return "dinner";
  return "snack";
};

const getDefaultDateKey = () => new Date().toISOString().split("T")[0];

const useAddMealOverlayStore = create((set) => ({
  isActionDrawerOpen: false,
  mealType: getDefaultMealType(),
  dateKey: getDefaultDateKey(),
  initialNested: null,
  manualSearch: "",
  manualAnalyze: false,
  manualSource: "manual",
  openActionDrawer: ({ mealType, dateKey, initialNested } = {}) =>
    set({
      isActionDrawerOpen: true,
      mealType: mealType || getDefaultMealType(),
      dateKey: dateKey || getDefaultDateKey(),
      initialNested: initialNested || null,
      manualSearch: "",
      manualAnalyze: false,
      manualSource: "manual",
    }),
  setActionDrawerOpen: (value) =>
    set({
      isActionDrawerOpen: value,
    }),
  setManualSearch: (value) =>
    set({
      manualSearch: value,
    }),
  closeAll: () =>
    set({
      isActionDrawerOpen: false,
      initialNested: null,
      manualSearch: "",
      manualAnalyze: false,
      manualSource: "manual",
    }),
}));

export default useAddMealOverlayStore;
