import React from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useWorkoutCalorieAdjustmentPreference from "@/hooks/app/use-workout-calorie-adjustment";
import useMealPlan, {
  normalizeMealPlanDays,
  useMealPlanTemplates,
} from "@/hooks/app/use-meal-plan";
import useNutritionDashboard from "@/hooks/app/use-nutrition-dashboard";
import {
  getTodayKey,
  setMealDuplicateConfirmHandler,
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import useFoodCatalog, {
  enrichTrackedMealItem,
  useFoodScan,
} from "@/hooks/app/use-food-catalog";
import PageTransition from "@/components/page-transition";
import ErrorBoundary from "@/components/error-boundary/index.jsx";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import useOnlineStatus from "@/hooks/utils/use-online-status.js";
import { useLocation, useNavigate } from "react-router";
import { MEAL_CONFIG } from "@/modules/user/lib/meal-config";
import NutritionHomeView from "./views/home-view.jsx";
import NutritionPlansView from "./views/plans-view.jsx";
import NutritionReportView from "./views/report-view.jsx";
import NutritionDrawers from "./nutrition-drawers.jsx";
import { buildMealPayloadFromDraft } from "./meal-draft-review-utils.js";
import {
  getPlanDayStatus,
  resolvePlanColumnsForDate,
} from "./nutrition-plan-days.js";
import {
  buildPlanMetaBudgetPayload,
  getPlanBudgetFormDefaults,
  getPlanRescaleExplanation,
} from "./nutrition-plan-meta.js";
import {
  getTemplateBlockingErrorMessage,
  getTemplateBlockingReasonSummary,
} from "./template-blocking-reasons.js";
import { useNutritionBreadcrumbs } from "./nutrition-breadcrumbs.js";
import { useNutritionDateState } from "./nutrition-date-state.js";
import {
  CALORIE_FILTER_DEFAULT,
  buildNutritionTotals,
  buildPendingScanFoodsByType,
  buildPlannedByType,
  buildSortedMealSections,
  filterMealSections,
  getActiveMealType,
  getActiveNutritionFilterCount,
  getWaterConsumedMl,
} from "./nutrition-meal-section-state.js";
import { useNutritionDrawerState } from "./nutrition-drawer-state.js";
import { useNutritionMealActions } from "./nutrition-meal-actions.js";
import {
  getPlanBuilderData,
  getPlanSourceMeta,
  getPlanStatusMeta,
  useNutritionPlanSelection,
} from "./nutrition-plan-selection.js";

import filter from "lodash/filter";
import find from "lodash/find";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const NutritionErrorFallback = () => (
  <div className="flex min-h-[55vh] items-center justify-center px-4">
    <div className="max-w-sm rounded-3xl border bg-card p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        !
      </div>
      <h2 className="text-lg font-black">Xatolik yuz berdi</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Nutrition sahifasini yuklashda muammo chiqdi.
      </p>
      <Button
        type="button"
        className="mt-5 w-full"
        onClick={() => window.location.reload()}
      >
        Qayta urinish
      </Button>
    </div>
  </div>
);

const NutritionContent = ({ entryView = "home" }) => {
  const user = useAuthStore((state) => state.user);
  const isOnline = useOnlineStatus();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const location = useLocation();
  const navigate = useNavigate();
  useNutritionBreadcrumbs(entryView, setBreadcrumbs);
  const {
    goals,
    hasServerGoals,
    goalSource,
    isLoading: isGoalsLoading,
    isFetching: isGoalsFetching,
  } = useHealthGoals();
  const { enabled: workoutCalorieAdjustmentEnabled } =
    useWorkoutCalorieAdjustmentPreference();
  const {
    addMeal: addMealAction,
    addMealsBatch: addMealsBatchAction,
    addWaterCup,
    removeMeal: removeMealAction,
    patchMeal,
  } = useDailyTrackingActions();

  const {
    plans,
    activePlan,
    draftPlan,
    isLoading: isMealPlanLoading,
    isFetching: isMealPlanFetching,
    saveDraftPlan,
    rescalePlanCalories,
    startPlan,
    duplicatePlan,
    archivePlan,
    pausePlan,
    removePlan,
    isSavingDraft,
    isDuplicatingPlan,
    isArchivingPlan,
  } = useMealPlan();

  const {
    currentPlan,
    orderedPlans,
    planInsightsMap,
    selectedPlanId,
    setSelectedPlanId,
  } = useNutritionPlanSelection({
    activePlan,
    draftPlan,
    plans,
  });
  const isGoalLoadingState =
    user?.onboardingCompleted &&
    !hasServerGoals &&
    (isGoalsLoading || isGoalsFetching);
  const calorieGoalMeta = React.useMemo(() => {
    if (isGoalLoadingState) {
      return {
        label: "Profil maqsadi",
        description: "Kaloriya nishoni profilingizdan qayta hisoblanmoqda",
        tone: "loading",
      };
    }

    if (user?.onboardingCompleted && goalSource !== "fallback") {
      return {
        label: "Shaxsiy maqsad",
        description: "Ovqat rejalari shu limitga moslanadi",
        tone: "personalized",
      };
    }

    return {
      label: "Standart maqsad",
      description: "Health settings ichida xohlagan payt yangilashingiz mumkin",
      tone: "default",
    };
  }, [goalSource, isGoalLoadingState, user?.onboardingCompleted]);

  const saveKanban = async (newKanban) => {
    const nextDays = normalizeMealPlanDays(newKanban);

    if (currentPlan?.status === "active") {
      await startPlan({ ...currentPlan, days: nextDays });
      return;
    }

    await saveDraftPlan({
      ...(currentPlan || {}),
      name:
        currentPlan?.name ||
        `Qo'lda reja ${new Date().toLocaleDateString("uz-UZ")}`,
      source: currentPlan?.source || "manual",
      days: nextDays,
    });
  };

  const {
    isCalendarOpen,
    setIsCalendarOpen,
    isBuilderOpen,
    setIsBuilderOpen,
    builderInitialData,
    setBuilderInitialData,
    isShoppingOpen,
    setIsShoppingOpen,
    isAIOpen,
    setIsAIOpen,
    isPlansDrawerOpen,
    setIsPlansDrawerOpen,
    isTemplateLibraryOpen,
    setIsTemplateLibraryOpen,
    isGoalWizardOpen,
    setIsGoalWizardOpen,
    isActionDrawerOpen,
    setIsActionDrawerOpen,
    actionDrawerInitialNested,
    setActionDrawerInitialNested,
    isCancelPlanOpen,
    setIsCancelPlanOpen,
    isPlanMetaOpen,
    setIsPlanMetaOpen,
    planMetaMode,
    setPlanMetaMode,
    planMetaShouldOpenBuilder,
    setPlanMetaShouldOpenBuilder,
    planMetaName,
    setPlanMetaName,
    planMetaDescription,
    setPlanMetaDescription,
    planMetaBudgetAmount,
    setPlanMetaBudgetAmount,
    planMetaBudgetPeriod,
    setPlanMetaBudgetPeriod,
    planMetaBudgetCurrency,
    setPlanMetaBudgetCurrency,
    isSavedMealsOpen,
    setIsSavedMealsOpen,
    mealTransferContext,
    setMealTransferContext,
    selectedMealTypeForAdd,
    setSelectedMealTypeForAdd,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    selectedScanId,
    setSelectedScanId,
    isSavingInlineScan,
    setIsSavingInlineScan,
    duplicateMealPrompt,
    setDuplicateMealPrompt,
  } = useNutritionDrawerState();
  const {
    templates: mealPlanTemplates,
    isLoading: isMealPlanTemplatesLoading,
    isFetching: isMealPlanTemplatesFetching,
  } = useMealPlanTemplates({
    enabled: entryView === "plans",
  });

  React.useEffect(() => {
    const state = location.state;

    if (!state?.openMealPlansDrawer && !state?.openMealPlanBuilder) {
      return;
    }

    const requestedPlan =
      (state.planId && find(plans, (plan) => plan.id === state.planId)) || null;
    const fallbackPlan = activePlan || draftPlan || plans[0] || null;
    const targetPlan = requestedPlan || fallbackPlan;

    if (state.openMealPlanBuilder) {
      if (!targetPlan && (isMealPlanLoading || isMealPlanFetching)) {
        return;
      }

      if (targetPlan?.id) {
        setSelectedPlanId(targetPlan.id);
      }
      setIsPlansDrawerOpen(false);
      setBuilderInitialData(getPlanBuilderData(targetPlan));
      setIsBuilderOpen(true);
    } else {
      setIsPlansDrawerOpen(true);

      if (state.planId) {
        setSelectedPlanId(state.planId);
      }
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [
    activePlan,
    draftPlan,
    isMealPlanFetching,
    isMealPlanLoading,
    location.pathname,
    location.search,
    location.state,
    navigate,
    plans,
  ]);
  const planMetaOpenTimerRef = React.useRef(null);
  const [mealFilter, setMealFilter] = React.useState("all");
  const [sourceFilters, setSourceFilters] = React.useState([]);
  const [mealSearch, setMealSearch] = React.useState("");
  const [calorieRange, setCalorieRange] = React.useState(
    CALORIE_FILTER_DEFAULT,
  );
  const [filterDateRange, setFilterDateRange] = React.useState({
    start: "",
    end: "",
  });
  const [pendingScans, setPendingScans] = React.useState([]);

  const handleOpenAiGenerator = React.useCallback(() => {
    setIsPlansDrawerOpen(false);
    setIsAIOpen(true);
  }, []);

  const handleOpenTemplateLibrary = React.useCallback(() => {
    setIsPlansDrawerOpen(false);
    setIsTemplateLibraryOpen(true);
  }, []);

  React.useEffect(() => {
    return setMealDuplicateConfirmHandler(
      (context) =>
        new Promise((resolve) => {
          setDuplicateMealPrompt({ ...context, resolve });
        }),
    );
  }, []);

  const handleAiGenerated = (normalizedPlan) => {
    setSelectedPlanId(normalizedPlan.id);
    setBuilderInitialData(getPlanBuilderData(normalizedPlan));
    setIsBuilderOpen(true);
  };

  React.useEffect(() => {
    return () => {
      if (planMetaOpenTimerRef.current) {
        window.clearTimeout(planMetaOpenTimerRef.current);
      }
    };
  }, []);

  const schedulePlanMetaDrawerOpen = React.useCallback((callback) => {
    if (planMetaOpenTimerRef.current) {
      window.clearTimeout(planMetaOpenTimerRef.current);
    }

    planMetaOpenTimerRef.current = window.setTimeout(() => {
      planMetaOpenTimerRef.current = null;
      callback();
    }, 180);
  }, []);

  const handleActivateTemplate = React.useCallback(
    async (template) => {
      if (!template?.id) {
        return null;
      }

      if (template.isCompatible === false) {
        toast.error(
          getTemplateBlockingReasonSummary(template) ||
            "Bu shablon sizning cheklovlaringizga mos kelmaydi.",
        );
        return null;
      }

      try {
        const nextState = await startPlan({
          ...template,
          source: "template",
          sourceTemplateId: template.id,
        });
        const activatedPlan =
          nextState?.activePlan ||
          find(
            nextState?.plans,
            (plan) =>
              plan.status === "active" &&
              plan.sourceTemplateId === template.id,
          ) ||
          null;

        if (activatedPlan?.id) {
          setSelectedPlanId(activatedPlan.id);
        }

        setIsPlansDrawerOpen(false);
        setIsTemplateLibraryOpen(false);
        toast.success("Shablon reja faollashtirildi");
        return nextState;
      } catch (error) {
        toast.error(
          getTemplateBlockingErrorMessage(
            error,
            "Shablon rejani faollashtirib bo'lmadi",
          ),
        );
        return null;
      }
    },
    [startPlan],
  );

  const handleTemplateSelected = React.useCallback(
    async (template) => {
      await handleActivateTemplate(template);
    },
    [handleActivateTemplate],
  );

  const openPlanMetaCreateDrawer = React.useCallback(() => {
    const budgetDefaults = getPlanBudgetFormDefaults();

    setPlanMetaMode("create");
    setPlanMetaShouldOpenBuilder(true);
    setPlanMetaName(`Qo'lda reja ${new Date().toLocaleDateString("uz-UZ")}`);
    setPlanMetaDescription("");
    setPlanMetaBudgetAmount(budgetDefaults.amount);
    setPlanMetaBudgetPeriod(budgetDefaults.period);
    setPlanMetaBudgetCurrency(budgetDefaults.currency);
    setIsPlansDrawerOpen(false);
    schedulePlanMetaDrawerOpen(() => {
      setIsPlanMetaOpen(true);
    });
  }, [
    schedulePlanMetaDrawerOpen,
    setPlanMetaBudgetAmount,
    setPlanMetaBudgetCurrency,
    setPlanMetaBudgetPeriod,
  ]);

  const handleOpenBuilderManual = () => {
    setIsCancelPlanOpen(false);
    if (!currentPlan) {
      openPlanMetaCreateDrawer();
      return;
    }

    setIsPlansDrawerOpen(false);
    setBuilderInitialData(getPlanBuilderData(currentPlan));
    setIsBuilderOpen(true);
  };

  const handleActivatePlan = React.useCallback(
    async (plan) => {
      if (!plan?.id) {
        return;
      }

      setSelectedPlanId(plan.id);

      if (plan.status === "active") {
        setIsPlansDrawerOpen(false);
        return;
      }

      try {
        await startPlan(plan);
        setIsPlansDrawerOpen(false);
        toast.success("Reja faollashtirildi");
      } catch (error) {
        toast.error(
          getTemplateBlockingErrorMessage(
            error,
            "Rejani faollashtirib bo'lmadi",
          ),
        );
      }
    },
    [startPlan],
  );

  const handleOpenPlanActions = React.useCallback(
    (plan) => {
      if (!plan?.id) {
        return;
      }

      setSelectedPlanId(plan.id);
      setIsPlansDrawerOpen(false);
      schedulePlanMetaDrawerOpen(() => {
        setIsCancelPlanOpen(true);
      });
    },
    [schedulePlanMetaDrawerOpen],
  );

  const handleRemovePlanFromCard = React.useCallback(
    async (plan) => {
      if (!plan?.id) {
        return;
      }

      try {
        await removePlan(plan.id);
        if (selectedPlanId === plan.id) {
          setSelectedPlanId(null);
        }
        toast.success("Reja o'chirildi");
      } catch {
        toast.error("Rejani o'chirib bo'lmadi");
      }
    },
    [removePlan, selectedPlanId],
  );

  const openPlanMetaEditDrawer = React.useCallback(
    (openBuilderAfter = false) => {
      if (!currentPlan) {
        return;
      }

      const budgetDefaults = getPlanBudgetFormDefaults(currentPlan);

      setPlanMetaMode("edit");
      setPlanMetaShouldOpenBuilder(openBuilderAfter);
      setPlanMetaName(currentPlan.name || "Mening rejam");
      setPlanMetaDescription(currentPlan.description || "");
      setPlanMetaBudgetAmount(budgetDefaults.amount);
      setPlanMetaBudgetPeriod(budgetDefaults.period);
      setPlanMetaBudgetCurrency(budgetDefaults.currency);
      setIsCancelPlanOpen(false);
      schedulePlanMetaDrawerOpen(() => {
        setIsPlanMetaOpen(true);
      });
    },
    [
      currentPlan,
      schedulePlanMetaDrawerOpen,
      setPlanMetaBudgetAmount,
      setPlanMetaBudgetCurrency,
      setPlanMetaBudgetPeriod,
    ],
  );

  const handleSubmitPlanMeta = React.useCallback(async () => {
    const safeName = trim(planMetaName);
    const safeDescription = trim(planMetaDescription) || null;
    const budgetPayload = buildPlanMetaBudgetPayload({
      amount: planMetaBudgetAmount,
      period: planMetaBudgetPeriod,
      currency: planMetaBudgetCurrency,
      mode: planMetaMode,
    });

    if (!safeName) {
      return;
    }

    try {
      if (planMetaMode === "edit") {
        if (!currentPlan?.id) {
          return;
        }

        const nextState = await saveDraftPlan({
          ...currentPlan,
          name: safeName,
          description: safeDescription,
          days: currentPlan.days || [],
          source: currentPlan.source || "manual",
          ...budgetPayload,
        });
        const updatedPlan =
          find(nextState?.plans, (plan) => plan.id === currentPlan.id) ||
          nextState?.activePlan ||
          nextState?.draftPlan ||
          null;

        if (updatedPlan?.id) {
          setSelectedPlanId(updatedPlan.id);
        }

        setIsPlanMetaOpen(false);
        if (planMetaShouldOpenBuilder && updatedPlan) {
          setBuilderInitialData(getPlanBuilderData(updatedPlan));
          schedulePlanMetaDrawerOpen(() => {
            setIsBuilderOpen(true);
          });
        }
        toast.success("Reja ma'lumotlari saqlandi");
        return;
      }

      const nextState = await saveDraftPlan({
        name: safeName,
        description: safeDescription,
        source: "manual",
        mealCount: currentPlan?.mealCount || 4,
        days: [],
        ...budgetPayload,
      });
      const nextPlan =
        nextState?.draftPlan ||
        find(
          nextState?.plans,
          (plan) => plan.status === "draft" && plan.name === safeName,
        ) ||
        nextState?.plans?.[0] ||
        null;

      if (nextPlan?.id) {
        setSelectedPlanId(nextPlan.id);
      }

      setBuilderInitialData(getPlanBuilderData(nextPlan));
      setIsPlanMetaOpen(false);
      schedulePlanMetaDrawerOpen(() => {
        setIsBuilderOpen(true);
      });
      toast.success("Yangi reja yaratildi");
    } catch {
      toast.error(
        planMetaMode === "edit"
          ? "Reja ma'lumotlarini saqlab bo'lmadi"
          : "Rejani yaratib bo'lmadi",
      );
    }
  }, [
    currentPlan,
    planMetaBudgetAmount,
    planMetaBudgetCurrency,
    planMetaBudgetPeriod,
    planMetaDescription,
    planMetaMode,
    planMetaName,
    planMetaShouldOpenBuilder,
    saveDraftPlan,
    schedulePlanMetaDrawerOpen,
  ]);

  const handleDuplicateCurrentPlan = React.useCallback(
    async (openBuilderAfter = false) => {
      if (!currentPlan?.id) {
        return;
      }

      try {
        const nextState = await duplicatePlan(currentPlan.id);
        const duplicatedPlan =
          find(
            nextState?.plans,
            (plan) =>
              plan.id !== currentPlan.id &&
              plan.status === "draft" &&
              plan.name?.startsWith(currentPlan.name || ""),
          ) || nextState?.draftPlan;

        if (duplicatedPlan?.id) {
          setSelectedPlanId(duplicatedPlan.id);
        }

        setIsCancelPlanOpen(false);

        if (openBuilderAfter && duplicatedPlan) {
          setIsPlansDrawerOpen(false);
          setBuilderInitialData(getPlanBuilderData(duplicatedPlan));
          setIsBuilderOpen(true);
          toast.success("Reja nusxalanib, tahrirlash uchun ochildi");
          return;
        }

        toast.success("Reja nusxalandi");
      } catch {
        toast.error("Rejani nusxalab bo'lmadi");
      }
    },
    [currentPlan, duplicatePlan],
  );

  const handleArchiveCurrentPlan = React.useCallback(async () => {
    if (!currentPlan?.id) {
      return;
    }

    try {
      const nextState = await archivePlan(currentPlan.id);
      const nextSelectable =
        nextState?.activePlan ||
        nextState?.draftPlan ||
        find(nextState?.plans, (plan) => plan.id !== currentPlan.id) ||
        null;

      setSelectedPlanId(nextSelectable?.id || currentPlan.id);
      setIsCancelPlanOpen(false);
      toast.success("Reja arxivlandi");
    } catch {
      toast.error("Rejani arxivlab bo'lmadi");
    }
  }, [archivePlan, currentPlan]);

  const handleRescaleCurrentPlan = React.useCallback(
    async (planId) => {
      const targetPlanId = planId || currentPlan?.id;

      if (!targetPlanId) {
        return;
      }

      try {
        const nextState = await rescalePlanCalories(targetPlanId);
        const updatedPlan =
          find(nextState?.plans, (plan) => plan.id === targetPlanId) ||
          nextState?.activePlan ||
          nextState?.draftPlan ||
          null;

        if (updatedPlan?.id) {
          setSelectedPlanId(updatedPlan.id);
        }

        toast.success("Reja joriy kaloriyaga moslandi", {
          description: getPlanRescaleExplanation(updatedPlan) || undefined,
        });
      } catch {
        toast.error("Rejani kaloriyaga moslab bo'lmadi");
      }
    },
    [currentPlan?.id, rescalePlanCalories],
  );

  const todayKey = getTodayKey();
  const {
    date,
    setDate,
    dateKey,
    selectedDateLabel,
    isPastDate,
    selectedDay,
    yesterdayKey,
    dateShortcuts,
    handleDateShortcutChange,
    handleOverviewDateChange,
  } = useNutritionDateState({
    location,
    navigate,
    todayKey,
  });
  const { dayData, isLoading: isDayLoading } = useDailyTrackingDay(dateKey);
  const {
    dashboard: nutritionDashboard,
    data: nutritionDashboardResponse,
  } = useNutritionDashboard(dateKey, {
    enabled: entryView === "home",
  });
  const { foodMap } = useFoodCatalog();
  const { analyzeMealImageDraft, uploadMealCapture } = useFoodScan();
  const { refetch: refetchYesterday } = useDailyTrackingDay(yesterdayKey, {
    enabled: false,
  });
  const workoutCalorieAdjustment = React.useMemo(() => {
    if (
      !workoutCalorieAdjustmentEnabled ||
      dateKey !== todayKey ||
      !dayData.burnedCalories
    ) {
      return 0;
    }

    return Math.max(0, Math.round(toNumber(dayData.burnedCalories) || 0));
  }, [
    dateKey,
    dayData.burnedCalories,
    todayKey,
    workoutCalorieAdjustmentEnabled,
  ]);
  const effectiveGoals = React.useMemo(
    () =>
      workoutCalorieAdjustment > 0
        ? {
            ...goals,
            calories: toNumber(goals.calories || 0) + workoutCalorieAdjustment,
          }
        : goals,
    [goals, workoutCalorieAdjustment],
  );

  React.useEffect(() => {
    if (!workoutCalorieAdjustment) {
      return;
    }

    const baseCalories = toNumber(goals.calories || 0);
    const toastKey = `${dateKey}:${baseCalories}:${workoutCalorieAdjustment}`;
    const storageKey = "liveon:nutrition:workout-calorie-adjustment-toast:v1";

    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(storageKey) === toastKey
    ) {
      return;
    }

    toast.success(
      `Bugun ${workoutCalorieAdjustment} kcal yoqdingiz — maqsadingiz ${baseCalories} → ${
        baseCalories + workoutCalorieAdjustment
      } kcal ga ko'paytirildi`,
    );

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, toastKey);
    }
  }, [dateKey, goals.calories, workoutCalorieAdjustment]);

  const meals = React.useMemo(
    () => ({
      breakfast: map(dayData.meals.breakfast, (item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
      lunch: map(dayData.meals.lunch, (item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
      dinner: map(dayData.meals.dinner, (item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
      snack: map(dayData.meals.snack, (item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
    }),
    [dayData.meals, foodMap],
  );

  const processInlineScan = React.useCallback(
    async (scan) => {
      const scanId = scan.id;

      setPendingScans((current) =>
        map(current, (item) =>
          item.id === scanId
            ? { ...item, status: "scanning", error: null }
            : item,
        ),
      );

      try {
        const uploadedImageUrl =
          scan.imageUrl || (await uploadMealCapture(scan.imageDataUrl));
        const response = await analyzeMealImageDraft({
          imageUrl: uploadedImageUrl,
        });
        const draftItems = map(
          isArray(response?.items) ? response.items : [],
          (item) => ({
            ...item,
            imageUrl: uploadedImageUrl || scan.imageDataUrl,
          }),
        );

        if (draftItems.length === 0) {
          setPendingScans((current) =>
            map(current, (item) =>
              item.id === scanId
                ? {
                    ...item,
                    imageUrl: uploadedImageUrl,
                    status: "error",
                    error: "AI bu rasm uchun draft tayyorlay olmadi.",
                  }
                : item,
            ),
          );
          return;
        }

        setPendingScans((current) =>
          current.flatMap((item) => {
            if (item.id !== scanId) {
              return [item];
            }

            return map(draftItems, (draftItem, index) => ({
              ...item,
              id: index === 0 ? scanId : `${scanId}-${index + 1}`,
              groupId: item.groupId || scanId,
              imageUrl: uploadedImageUrl,
              status: "draft",
              item: draftItem,
              error: null,
            }));
          }),
        );
      } catch (error) {
        setPendingScans((current) =>
          map(current, (item) =>
            item.id === scanId
              ? {
                  ...item,
                  status: "error",
                  error:
                    error?.response?.data?.message ||
                    "Ovqatni AI orqali aniqlab bo'lmadi",
                }
              : item,
          ),
        );
      }
    },
    [analyzeMealImageDraft, uploadMealCapture],
  );

  const pendingScanFoodsByType = React.useMemo(() => {
    return buildPendingScanFoodsByType(pendingScans);
  }, [pendingScans]);

  const selectedScan = React.useMemo(
    () => find(pendingScans, (scan) => scan.id === selectedScanId) || null,
    [pendingScans, selectedScanId],
  );
  const selectedScanDraftGroup = React.useMemo(() => {
    if (!selectedScan) return [];
    const groupId = selectedScan.groupId || selectedScan.id;
    return filter(
      pendingScans,
      (scan) =>
        (scan.groupId || scan.id) === groupId && scan.status === "draft",
    );
  }, [pendingScans, selectedScan]);

  const roundedTotals = React.useMemo(
    () => buildNutritionTotals(meals),
    [meals],
  );
  const waterConsumedMl = React.useMemo(() => {
    return getWaterConsumedMl({ dayData, goals });
  }, [dayData, goals]);

  const {
    handleAddWaterCup,
    handleBulkRemoveFoods,
    handleConfirmMealTransfer,
    handleCopyFromYesterday,
    handleCopyMealToToday,
    handleLogPlanned,
    handleMealImageUpload,
    handleRemoveFood,
    handleTogglePlanned,
    handleTransferMeal,
    handleUpdateMeal,
  } = useNutritionMealActions({
    addMealAction,
    addWaterCup,
    date,
    dateKey,
    mealTransferContext,
    meals,
    patchMeal,
    refetchYesterday,
    removeMealAction,
    setMealTransferContext,
    todayKey,
  });

  const handleOpenQuickAddMethod = React.useCallback(
    (method) => {
      setActionDrawerInitialNested(method === "recent" ? "catalog" : method);
      setIsActionDrawerOpen(true);
    },
    [setActionDrawerInitialNested, setIsActionDrawerOpen],
  );

  const handleOpenQuickSavedMeals = React.useCallback(() => {
    setActionDrawerInitialNested(null);
    setIsSavedMealsOpen(true);
  }, [setActionDrawerInitialNested, setIsSavedMealsOpen]);

  const handleOpenPlanShopping = React.useCallback(
    (planId = currentPlan?.id) => {
      if (!planId) return;

      setSelectedPlanId(planId);
      setIsShoppingOpen(true);
    },
    [currentPlan?.id, setIsShoppingOpen],
  );

  const currentPlanDayStatus = React.useMemo(
    () => getPlanDayStatus(currentPlan, date),
    [currentPlan, date],
  );

  const currentDayPlan = React.useMemo(
    () => resolvePlanColumnsForDate(currentPlan, date, selectedDay),
    [currentPlan, date, selectedDay],
  );

  const activeMealType = getActiveMealType();

  const plannedByType = React.useMemo(() => {
    return buildPlannedByType(currentDayPlan);
  }, [currentDayPlan]);

  const handleSaveBuilder = async (newKanban) => {
    try {
      const nextState = await saveKanban(newKanban);
      const nextCurrentPlan =
        (currentPlan?.status === "active"
          ? nextState?.activePlan
          : find(nextState?.plans, (plan) => plan.id === currentPlan?.id) ||
            nextState?.draftPlan) || null;
      if (nextCurrentPlan?.id) {
        setSelectedPlanId(nextCurrentPlan.id);
      }
      setIsBuilderOpen(false);
      setBuilderInitialData(null);
      toast.success("Reja muvaffaqiyatli saqlandi!");
    } catch {
      toast.error("Rejani saqlab bo'lmadi");
    }
  };

  const sortedMealSections = React.useMemo(() => {
    return buildSortedMealSections({
      currentDayPlan,
      meals,
      pendingScanFoodsByType,
      plannedByType,
    });
  }, [currentDayPlan, meals, pendingScanFoodsByType, plannedByType]);

  const filteredMealSections = React.useMemo(() => {
    return filterMealSections({
      sortedMealSections,
      mealFilter,
      sourceFilters,
      mealSearch,
      calorieRange,
      filterDateRange,
      dateKey,
    });
  }, [
    calorieRange,
    dateKey,
    filterDateRange.end,
    filterDateRange.start,
    mealFilter,
    mealSearch,
    sortedMealSections,
    sourceFilters,
  ]);

  const activeNutritionFilterCount = React.useMemo(() => {
    return getActiveNutritionFilterCount({
      sourceFilters,
      mealSearch,
      calorieRange,
      filterDateRange,
    });
  }, [
    calorieRange,
    filterDateRange.end,
    filterDateRange.start,
    mealSearch,
    sourceFilters.length,
  ]);

  const clearNutritionFilters = React.useCallback(() => {
    setSourceFilters([]);
    setMealSearch("");
    setCalorieRange(CALORIE_FILTER_DEFAULT);
    setFilterDateRange({ start: "", end: "" });
  }, []);

  const handleRetryScan = React.useCallback(
    (food) => {
      const scan = find(pendingScans, (item) => item.id === food?.scanId);
      if (!scan) return;
      void processInlineScan(scan);
    },
    [pendingScans, processInlineScan],
  );

  const handleRemoveScan = React.useCallback((scanId) => {
    setPendingScans((current) => filter(current, (scan) => scan.id !== scanId));
    setSelectedScanId((current) => (current === scanId ? null : current));
  }, []);

  const handleOpenDraftScan = React.useCallback((food) => {
    if (!food?.scanId) return;
    setSelectedScanId(food.scanId);
  }, []);

  const handleConfirmInlineScan = React.useCallback(
    async (draft) => {
      if (!selectedScan || !draft) return;

      setIsSavingInlineScan(true);
      try {
        const manualNutrition = draft.manualNutritionOverride;
        const mealPayload = manualNutrition
          ? {
              name: draft.title || "Ovqat",
              source: "camera",
              qty: 1,
              grams: Math.max(0, toNumber(draft.manualGramsOverride) || 0),
              cal: Math.max(0, toNumber(manualNutrition.calories) || 0),
              protein: Math.max(0, toNumber(manualNutrition.protein) || 0),
              carbs: Math.max(0, toNumber(manualNutrition.carbs) || 0),
              fat: Math.max(0, toNumber(manualNutrition.fat) || 0),
              fiber: Math.max(0, toNumber(manualNutrition.fiber) || 0),
              image: selectedScan.imageUrl || selectedScan.imageDataUrl,
            }
          : buildMealPayloadFromDraft(draft, {
              source: "camera",
              image: selectedScan.imageUrl || selectedScan.imageDataUrl,
            });

        await addMealAction(
          selectedScan.dateKey || dateKey,
          selectedScan.mealType || "breakfast",
          mealPayload,
        );
        setPendingScans((current) =>
          filter(current, (scan) => scan.id !== selectedScan.id),
        );
        setSelectedScanId(null);
        toast.success(`${draft.title || "Ovqat"} qo'shildi`);
      } catch {
        toast.error("AI topgan ovqatni saqlab bo'lmadi");
      } finally {
        setIsSavingInlineScan(false);
      }
    },
    [addMealAction, dateKey, selectedScan],
  );

  const handleConfirmAllInlineScans = React.useCallback(async () => {
    if (!selectedScanDraftGroup.length) return;

    setIsSavingInlineScan(true);
    try {
      for (const scan of selectedScanDraftGroup) {
        if (!scan.item) continue;

        await addMealAction(
          scan.dateKey || dateKey,
          scan.mealType || "breakfast",
          buildMealPayloadFromDraft(scan.item, {
            source: "camera",
            image: scan.imageUrl || scan.imageDataUrl,
          }),
        );
      }

      const idsToRemove = new Set(
        map(selectedScanDraftGroup, (scan) => scan.id),
      );
      setPendingScans((current) =>
        filter(current, (scan) => !idsToRemove.has(scan.id)),
      );
      setSelectedScanId(null);
      toast.success(`${selectedScanDraftGroup.length} ta ovqat qo'shildi`);
    } catch {
      toast.error("AI topgan ovqatlarni saqlab bo'lmadi");
    } finally {
      setIsSavingInlineScan(false);
    }
  }, [addMealAction, dateKey, selectedScanDraftGroup]);

  const sharedViewProps = {
    date,
    setDate: handleOverviewDateChange,
    dateKey,
    todayKey,
    selectedDateLabel,
    dateShortcuts,
    onSelectDateShortcut: handleDateShortcutChange,
    onOpenCalendar: () => setIsCalendarOpen(true),
    plans,
    currentPlan,
    currentPlanDayStatus,
    goals: effectiveGoals,
    roundedTotals,
    waterConsumedMl,
    waterGoalMl: toNumber(effectiveGoals.waterMl || 2500),
    calorieGoalMeta,
    isGoalLoadingState,
    mealConfig: MEAL_CONFIG,
    mealFilter,
    setMealFilter,
    sourceFilters,
    mealSearch,
    setMealSearch,
    activeNutritionFilterCount,
    setIsFilterDrawerOpen,
    filteredMealSections,
    activeMealType,
    setSelectedMealTypeForAdd,
    setIsActionDrawerOpen,
    onOpenQuickAddMethod: handleOpenQuickAddMethod,
    onOpenSavedMeals: handleOpenQuickSavedMeals,
    onOpenPlanShopping: handleOpenPlanShopping,
    setIsSavedMealsOpen,
    setIsPlansDrawerOpen,
    onAddWaterCup: handleAddWaterCup,
    onOpenGoalWizard: () => setIsGoalWizardOpen(true),
    handleRemoveFood,
    handleBulkRemoveFoods,
    onTransferMeal: handleTransferMeal,
    onCopyMealToToday: handleCopyMealToToday,
    handleLogPlanned,
    handleTogglePlanned,
    handleCopyFromYesterday,
    onImageUpload: handleMealImageUpload,
    onUpdateMeal: handleUpdateMeal,
    onRetryScan: handleRetryScan,
    onRemoveScan: handleRemoveScan,
    onOpenDraftScan: handleOpenDraftScan,
    isOnline,
    isDayLoading,
    isPastDate,
    burnedCalories: dayData.burnedCalories,
    nutritionDashboard: nutritionDashboardResponse ? nutritionDashboard : null,
  };

  return (
    <PageTransition mode="fade">
      {entryView === "report" ? (
        <NutritionReportView
          date={date}
          setDate={setDate}
          currentPlan={currentPlan}
          roundedTotals={roundedTotals}
          goals={effectiveGoals}
          isGoalLoadingState={isGoalLoadingState}
          calorieGoalMeta={calorieGoalMeta}
        />
      ) : entryView === "plans" ? (
        <NutritionPlansView
          orderedPlans={orderedPlans}
          currentPlan={currentPlan}
          goals={effectiveGoals}
          currentPlanDayStatus={currentPlanDayStatus}
          planInsightsMap={planInsightsMap}
          getPlanStatusMeta={getPlanStatusMeta}
          getPlanSourceMeta={getPlanSourceMeta}
          onActivatePlan={handleActivatePlan}
          onOpenPlanActions={handleOpenPlanActions}
          onRemovePlan={handleRemovePlanFromCard}
          onSelectPlanForShopping={(planId) => {
            setSelectedPlanId(planId);
            setIsShoppingOpen(true);
          }}
          onCreateManual={openPlanMetaCreateDrawer}
          onCreateAI={handleOpenAiGenerator}
          onCreateFromTemplate={handleOpenTemplateLibrary}
          onActivateTemplate={handleActivateTemplate}
          templates={mealPlanTemplates}
          isTemplateLoading={
            isMealPlanTemplatesLoading || isMealPlanTemplatesFetching
          }
          onRescalePlanCalories={handleRescaleCurrentPlan}
        />
      ) : (
        <NutritionHomeView {...sharedViewProps} />
      )}

      <NutritionDrawers
        activeFilterCount={activeNutritionFilterCount}
        addMealAction={addMealAction}
        addMealsBatchAction={addMealsBatchAction}
        actionDrawerInitialNested={actionDrawerInitialNested}
        builderInitialData={builderInitialData}
        calorieRange={calorieRange}
        clearNutritionFilters={clearNutritionFilters}
        currentPlan={currentPlan}
        dateKey={dateKey}
        duplicateMealPrompt={duplicateMealPrompt}
        effectiveGoals={effectiveGoals}
        filterDateRange={filterDateRange}
        getPlanSourceMeta={getPlanSourceMeta}
        getPlanStatusMeta={getPlanStatusMeta}
        groupDraftCount={selectedScanDraftGroup.length}
        handleActivatePlan={handleActivatePlan}
        handleAiGenerated={handleAiGenerated}
        handleArchiveCurrentPlan={handleArchiveCurrentPlan}
        handleConfirmAllInlineScans={handleConfirmAllInlineScans}
        handleConfirmInlineScan={handleConfirmInlineScan}
        handleConfirmMealTransfer={handleConfirmMealTransfer}
        handleDuplicateCurrentPlan={handleDuplicateCurrentPlan}
        handleOpenAiGenerator={handleOpenAiGenerator}
        handleOpenBuilderManual={handleOpenBuilderManual}
        handleOpenPlanActions={handleOpenPlanActions}
        handleOpenTemplateLibrary={handleOpenTemplateLibrary}
        handleRemovePlanFromCard={handleRemovePlanFromCard}
        handleRemoveScan={handleRemoveScan}
        handleSaveBuilder={handleSaveBuilder}
        handleSubmitPlanMeta={handleSubmitPlanMeta}
        handleTemplateSelected={handleTemplateSelected}
        isActionDrawerOpen={isActionDrawerOpen}
        isAIOpen={isAIOpen}
        isArchivingPlan={isArchivingPlan}
        isBuilderOpen={isBuilderOpen}
        isCancelPlanOpen={isCancelPlanOpen}
        isDuplicatingPlan={isDuplicatingPlan}
        isFilterDrawerOpen={isFilterDrawerOpen}
        isGoalWizardOpen={isGoalWizardOpen}
        isMealPlanFetching={isMealPlanFetching}
        isMealPlanLoading={isMealPlanLoading}
        isOnline={isOnline}
        isPlanMetaOpen={isPlanMetaOpen}
        isPlansDrawerOpen={isPlansDrawerOpen}
        isSavedMealsOpen={isSavedMealsOpen}
        isSavingDraft={isSavingDraft}
        isSavingInlineScan={isSavingInlineScan}
        isShoppingOpen={isShoppingOpen}
        isTemplateLibraryOpen={isTemplateLibraryOpen}
        mealSearch={mealSearch}
        mealTransferContext={mealTransferContext}
        onCreateManualPlan={openPlanMetaCreateDrawer}
        onOpenPlanMetaEdit={openPlanMetaEditDrawer}
        orderedPlans={orderedPlans}
        pausePlan={pausePlan}
        planInsightsMap={planInsightsMap}
        planMetaDescription={planMetaDescription}
        planMetaBudgetAmount={planMetaBudgetAmount}
        planMetaBudgetPeriod={planMetaBudgetPeriod}
        planMetaBudgetCurrency={planMetaBudgetCurrency}
        planMetaMode={planMetaMode}
        planMetaName={planMetaName}
        planMetaShouldOpenBuilder={planMetaShouldOpenBuilder}
        removePlan={removePlan}
        selectedDay={selectedDay}
        selectedMealTypeForAdd={selectedMealTypeForAdd}
        selectedScan={selectedScan}
        setBuilderInitialData={setBuilderInitialData}
        setCalorieRange={setCalorieRange}
        setDuplicateMealPrompt={setDuplicateMealPrompt}
        setFilterDateRange={setFilterDateRange}
        setActionDrawerInitialNested={setActionDrawerInitialNested}
        setIsActionDrawerOpen={setIsActionDrawerOpen}
        setIsAIOpen={setIsAIOpen}
        setIsBuilderOpen={setIsBuilderOpen}
        setIsCancelPlanOpen={setIsCancelPlanOpen}
        setIsFilterDrawerOpen={setIsFilterDrawerOpen}
        setIsGoalWizardOpen={setIsGoalWizardOpen}
        setIsPlanMetaOpen={setIsPlanMetaOpen}
        setIsPlansDrawerOpen={setIsPlansDrawerOpen}
        setIsSavedMealsOpen={setIsSavedMealsOpen}
        setIsShoppingOpen={setIsShoppingOpen}
        setIsTemplateLibraryOpen={setIsTemplateLibraryOpen}
        setMealSearch={setMealSearch}
        setMealTransferContext={setMealTransferContext}
        setPlanMetaDescription={setPlanMetaDescription}
        setPlanMetaBudgetAmount={setPlanMetaBudgetAmount}
        setPlanMetaBudgetPeriod={setPlanMetaBudgetPeriod}
        setPlanMetaBudgetCurrency={setPlanMetaBudgetCurrency}
        setPlanMetaName={setPlanMetaName}
        setSelectedPlanId={setSelectedPlanId}
        setSelectedScanId={setSelectedScanId}
        setSourceFilters={setSourceFilters}
        sourceFilters={sourceFilters}
      />
      {entryView === "home" ? (
        <CalendarBottomDrawer
          open={isCalendarOpen}
          onOpenChange={setIsCalendarOpen}
          date={date}
          onChange={handleOverviewDateChange}
          title="Sana tanlang"
          description="Nutrition overview ma'lumotlari tanlangan kunga moslanadi."
        />
      ) : null}
    </PageTransition>
  );
};

const NutritionContentPage = (props) => (
  <ErrorBoundary fallback={<NutritionErrorFallback />}>
    <NutritionContent {...props} />
  </ErrorBoundary>
);

export default NutritionContentPage;
