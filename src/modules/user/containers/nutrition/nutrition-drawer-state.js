import React from "react";

export const NUTRITION_DRAWER_INITIAL_STATE = {
  isCalendarOpen: false,
  isBuilderOpen: false,
  builderInitialData: null,
  isShoppingOpen: false,
  isAIOpen: false,
  isPlansDrawerOpen: false,
  isTemplateLibraryOpen: false,
  isGoalWizardOpen: false,
  isActionDrawerOpen: false,
  actionDrawerInitialNested: null,
  isCancelPlanOpen: false,
  isPlanMetaOpen: false,
  planMetaMode: "create",
  planMetaShouldOpenBuilder: true,
  planMetaName: "",
  planMetaDescription: "",
  planMetaBudgetAmount: "",
  planMetaBudgetPeriod: "weekly",
  planMetaBudgetCurrency: "UZS",
  isSavedMealsOpen: false,
  mealTransferContext: null,
  selectedMealTypeForAdd: "breakfast",
  isFilterDrawerOpen: false,
  selectedScanId: null,
  isSavingInlineScan: false,
  duplicateMealPrompt: null,
};

export const nutritionDrawerStateReducer = (state, action) => {
  if (action.type !== "set-field") {
    return state;
  }

  const previousValue = state[action.field];
  const nextValue =
    typeof action.value === "function"
      ? action.value(previousValue)
      : action.value;

  if (Object.is(previousValue, nextValue)) {
    return state;
  }

  return {
    ...state,
    [action.field]: nextValue,
  };
};

const createSetter = (dispatch, field) => (value) => {
  dispatch({ type: "set-field", field, value });
};

export const useNutritionDrawerState = () => {
  const [state, dispatch] = React.useReducer(
    nutritionDrawerStateReducer,
    NUTRITION_DRAWER_INITIAL_STATE,
  );

  const setters = React.useMemo(
    () => ({
      setIsCalendarOpen: createSetter(dispatch, "isCalendarOpen"),
      setIsBuilderOpen: createSetter(dispatch, "isBuilderOpen"),
      setBuilderInitialData: createSetter(dispatch, "builderInitialData"),
      setIsShoppingOpen: createSetter(dispatch, "isShoppingOpen"),
      setIsAIOpen: createSetter(dispatch, "isAIOpen"),
      setIsPlansDrawerOpen: createSetter(dispatch, "isPlansDrawerOpen"),
      setIsTemplateLibraryOpen: createSetter(
        dispatch,
        "isTemplateLibraryOpen",
      ),
      setIsGoalWizardOpen: createSetter(dispatch, "isGoalWizardOpen"),
      setIsActionDrawerOpen: createSetter(dispatch, "isActionDrawerOpen"),
      setActionDrawerInitialNested: createSetter(
        dispatch,
        "actionDrawerInitialNested",
      ),
      setIsCancelPlanOpen: createSetter(dispatch, "isCancelPlanOpen"),
      setIsPlanMetaOpen: createSetter(dispatch, "isPlanMetaOpen"),
      setPlanMetaMode: createSetter(dispatch, "planMetaMode"),
      setPlanMetaShouldOpenBuilder: createSetter(
        dispatch,
        "planMetaShouldOpenBuilder",
      ),
      setPlanMetaName: createSetter(dispatch, "planMetaName"),
      setPlanMetaDescription: createSetter(dispatch, "planMetaDescription"),
      setPlanMetaBudgetAmount: createSetter(
        dispatch,
        "planMetaBudgetAmount",
      ),
      setPlanMetaBudgetPeriod: createSetter(
        dispatch,
        "planMetaBudgetPeriod",
      ),
      setPlanMetaBudgetCurrency: createSetter(
        dispatch,
        "planMetaBudgetCurrency",
      ),
      setIsSavedMealsOpen: createSetter(dispatch, "isSavedMealsOpen"),
      setMealTransferContext: createSetter(dispatch, "mealTransferContext"),
      setSelectedMealTypeForAdd: createSetter(
        dispatch,
        "selectedMealTypeForAdd",
      ),
      setIsFilterDrawerOpen: createSetter(dispatch, "isFilterDrawerOpen"),
      setSelectedScanId: createSetter(dispatch, "selectedScanId"),
      setIsSavingInlineScan: createSetter(dispatch, "isSavingInlineScan"),
      setDuplicateMealPrompt: createSetter(dispatch, "duplicateMealPrompt"),
    }),
    [],
  );

  return React.useMemo(
    () => ({
      ...state,
      ...setters,
    }),
    [setters, state],
  );
};
