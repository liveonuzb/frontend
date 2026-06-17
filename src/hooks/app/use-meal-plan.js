import React from "react";
import {
  clamp,
  entries,
  filter,
  find,
  floor,
  get,
  includes,
  isArray,
  isFinite as isFiniteNumber,
  isNil,
  isPlainObject,
  map,
  reduce,
  round,
  sortBy,
  toLower,
  toNumber,
  trim,
} from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
  usePutQuery,
} from "@/hooks/api";
import { useAiAccessInvalidation } from "@/hooks/app/use-ai-access";
import {
  NUTRITION_MEAL_PLAN_TEMPLATES_API_ROOT,
  NUTRITION_MEAL_PLANS_API_ROOT,
  NUTRITION_SHOPPING_LISTS_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import {
  invalidateNutritionDashboard,
  invalidateNutritionMealPlans,
  NUTRITION_MEAL_PLAN_QUERY_KEY,
  NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY,
  getNutritionMealPlanShoppingListsQueryKey,
  getNutritionMealPlanTemplateConflictPreviewQueryKey,
  getNutritionMealPlanTemplateDetailQueryKey,
} from "@/hooks/app/nutrition-query-keys";

export const MEAL_PLAN_QUERY_KEY = NUTRITION_MEAL_PLAN_QUERY_KEY;
export const MEAL_PLAN_TEMPLATES_QUERY_KEY =
  NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY;
export const getMealPlanTemplateDetailQueryKey =
  getNutritionMealPlanTemplateDetailQueryKey;
export const getMealPlanTemplateConflictPreviewQueryKey =
  getNutritionMealPlanTemplateConflictPreviewQueryKey;
export const getMealPlanShoppingListsQueryKey =
  getNutritionMealPlanShoppingListsQueryKey;

const defaultMealPlanState = {
  plans: [],
  activePlan: null,
  draftPlan: null,
};

const DAY_KEY_PREFIX = "day-";
const nutritionMealPlansPath = (path) =>
  nutritionApiPath(NUTRITION_MEAL_PLANS_API_ROOT, path);
const nutritionMealPlanTemplatesPath = (path) =>
  nutritionApiPath(NUTRITION_MEAL_PLAN_TEMPLATES_API_ROOT, path);
const nutritionShoppingListsPath = (path) =>
  nutritionApiPath(NUTRITION_SHOPPING_LISTS_API_ROOT, path);

const MAX_NORMALIZED_NUMBER = Number.MAX_SAFE_INTEGER;

const isBlankValue = (value) =>
  typeof value === "string" && trim(value).length === 0;

const hasNumericInput = (value) => !isNil(value) && !isBlankValue(value);

const toPositiveInteger = (value, fallback = null) => {
  if (!hasNumericInput(value)) {
    return fallback;
  }

  const normalized = toNumber(value);
  return isFiniteNumber(normalized) && normalized > 0
    ? floor(normalized)
    : fallback;
};

const toNonNegativeInteger = (value, fallback = 0) => {
  if (!hasNumericInput(value)) {
    return fallback;
  }

  const normalized = toNumber(value);
  return isFiniteNumber(normalized)
    ? round(clamp(normalized, 0, MAX_NORMALIZED_NUMBER))
    : fallback;
};

const toNonNegativeNumber = (value, fallback = 0) => {
  if (!hasNumericInput(value)) {
    return fallback;
  }

  const normalized = toNumber(value);
  return isFiniteNumber(normalized)
    ? clamp(normalized, 0, MAX_NORMALIZED_NUMBER)
    : fallback;
};

const toNullablePositiveNumber = (value) => {
  if (!hasNumericInput(value)) {
    return null;
  }

  const normalized = toNumber(value);
  return isFiniteNumber(normalized) && normalized > 0 ? normalized : null;
};

const toNullableNonNegativeNumber = (value) => {
  if (!hasNumericInput(value)) {
    return null;
  }

  const normalized = toNumber(value);
  return isFiniteNumber(normalized)
    ? clamp(normalized, 0, MAX_NORMALIZED_NUMBER)
    : null;
};

const normalizeNullableNumber = (value) => {
  if (!hasNumericInput(value)) {
    return null;
  }

  const normalized = toNumber(value);
  return isFiniteNumber(normalized) ? normalized : null;
};

const normalizeBoolean = (value) => {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return includes(["true", "1", "yes"], toLower(trim(value)));
};

const normalizeSourceRows = (value) =>
  isArray(value) ? filter(value, isPlainObject) : [];

const getDayNumberFromKey = (value, fallback = null) => {
  if (!hasNumericInput(value)) {
    return fallback;
  }

  const rawValue = trim(String(value));
  const match = rawValue.match(/^day-(\d+)$/i);
  const parsed = match ? toNumber(match[1]) : toNumber(rawValue);

  return isFiniteNumber(parsed) && parsed > 0 ? floor(parsed) : fallback;
};

const normalizeDayMeals = (value) => {
  if (isArray(value)) {
    return value;
  }

  if (isPlainObject(value) && isArray(value.meals)) {
    return value.meals;
  }

  if (isPlainObject(value) && isArray(value.columns)) {
    return value.columns;
  }

  return [];
};

export const normalizeMealPlanDays = (value) => {
  const candidates = isArray(value)
    ? map(value, (day) => {
        const dayRecord = isPlainObject(day) ? day : {};
        return {
          requestedDayNumber:
            getDayNumberFromKey(dayRecord.dayNumber) ??
            getDayNumberFromKey(dayRecord.dayKey),
          meals: normalizeDayMeals(dayRecord),
        };
      })
    : isPlainObject(value)
      ? map(entries(value), ([dayKey, meals]) => ({
          requestedDayNumber: getDayNumberFromKey(dayKey),
          meals: normalizeDayMeals(meals),
        }))
      : [];

  const reservedDayNumbers = new Set(
    filter(
      map(candidates, (day) => day.requestedDayNumber),
      (dayNumber) => !isNil(dayNumber),
    ),
  );
  const assignedDayNumbers = new Set();
  let fallbackDayNumber = 1;

  const getNextFallbackDayNumber = () => {
    while (
      assignedDayNumbers.has(fallbackDayNumber) ||
      reservedDayNumbers.has(fallbackDayNumber)
    ) {
      fallbackDayNumber += 1;
    }

    const nextDayNumber = fallbackDayNumber;
    fallbackDayNumber += 1;
    return nextDayNumber;
  };

  const days = map(candidates, (day) => {
    const dayNumber =
      !isNil(day.requestedDayNumber) &&
      !assignedDayNumbers.has(day.requestedDayNumber)
        ? day.requestedDayNumber
        : getNextFallbackDayNumber();

    assignedDayNumbers.add(dayNumber);

    return {
      dayNumber,
      dayKey: `${DAY_KEY_PREFIX}${dayNumber}`,
      meals: day.meals,
    };
  });

  return sortBy(days, ["dayNumber"]);
};

export const normalizeMealPlanDaysForTest = normalizeMealPlanDays;

export const mealPlanDaysToKanban = (value) =>
  reduce(normalizeMealPlanDays(value), (result, day) => {
    result[`${DAY_KEY_PREFIX}${day.dayNumber}`] = day.meals;
    return result;
  }, {});

export const mealPlanDaysToKanbanForTest = mealPlanDaysToKanban;

const getPlanDaysSource = (plan) =>
  isArray(plan?.days)
    ? plan.days
    : plan?.weeklyKanban &&
        typeof plan.weeklyKanban === "object" &&
        !isArray(plan.weeklyKanban)
      ? plan.weeklyKanban
      : [];

const getDurationDays = (plan, fallback = null) => {
  const value =
    plan?.durationDays ??
    (!isArray(plan?.days) ? plan?.days : undefined) ??
    fallback;
  return toPositiveInteger(value, fallback);
};

const normalizeBudgetTarget = (budget = null) => {
  if (!isPlainObject(budget)) {
    return null;
  }

  const amount = toNullablePositiveNumber(budget.amount);
  const targetCost = toNullablePositiveNumber(budget.targetCost);

  if (isNil(amount) || isNil(targetCost)) {
    return null;
  }

  return {
    amount,
    period: budget.period || "weekly",
    currency: budget.currency || "UZS",
    targetCost,
  };
};

const normalizeBudgetAdherence = (budget = null) => {
  const target = normalizeBudgetTarget(budget);

  if (!target) {
    return null;
  }

  return {
    ...target,
    estimatedCost: toNonNegativeNumber(budget.estimatedCost),
    difference: normalizeNullableNumber(budget.difference) ?? 0,
    usagePercent:
      toNullableNonNegativeNumber(budget.usagePercent),
    status: budget.status || "unknown",
  };
};

const normalizeFamilyBudget = (familyBudget = null) => {
  if (!isPlainObject(familyBudget)) {
    return null;
  }

  const memberCount = toPositiveInteger(familyBudget.memberCount);

  if (!memberCount) {
    return null;
  }

  return {
    groupId: familyBudget.groupId ?? null,
    name: familyBudget.name || null,
    memberCount,
    maxMembers: toPositiveInteger(familyBudget.maxMembers),
    perPersonEstimatedCost: toNonNegativeNumber(
      familyBudget.perPersonEstimatedCost,
    ),
    familyEstimatedCost: toNonNegativeNumber(familyBudget.familyEstimatedCost),
    perPersonTargetCost: toNullableNonNegativeNumber(
      familyBudget.perPersonTargetCost,
    ),
    familyTargetCost: toNullableNonNegativeNumber(familyBudget.familyTargetCost),
    familyDifference: normalizeNullableNumber(familyBudget.familyDifference),
    familyUsagePercent: toNullableNonNegativeNumber(
      familyBudget.familyUsagePercent,
    ),
    status: familyBudget.status || "unknown",
    currency: familyBudget.currency || "UZS",
  };
};

const normalizePlan = (plan) => {
  if (!plan) {
    return null;
  }

  const { weeklyKanban: _weeklyKanban, ...planRest } = plan;

  return {
    ...planRest,
    name: plan.name || "Mening rejam",
    description: plan.description ?? null,
    days: normalizeMealPlanDays(getPlanDaysSource(plan)),
    startDate: plan.startDate ?? null,
    durationDays: getDurationDays(plan),
    sourceTemplateId: plan.sourceTemplateId ?? null,
    appliedTargetCalories: plan.appliedTargetCalories ?? null,
    budgetTarget: normalizeBudgetTarget(plan.budgetTarget),
    createdAt: plan.createdAt ?? null,
    updatedAt: plan.updatedAt ?? null,
  };
};

export const normalizeMealPlanForTest = normalizePlan;

const getTemplateTranslation = (template, language = "uz") => {
  const translations = isArray(template?.translations)
    ? template.translations
    : [];

  return (
    find(translations, (translation) => translation?.language === language) ||
    find(translations, (translation) => translation?.language === "uz") ||
    null
  );
};

const normalizeTemplate = (template) => {
  if (!template) {
    return null;
  }

  const { weeklyKanban: _weeklyKanban, ...templateRest } = template;
  const translation = getTemplateTranslation(template);
  const localizedTitle =
    template.title ||
    translation?.name ||
    template.name ||
    "Tayyor shablon";

  return {
    ...templateRest,
    id: template.id,
    title: localizedTitle,
    name: localizedTitle,
    description: translation?.description || template.description || null,
    days: normalizeMealPlanDays(getPlanDaysSource(template)),
    tags: isArray(template.tags)
      ? template.tags
      : isArray(template.dietaryTags)
        ? template.dietaryTags
        : [],
    goal: template.goal || "maintenance",
    durationDays: getDurationDays(template, 30),
    mealCount: template.mealCount ?? null,
    mealsCount: template.mealsCount ?? 0,
    daysWithMeals: template.daysWithMeals ?? 0,
    isCompatible: template.isCompatible !== false,
    blockingReasons: isArray(template.blockingReasons)
      ? template.blockingReasons
      : [],
    appliedTargetCalories: template.appliedTargetCalories ?? null,
    updatedAt: template.updatedAt ?? null,
  };
};

export const normalizeMealPlanTemplateForTest = normalizeTemplate;

const normalizeTemplateLibraryResponse = (response) => {
  const payload = get(response, "data.data", []);
  const responseMeta = get(response, "data.meta", {});
  const templatesSource = isArray(payload) ? payload : [];
  const goals = isArray(responseMeta?.goals) ? responseMeta.goals : [];

  return {
    templates: filter(map(templatesSource, normalizeTemplate), Boolean),
    goals,
    meta: isPlainObject(responseMeta) ? responseMeta : {},
  };
};

export const normalizeMealPlanTemplateLibraryResponseForTest =
  normalizeTemplateLibraryResponse;

const normalizeTemplateDetailResponse = (response) =>
  normalizeTemplate(get(response, "data.data", get(response, "data", null)));

export const normalizeMealPlanTemplateDetailResponseForTest =
  normalizeTemplateDetailResponse;

const normalizeTemplateConflictPreview = (response) => {
  const payload = get(response, "data.data", get(response, "data", response));

  if (!isPlainObject(payload)) {
    return {
      templateId: null,
      isCompatible: true,
      canApply: true,
      canActivate: true,
      blockingReasons: [],
      requiresSubstitution: false,
      substitutionCount: 0,
    };
  }

  const blockingReasons = isArray(payload.blockingReasons)
    ? payload.blockingReasons
    : [];
  const isCompatible = payload.isCompatible !== false;

  return {
    templateId: payload.templateId ?? payload.id ?? null,
    isCompatible,
    canApply: payload.canApply ?? isCompatible,
    canActivate: payload.canActivate ?? isCompatible,
    blockingReasons,
    requiresSubstitution: Boolean(payload.requiresSubstitution),
    substitutionCount: toNumber(payload.substitutionCount) || 0,
  };
};

const normalizeShoppingListItem = (item = {}) => {
  if (!isPlainObject(item)) {
    return null;
  }

  return {
    id: item.id ?? null,
    ingredientId: item.ingredientId ?? null,
    name: item.name || "Ingredient",
    grams: toNonNegativeNumber(item.grams),
    unit: item.unit || "g",
    pricePer100g: toNullableNonNegativeNumber(item.pricePer100g),
    priceSource: item.priceSource || "unknown",
    estimatedCost: toNullableNonNegativeNumber(item.estimatedCost),
    currency: item.currency || "UZS",
    sources: normalizeSourceRows(item.sources),
    isChecked: normalizeBoolean(item.isChecked),
    checkedAt: item.checkedAt ?? null,
  };
};

export const normalizeMealPlanShoppingList = (payload = {}) => {
  const source = isPlainObject(payload) ? payload : {};
  const totals = isPlainObject(source.totals) ? source.totals : {};
  const priceContext = isPlainObject(source.priceContext)
    ? source.priceContext
    : {};

  return {
    id: source.id ?? null,
    planId: source.planId ?? null,
    planName: source.planName || null,
    durationDays: toPositiveInteger(source.durationDays),
    createdAt: source.createdAt ?? null,
    priceContext: {
      regionKey: priceContext.regionKey ?? null,
      season: priceContext.season ?? null,
      currency: priceContext.currency || "UZS",
    },
    items: isArray(source.items)
      ? filter(map(source.items, normalizeShoppingListItem), Boolean)
      : [],
    unmatchedFoods: isArray(source.unmatchedFoods)
      ? filter(source.unmatchedFoods, isPlainObject)
      : [],
    totals: {
      estimatedCost: toNonNegativeNumber(totals.estimatedCost),
      knownItems: toNonNegativeInteger(totals.knownItems),
      unknownItems: toNonNegativeInteger(totals.unknownItems),
      currency: totals.currency || priceContext.currency || "UZS",
    },
    budget: normalizeBudgetAdherence(source.budget),
    familyBudget: normalizeFamilyBudget(source.familyBudget),
  };
};

const normalizeMealPlanShoppingListsResponse = (response) => {
  const payload = get(response, "data.data", get(response, "data", []));
  const source = isArray(payload) ? payload : [];

  return filter(map(source, normalizeMealPlanShoppingList), Boolean);
};

const normalizeMealPlanState = (payload = {}) => {
  const plans = isArray(payload.plans)
    ? filter(map(payload.plans, normalizePlan), Boolean)
    : [];
  const activePlan =
    normalizePlan(payload.activePlan) ||
    find(plans, (plan) => plan.status === "active") ||
    null;
  const draftPlan =
    normalizePlan(payload.draftPlan) ||
    find(plans, (plan) => plan.status === "draft") ||
    null;

  return {
    plans,
    activePlan,
    draftPlan,
  };
};

const buildMealPlanPayload = (plan = {}) => ({
  name: plan.name,
  description: plan.description,
  days: normalizeMealPlanDays(getPlanDaysSource(plan)),
  source: plan.source,
  durationDays: plan.durationDays,
  sourceTemplateId: plan.sourceTemplateId,
  appliedTargetCalories: plan.appliedTargetCalories,
  goal: plan.goal,
  mealCount: plan.mealCount,
  startDate: plan.startDate,
  budgetAmount: plan.budgetAmount,
  budgetPeriod: plan.budgetPeriod,
  budgetCurrency: plan.budgetCurrency,
});

export const buildMealPlanPayloadForTest = buildMealPlanPayload;

const syncMealPlanCache = (queryClient, response) => {
  const nextState = normalizeMealPlanState(get(response, "data.data", {}));
  // Store in the same shape as the Axios response so the useMemo path is consistent.
  queryClient.setQueryData(MEAL_PLAN_QUERY_KEY, { data: { data: nextState } });
  return nextState;
};

export const useMealPlan = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const { invalidateAiAccess } = useAiAccessInvalidation();
  const { data, ...query } = useGetQuery({
    url: nutritionMealPlansPath(),
    queryProps: {
      queryKey: MEAL_PLAN_QUERY_KEY,
      enabled,
    },
  });

  const mutationProps = React.useMemo(
    () => ({
      onSuccess: async (response) => {
        syncMealPlanCache(queryClient, response);
        await Promise.all([
          invalidateNutritionDashboard(queryClient),
          invalidateNutritionMealPlans(queryClient),
        ]);
      },
    }),
    [queryClient],
  );

  const createDraftMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const updatePlanMutation = usePutQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const generateAiMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const applyTemplateMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const rescaleCaloriesMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const activatePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const renamePlanMutation = usePutQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const duplicatePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const archivePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const pausePlanMutation = usePostQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const deletePlanMutation = useDeleteQuery({
    queryKey: MEAL_PLAN_QUERY_KEY,
    mutationProps,
  });
  const mealPlanState = React.useMemo(
    () => normalizeMealPlanState(get(data, "data.data", defaultMealPlanState)),
    [data],
  );

  const saveDraftPlan = React.useCallback(
    async (plan) => {
      const payload = buildMealPlanPayload(plan);
      const response = plan?.id
        ? await updatePlanMutation.mutateAsync({
            url: nutritionMealPlansPath(plan.id),
            attributes: payload,
          })
        : await createDraftMutation.mutateAsync({
            url: nutritionMealPlansPath(),
            attributes: payload,
          });

      return syncMealPlanCache(queryClient, response);
    },
    [createDraftMutation, queryClient, updatePlanMutation],
  );

  const generateAiPlan = React.useCallback(
    async (payload) => {
      const response = await generateAiMutation.mutateAsync({
        url: nutritionMealPlansPath("me/ai-generate"),
        attributes: payload,
      });
      const nextState = syncMealPlanCache(queryClient, response);
      await invalidateAiAccess();
      return nextState;
    },
    [generateAiMutation, invalidateAiAccess, queryClient],
  );

  const applyTemplatePlan = React.useCallback(
    async (templateId) => {
      if (!templateId) {
        return mealPlanState;
      }

      const response = await applyTemplateMutation.mutateAsync({
        url: nutritionMealPlanTemplatesPath(`${templateId}/apply`),
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [applyTemplateMutation, mealPlanState, queryClient],
  );

  const rescalePlanCalories = React.useCallback(
    async (planId) => {
      const targetPlanId =
        planId || mealPlanState.activePlan?.id || mealPlanState.draftPlan?.id;
      if (!targetPlanId) {
        return mealPlanState;
      }

      const response = await rescaleCaloriesMutation.mutateAsync({
        url: nutritionMealPlansPath(`${targetPlanId}/rescale-calories`),
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [mealPlanState, queryClient, rescaleCaloriesMutation],
  );

  const startPlan = React.useCallback(
    async (plan) => {
      if (!plan?.id) {
        const createdState = await saveDraftPlan(plan);
        const latestDraft =
          createdState.draftPlan ||
          find(createdState.plans, (item) => item.status === "draft");

        if (!latestDraft?.id) {
          return createdState;
        }

        const activatedResponse = await activatePlanMutation.mutateAsync({
          url: nutritionMealPlansPath(`${latestDraft.id}/activate`),
          attributes: buildMealPlanPayload(latestDraft),
        });
        return syncMealPlanCache(queryClient, activatedResponse);
      }

      const response = await activatePlanMutation.mutateAsync({
        url: nutritionMealPlansPath(`${plan.id}/activate`),
        attributes: buildMealPlanPayload(plan),
      });
      return syncMealPlanCache(queryClient, response);
    },
    [activatePlanMutation, queryClient, saveDraftPlan],
  );

  const pausePlan = React.useCallback(
    async (planId) => {
      const targetPlanId = planId || mealPlanState.activePlan?.id;
      if (!targetPlanId) {
        return mealPlanState;
      }

      const response = await pausePlanMutation.mutateAsync({
        url: nutritionMealPlansPath(`${targetPlanId}/pause`),
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [mealPlanState, pausePlanMutation, queryClient],
  );

  const renamePlan = React.useCallback(
    async (planId, name) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await renamePlanMutation.mutateAsync({
        url: nutritionMealPlansPath(`me/${planId}/rename`),
        attributes: { name },
      });
      return syncMealPlanCache(queryClient, response);
    },
    [mealPlanState, queryClient, renamePlanMutation],
  );

  const duplicatePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await duplicatePlanMutation.mutateAsync({
        url: nutritionMealPlansPath(`${planId}/duplicate`),
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [duplicatePlanMutation, mealPlanState, queryClient],
  );

  const archivePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await archivePlanMutation.mutateAsync({
        url: nutritionMealPlansPath(`${planId}/archive`),
        attributes: {},
      });
      return syncMealPlanCache(queryClient, response);
    },
    [archivePlanMutation, mealPlanState, queryClient],
  );

  const removePlan = React.useCallback(
    async (planId) => {
      if (!planId) {
        return mealPlanState;
      }

      const response = await deletePlanMutation.mutateAsync({
        url: nutritionMealPlansPath(`me/${planId}`),
      });
      return syncMealPlanCache(queryClient, response);
    },
    [deletePlanMutation, mealPlanState, queryClient],
  );

  return {
    ...query,
    ...mealPlanState,
    generateAiPlan,
    applyTemplatePlan,
    rescalePlanCalories,
    saveDraftPlan,
    startPlan,
    renamePlan,
    duplicatePlan,
    archivePlan,
    pausePlan,
    removePlan,
    isSavingDraft:
      createDraftMutation.isPending || updatePlanMutation.isPending,
    isGeneratingAi: generateAiMutation.isPending,
    isApplyingTemplate: applyTemplateMutation.isPending,
    isRescalingCalories: rescaleCaloriesMutation.isPending,
    isStartingPlan: activatePlanMutation.isPending,
    isRenamingPlan: renamePlanMutation.isPending,
    isDuplicatingPlan: duplicatePlanMutation.isPending,
    isArchivingPlan: archivePlanMutation.isPending,
    isPausingPlan: pausePlanMutation.isPending,
    isRemovingPlan: deletePlanMutation.isPending,
  };
};

export const useMealPlanTemplates = (options = {}) => {
  const enabled = options.enabled ?? true;
  const goal = options.goal || "all";
  const params = {
    ...(goal && goal !== "all" ? { goal } : {}),
    ...(options.dietaryTag ? { dietaryTag: options.dietaryTag } : {}),
    ...(options.budgetTier ? { budgetTier: options.budgetTier } : {}),
    ...(options.durationDays ? { durationDays: options.durationDays } : {}),
    ...(options.mealCount ? { mealCount: options.mealCount } : {}),
    ...(options.cuisine ? { cuisine: options.cuisine } : {}),
    ...(options.maxCalories ? { maxCalories: options.maxCalories } : {}),
  };
  const { data, ...query } = useGetQuery({
    url: nutritionMealPlanTemplatesPath(),
    params: Object.keys(params).length ? params : undefined,
    queryProps: {
      queryKey: [...MEAL_PLAN_TEMPLATES_QUERY_KEY, params],
      enabled,
    },
  });

  const library = React.useMemo(
    () => normalizeTemplateLibraryResponse(data),
    [data],
  );

  return {
    ...query,
    templates: library.templates,
    goals: library.goals,
    meta: library.meta,
  };
};

export const useGenerateMealPlanShoppingList = () => {
  const mutation = usePostQuery();

  const generateShoppingList = React.useCallback(
    async (planId, input = {}) => {
      if (!planId) {
        return normalizeMealPlanShoppingList();
      }

      const response = await mutation.mutateAsync({
        url: nutritionMealPlansPath(`${planId}/shopping-list`),
        attributes: input,
      });

      return normalizeMealPlanShoppingList(
        get(response, "data.data", get(response, "data", {})),
      );
    },
    [mutation.mutateAsync],
  );

  return {
    generateShoppingList,
    isGeneratingShoppingList: mutation.isPending,
  };
};

export const useMealPlanShoppingLists = (planId, options = {}) => {
  const enabled = Boolean(planId) && (options.enabled ?? true);
  const { data, ...query } = useGetQuery({
    url: nutritionMealPlansPath(`${planId}/shopping-lists`),
    queryProps: {
      queryKey: getMealPlanShoppingListsQueryKey(planId),
      enabled,
    },
  });
  const shoppingLists = React.useMemo(
    () => normalizeMealPlanShoppingListsResponse(data),
    [data],
  );

  return {
    ...query,
    shoppingLists,
    latestShoppingList: shoppingLists[0] ?? null,
  };
};

export const useUpdateShoppingListItemCheck = (planId) => {
  const mutation = usePatchQuery({
    queryKey: getMealPlanShoppingListsQueryKey(planId),
  });

  const updateShoppingListItemCheck = React.useCallback(
    async (listId, itemId, isChecked) => {
      if (!listId || !itemId) {
        return normalizeMealPlanShoppingList();
      }

      const response = await mutation.mutateAsync({
        url: nutritionShoppingListsPath(`${listId}/items/${itemId}`),
        attributes: { isChecked },
      });

      return normalizeMealPlanShoppingList(
        get(response, "data.data", get(response, "data", {})),
      );
    },
    [mutation.mutateAsync],
  );

  return {
    updateShoppingListItemCheck,
    isUpdatingShoppingListItem: mutation.isPending,
  };
};

export const useMealPlanTemplateDetail = (templateId, options = {}) => {
  const enabled = Boolean(templateId) && (options.enabled ?? true);
  const { data, ...query } = useGetQuery({
    url: nutritionMealPlanTemplatesPath(templateId),
    queryProps: {
      queryKey: getMealPlanTemplateDetailQueryKey(templateId),
      enabled,
    },
  });
  const template = React.useMemo(
    () => normalizeTemplateDetailResponse(data),
    [data],
  );

  return {
    ...query,
    template,
  };
};

export const useMealPlanTemplateConflictPreview = (
  templateId,
  options = {},
) => {
  const enabled = Boolean(templateId) && (options.enabled ?? true);
  const { data, ...query } = useGetQuery({
    url: templateId
      ? nutritionMealPlanTemplatesPath(`${templateId}/conflicts/preview`)
      : "",
    queryProps: {
      queryKey: getMealPlanTemplateConflictPreviewQueryKey(templateId),
      enabled,
    },
  });
  const preview = React.useMemo(
    () => normalizeTemplateConflictPreview(data),
    [data],
  );

  return {
    ...query,
    preview,
  };
};

export default useMealPlan;
