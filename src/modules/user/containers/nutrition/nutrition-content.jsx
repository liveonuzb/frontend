import React from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useWorkoutCalorieAdjustmentPreference from "@/hooks/app/use-workout-calorie-adjustment";
import useMealPlan, {
  mealPlanDaysToKanban,
  normalizeMealPlanDays,
  useMealPlanTemplates,
} from "@/hooks/app/use-meal-plan";
import useNutritionDashboard from "@/hooks/app/use-nutrition-dashboard";
import {
  getTodayKey,
  normalizeDayData,
  setMealDuplicateConfirmHandler,
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import useFoodCatalog, {
  enrichTrackedMealItem,
  useFoodScan,
} from "@/hooks/app/use-food-catalog";
import { UndoIcon } from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import ErrorBoundary from "@/components/error-boundary/index.jsx";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import useOnlineStatus from "@/hooks/utils/use-online-status.js";
import { useLocation, useNavigate } from "react-router";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import {
  MEAL_CONFIG,
  MEAL_LABEL_TO_TYPE,
  MEAL_TYPES,
} from "@/modules/user/lib/meal-config";
import NutritionHomeView from "./views/home-view.jsx";
import NutritionPlansView from "./views/plans-view.jsx";
import NutritionReportView from "./views/report-view.jsx";
import NutritionDrawers from "./nutrition-drawers.jsx";
import {
  buildMealPayloadFromDraft,
  getDraftNutritionPreview,
} from "./meal-draft-review-utils.js";
import {
  getPlanDayStatus,
  resolvePlanColumnsForDate,
} from "./nutrition-plan-days.js";
import {
  getTemplateBlockingErrorMessage,
  getTemplateBlockingReasonSummary,
} from "./template-blocking-reasons.js";

import filter from "lodash/filter";
import find from "lodash/find";
import forEach from "lodash/forEach";
import isArray from "lodash/isArray";
import map from "lodash/map";
import orderBy from "lodash/orderBy";
import reduce from "lodash/reduce";
import some from "lodash/some";
import split from "lodash/split";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import lodashValues from "lodash/values";
import includes from "lodash/includes";
import keys from "lodash/keys";
import toPairs from "lodash/toPairs";
import flatten from "lodash/flatten";

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

const CALORIE_FILTER_DEFAULT = [0, 1000];

const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const getPlanInsights = (plan) => {
  const dayColumns = isArray(plan?.days)
    ? filter(map(plan.days, (day) => day?.meals), isArray)
    : filter(lodashValues(plan?.weeklyKanban || {}), isArray);

  const filledDays = filter(dayColumns, (columns) =>
    some(
      columns,
      (column) => isArray(column?.items) && column.items.length > 0,
    ),
  ).length;

  const totalItems = reduce(
    dayColumns,
    (sum, columns) => {
      return (
        sum +
        reduce(
          columns,
          (columnSum, column) => {
            return (
              columnSum + (isArray(column?.items) ? column.items.length : 0)
            );
          },
          0,
        )
      );
    },
    0,
  );

  return {
    filledDays,
    totalItems,
    updatedLabel: plan?.updatedAt
      ? new Date(plan.updatedAt).toLocaleDateString("uz-UZ")
      : null,
  };
};

const getPlanBuilderData = (plan) =>
  mealPlanDaysToKanban(plan?.days || plan?.weeklyKanban || []);

const getPlanStatusMeta = (status) => {
  if (status === "active") {
    return {
      label: "Faol reja",
      chipClassName: "text-green-600 dark:text-green-400",
      badgeClassName: "bg-green-500/10 text-green-600 dark:text-green-400",
    };
  }

  if (status === "archived") {
    return {
      label: "Arxivlangan reja",
      chipClassName: "text-slate-600 dark:text-slate-400",
      badgeClassName: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    };
  }

  return {
    label: "Saqlangan reja",
    chipClassName: "text-amber-600 dark:text-amber-400",
    badgeClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
};

const getPlanSourceMeta = (source) => {
  if (source === "ai") {
    return {
      label: "AI reja",
      badgeClassName:
        "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300",
    };
  }

  return {
    label: "Manual reja",
    badgeClassName:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  };
};

const normalizeSearchText = (value) => toLower(trim(String(value || "")));

const getMealDateKey = (food, fallbackDateKey) => {
  const value =
    food?.addedAt || food?.createdAt || food?.date || fallbackDateKey;
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return fallbackDateKey;
  }

  return parsed.toISOString().slice(0, 10);
};

const NutritionContent = ({ entryView = "home" }) => {
  const user = useAuthStore((state) => state.user);
  const isOnline = useOnlineStatus();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { openProfile } = useProfileOverlay();
  const location = useLocation();
  const navigate = useNavigate();
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

  const [selectedPlanId, setSelectedPlanId] = React.useState(null);

  React.useEffect(() => {
    if (plans.length === 0) {
      setSelectedPlanId(null);
      return;
    }

    if (selectedPlanId && some(plans, (plan) => plan.id === selectedPlanId)) {
      return;
    }

    setSelectedPlanId(activePlan?.id || draftPlan?.id || plans[0]?.id || null);
  }, [activePlan?.id, draftPlan?.id, plans, selectedPlanId]);

  const currentPlan = React.useMemo(() => {
    if (!plans.length) {
      return null;
    }

    return (
      find(plans, (plan) => plan.id === selectedPlanId) ||
      activePlan ||
      draftPlan ||
      plans[0] ||
      null
    );
  }, [activePlan, draftPlan, plans, selectedPlanId]);
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

  const planInsightsMap = React.useMemo(() => {
    return reduce(
      plans,
      (acc, plan) => {
        acc[plan.id] = getPlanInsights(plan);
        return acc;
      },
      {},
    );
  }, [plans]);
  const orderedPlans = React.useMemo(() => {
    const getStatusPriority = (plan) =>
      plan.status === "active" ? 0 : plan.status === "draft" ? 1 : 2;

    return orderBy(
      plans,
      [
        getStatusPriority,
        (plan) => new Date(plan.updatedAt || plan.createdAt || 0).getTime(),
      ],
      ["asc", "desc"],
    );
  }, [plans]);

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

  const [date, setDate] = React.useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [builderInitialData, setBuilderInitialData] = React.useState(null);
  const [isShoppingOpen, setIsShoppingOpen] = React.useState(false);
  const [isAIOpen, setIsAIOpen] = React.useState(false);
  const [isPlansDrawerOpen, setIsPlansDrawerOpen] = React.useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] =
    React.useState(false);
  const {
    templates: mealPlanTemplates,
    isLoading: isMealPlanTemplatesLoading,
    isFetching: isMealPlanTemplatesFetching,
  } = useMealPlanTemplates({
    enabled: entryView === "plans",
  });
  const [isGoalWizardOpen, setIsGoalWizardOpen] = React.useState(false);
  const [isActionDrawerOpen, setIsActionDrawerOpen] = React.useState(false);
  const [isCancelPlanOpen, setIsCancelPlanOpen] = React.useState(false);
  const [isPlanMetaOpen, setIsPlanMetaOpen] = React.useState(false);
  const [planMetaMode, setPlanMetaMode] = React.useState("create");
  const [planMetaShouldOpenBuilder, setPlanMetaShouldOpenBuilder] =
    React.useState(true);
  const [planMetaName, setPlanMetaName] = React.useState("");
  const [planMetaDescription, setPlanMetaDescription] = React.useState("");
  const [isSavedMealsOpen, setIsSavedMealsOpen] = React.useState(false);
  const [mealTransferContext, setMealTransferContext] = React.useState(null);

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
  const [selectedMealTypeForAdd, setSelectedMealTypeForAdd] =
    React.useState("breakfast");
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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [pendingScans, setPendingScans] = React.useState([]);
  const [selectedScanId, setSelectedScanId] = React.useState(null);
  const [isSavingInlineScan, setIsSavingInlineScan] = React.useState(false);
  const [duplicateMealPrompt, setDuplicateMealPrompt] = React.useState(null);
  const isPremiumActive = true;

  const openPremiumForAi = React.useCallback(() => {
    toast("AI generator premium tarifda ochiladi.");
    openProfile("premium");
  }, [openProfile]);

  const handleOpenAiGenerator = React.useCallback(() => {
    if (!isPremiumActive) {
      openPremiumForAi();
      return;
    }

    setIsPlansDrawerOpen(false);
    setIsAIOpen(true);
  }, [isPremiumActive, openPremiumForAi]);

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
    setPlanMetaMode("create");
    setPlanMetaShouldOpenBuilder(true);
    setPlanMetaName(`Qo'lda reja ${new Date().toLocaleDateString("uz-UZ")}`);
    setPlanMetaDescription("");
    setIsPlansDrawerOpen(false);
    schedulePlanMetaDrawerOpen(() => {
      setIsPlanMetaOpen(true);
    });
  }, [schedulePlanMetaDrawerOpen]);

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

      setPlanMetaMode("edit");
      setPlanMetaShouldOpenBuilder(openBuilderAfter);
      setPlanMetaName(currentPlan.name || "Mening rejam");
      setPlanMetaDescription(currentPlan.description || "");
      setIsCancelPlanOpen(false);
      schedulePlanMetaDrawerOpen(() => {
        setIsPlanMetaOpen(true);
      });
    },
    [currentPlan, schedulePlanMetaDrawerOpen],
  );

  const handleSubmitPlanMeta = React.useCallback(async () => {
    const safeName = trim(planMetaName);
    const safeDescription = trim(planMetaDescription) || null;

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

        toast.success("Reja joriy kaloriyaga moslandi");
      } catch {
        toast.error("Rejani kaloriyaga moslab bo'lmadi");
      }
    },
    [currentPlan?.id, rescalePlanCalories],
  );

  const dateKey = split(date.toISOString(), "T")[0];
  const todayKey = getTodayKey();
  const todayDate = React.useMemo(
    () => new Date(`${todayKey}T12:00:00`),
    [todayKey],
  );
  const selectedDateLabel = React.useMemo(
    () =>
      date.toLocaleDateString("uz-UZ", {
        day: "numeric",
        month: "short",
      }),
    [date],
  );
  const isPastDate = dateKey < todayKey;
  const dateQueryKey = React.useMemo(() => {
    const value = new URLSearchParams(location.search).get("date");
    return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : null;
  }, [location.search]);

  React.useEffect(() => {
    if (!dateQueryKey || dateQueryKey === dateKey) {
      return;
    }

    setDate(new Date(`${dateQueryKey}T12:00:00`));
  }, [dateKey, dateQueryKey]);
  const handleOverviewDateChange = React.useCallback(
    (nextDate) => {
      if (!nextDate) {
        return;
      }

      const nextKey = split(nextDate.toISOString(), "T")[0];
      setDate(nextDate);

      if (location.pathname.startsWith("/user/nutrition/overview")) {
        const params = new URLSearchParams(location.search);
        params.set("date", nextKey);
        navigate(`${location.pathname}?${params.toString()}`, {
          replace: true,
        });
      }
    },
    [location.pathname, location.search, navigate],
  );

  const selectedDay = React.useMemo(
    () => WEEK_DAYS[(date.getDay() + 6) % 7],
    [date],
  );
  const yesterdayKey = React.useMemo(() => {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return split(yesterday.toISOString(), "T")[0];
  }, [date]);
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
    return reduce(
      pendingScans,
      (acc, scan) => {
        const preview = scan.item ? getDraftNutritionPreview(scan.item) : {};
        const food = {
          id: scan.id,
          status: scan.status,
          source: "camera",
          name: scan.item?.title || "",
          cal: preview.calories || 0,
          protein: preview.protein || 0,
          carbs: preview.carbs || 0,
          fat: preview.fat || 0,
          image: scan.imageUrl || scan.imageDataUrl,
          error: scan.error,
          scanId: scan.id,
        };
        const mealType = scan.mealType || "breakfast";
        acc[mealType] = [...(acc[mealType] || []), food];
        return acc;
      },
      { breakfast: [], lunch: [], dinner: [], snack: [] },
    );
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

  React.useEffect(() => {
    const breadcrumbTitle =
      entryView === "plans"
        ? "Ovqatlanish rejalari"
        : entryView === "report"
          ? "Ovqatlanish hisobotlari"
          : "Ovqatlanish";

    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/nutrition/overview", title: breadcrumbTitle },
    ]);
  }, [entryView, setBreadcrumbs]);

  const allFoods = flatten(lodashValues(meals));
  const totals = reduce(
    allFoods,
    (acc, f) => {
      const qty = f.qty ?? 1;
      return {
        calories: acc.calories + (f.cal ?? 0) * qty,
        protein: acc.protein + (f.protein ?? 0) * qty,
        carbs: acc.carbs + (f.carbs ?? 0) * qty,
        fat: acc.fat + (f.fat ?? 0) * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const roundedTotals = {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
  const waterConsumedMl = React.useMemo(() => {
    const cupSize = toNumber(goals.cupSize || 250);
    const waterLog = isArray(dayData.waterLog) ? dayData.waterLog : [];

    if (waterLog.length > 0) {
      return reduce(
        waterLog,
        (sum, entry) => sum + toNumber(entry?.amountMl || cupSize || 0),
        0,
      );
    }

    return toNumber(dayData.waterCups || 0) * cupSize;
  }, [dayData.waterCups, dayData.waterLog, goals.cupSize]);

  const handleRemoveFood = async (type, food) => {
    try {
      await removeMealAction(dateKey, type, food.id);
      toast("Ovqat o'chirildi", {
        action: {
          label: "Qaytarish",
          onClick: () => {
            void addMealAction(dateKey, type, food).catch(() => {
              toast.error("Ovqatni qaytarib bo'lmadi");
            });
          },
        },
        icon: <UndoIcon className="size-4" />,
        duration: 5000,
      });
    } catch {
      toast.error("Ovqatni o'chirib bo'lmadi");
    }
  };

  const handleBulkRemoveFoods = React.useCallback(
    async (selectedItems) => {
      if (!isArray(selectedItems) || selectedItems.length === 0) {
        return;
      }

      try {
        for (const item of selectedItems) {
          if (!item?.mealType || !item?.food?.id) continue;
          await removeMealAction(dateKey, item.mealType, item.food.id);
        }
        toast.success(`${selectedItems.length} ta ovqat o'chirildi`);
      } catch {
        toast.error("Tanlangan ovqatlarni o'chirib bo'lmadi");
      }
    },
    [dateKey, removeMealAction],
  );

  const handleTransferMeal = React.useCallback(
    ({ mode, mealType, food }) => {
      if (!food?.id) return;

      setMealTransferContext({
        mode,
        sourceDate: dateKey,
        sourceMealType: mealType,
        food,
      });
    },
    [dateKey],
  );

  const handleConfirmMealTransfer = React.useCallback(
    async ({ mode, food, targetDate, targetMealType }) => {
      if (!mealTransferContext || !food?.id || !targetDate || !targetMealType) {
        return;
      }

      const isMove = mode === "move";
      const sourceDate = mealTransferContext.sourceDate;
      const sourceMealType = mealTransferContext.sourceMealType;

      if (
        isMove &&
        sourceDate === targetDate &&
        sourceMealType === targetMealType
      ) {
        toast("Bu ovqat allaqachon shu kunda va shu bo'limda turibdi");
        return;
      }

      const mealPayload = {
        ...food,
        id: undefined,
        isConsumed: undefined,
        isFromPlanLinked: undefined,
        isPlanned: undefined,
        source: food.source ?? "manual",
        addedAt: new Date(`${targetDate}T12:00:00`).toISOString(),
      };

      try {
        await addMealAction(targetDate, targetMealType, mealPayload);

        if (isMove) {
          await removeMealAction(sourceDate, sourceMealType, food.id);
        }

        toast.success(isMove ? "Ovqat ko'chirildi" : "Ovqatdan nusxa olindi");
        setMealTransferContext(null);
      } catch {
        toast.error(
          isMove
            ? "Ovqatni ko'chirib bo'lmadi"
            : "Ovqatdan nusxa olib bo'lmadi",
        );
      }
    },
    [addMealAction, mealTransferContext, removeMealAction],
  );

  const currentPlanDayStatus = React.useMemo(
    () => getPlanDayStatus(currentPlan, date),
    [currentPlan, date],
  );

  const currentDayPlan = React.useMemo(
    () => resolvePlanColumnsForDate(currentPlan, date, selectedDay),
    [currentPlan, date, selectedDay],
  );

  const getMealKey = (type) => {
    return MEAL_LABEL_TO_TYPE[type] || toLower(String(type || ""));
  };

  const getActiveMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return "breakfast";
    if (hour >= 10 && hour < 14) return "lunch";
    if (hour >= 14 && hour < 18) return "snack";
    if (hour >= 18 && hour < 23) return "dinner";
    return "snack";
  };

  const activeMealType = getActiveMealType();

  // Har bir meal type uchun rejalashtirilgan ovqatlar (kanban dan)
  const plannedByType = React.useMemo(() => {
    const result = {};
    forEach(currentDayPlan, (col) => {
      const key = getMealKey(col.type);
      if (key) {
        result[key] = [
          ...(result[key] || []),
          ...map(col.items || [], (item, idx) => ({
            ...item,
            // Ensure stable ID so duplicate-prevention works correctly
            id: item.id || `plan-${col.type}-${item.name}-${idx}`,
            colType: col.type,
          })),
        ];
      }
    });
    return result;
  }, [currentDayPlan]);

  const handleTogglePlanned = async (typeKey, food) => {
    try {
      if (food.isConsumed) {
        await removeMealAction(dateKey, typeKey, food.id);
        return;
      }

      const foodToLog = { ...food };
      delete foodToLog.isPlanned;
      delete foodToLog.isConsumed;
      delete foodToLog.colType;
      await addMealAction(dateKey, typeKey, {
        ...foodToLog,
        addedFromPlan: true,
        source: "meal-plan",
      });
    } catch {
      toast.error("Ovqat rejasini yangilab bo'lmadi");
    }
  };

  const handleLogPlanned = React.useCallback(
    async (typeKey, food, payload = {}) => {
      try {
        const macros = payload.macros || {};
        await addMealAction(dateKey, typeKey, {
          ...food,
          addedFromPlan: true,
          source: "meal-plan",
          grams: payload.grams ?? food.grams,
          cal: macros.cal ?? food.cal,
          protein: macros.protein ?? food.protein,
          carbs: macros.carbs ?? food.carbs,
          fat: macros.fat ?? food.fat,
          image: payload.image ?? food.image ?? null,
          ingredients: payload.ingredients ?? food.ingredients ?? [],
        });
      } catch {
        toast.error("Ovqatni log qilib bo'lmadi");
      }
    },
    [addMealAction, dateKey],
  );

  const handleCopyFromYesterday = React.useCallback(
    async (mealType) => {
      try {
        const result = await refetchYesterday();
        const yesterdayMeals =
          normalizeDayData(result.data?.data).meals?.[mealType] || [];

        if (yesterdayMeals.length === 0) {
          toast("Kecha bu ovqat bo'sh edi");
          return;
        }

        const currentBarcodes = new Set(
          map(meals[mealType], (f) => f.barcode || f.id),
        );
        let addedCount = 0;

        for (const food of yesterdayMeals) {
          if (!currentBarcodes.has(food.barcode || food.id)) {
            await addMealAction(dateKey, mealType, {
              ...food,
              source: food.source ?? "manual",
              addedAt: new Date().toISOString(),
            });
            addedCount++;
          }
        }

        if (addedCount > 0) {
          toast.success(`${addedCount} ta ovqat kechadan nusxalandi`);
        } else {
          toast("Barcha ovqatlar allaqachon qo'shilgan");
        }
      } catch {
        toast.error("Kechagi ovqatlarni yuklab bo'lmadi");
      }
    },
    [addMealAction, dateKey, meals, refetchYesterday],
  );

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
    if (currentDayPlan.length === 0) {
      return map(toPairs(MEAL_CONFIG), ([type, config]) => [
        type,
        {
          ...config,
          name: config.label,
          foods: [
            ...(meals[type] || []),
            ...(pendingScanFoodsByType[type] || []),
          ],
          plannedItems: plannedByType[type] || [],
        },
      ]);
    }

    const plannedSections = reduce(
      currentDayPlan,
      (acc, col) => {
        const key = getMealKey(col.type);
        const config = MEAL_CONFIG[key];

        if (!config || acc[key]) {
          return acc;
        }

        acc[key] = {
          ...config,
          name: config.label,
          time: col.time || config.time,
          foods: [
            ...(meals[key] || []),
            ...(pendingScanFoodsByType[key] || []),
          ],
          plannedItems: plannedByType[key] || [],
        };

        return acc;
      },
      {},
    );

    const loggedOnlyKeys = filter(
      MEAL_TYPES,
      (key) =>
        !plannedSections[key] &&
        ((meals[key] || []).length > 0 ||
          (pendingScanFoodsByType[key] || []).length > 0),
    );

    return map([...keys(plannedSections), ...loggedOnlyKeys], (key) => [
      key,
      plannedSections[key] || {
        ...MEAL_CONFIG[key],
        name: MEAL_CONFIG[key].label,
        foods: [...(meals[key] || []), ...(pendingScanFoodsByType[key] || [])],
        plannedItems: plannedByType[key] || [],
      },
    ]);
  }, [currentDayPlan, meals, pendingScanFoodsByType, plannedByType]);

  const filteredMealSections = React.useMemo(() => {
    const searchTerm = normalizeSearchText(mealSearch);
    const [minCalories, maxCalories] = calorieRange;
    const hasCalorieFilter =
      minCalories > CALORIE_FILTER_DEFAULT[0] ||
      maxCalories < CALORIE_FILTER_DEFAULT[1];
    const hasDateFilter = Boolean(filterDateRange.start || filterDateRange.end);

    const matchesSearch = (food) => {
      if (!searchTerm) return true;
      return some(
        filter(
          [
            food?.name,
            food?.title,
            food?.description,
            food?.barcode,
            ...(isArray(food?.ingredients)
              ? map(food.ingredients, (ingredient) => ingredient?.name)
              : []),
          ],
          Boolean,
        ),
        (value) => includes(toLower(String(value)), searchTerm),
      );
    };

    const matchesCalories = (food) => {
      if (!hasCalorieFilter) return true;
      const calories = Math.round(toNumber(food?.cal ?? food?.calories ?? 0));
      return calories >= minCalories && calories <= maxCalories;
    };

    const matchesDateRange = (food) => {
      if (!hasDateFilter) return true;
      const itemDateKey = getMealDateKey(food, dateKey);
      if (filterDateRange.start && itemDateKey < filterDateRange.start) {
        return false;
      }
      if (filterDateRange.end && itemDateKey > filterDateRange.end) {
        return false;
      }
      return true;
    };

    const matchesAdvancedFilters = (food) =>
      matchesSearch(food) && matchesCalories(food) && matchesDateRange(food);

    return reduce(
      sortedMealSections,
      (sections, [type, section]) => {
        if (mealFilter !== "all" && type !== mealFilter) {
          return sections;
        }

        const isActiveSource = (src) => {
          if (sourceFilters.length === 0) return true;
          return includes(sourceFilters, src);
        };

        const filteredFoods = filter(
          section.foods || [],
          (food) =>
            isActiveSource(food.source || "manual") &&
            matchesAdvancedFilters(food),
        );

        const filteredPlannedItems = isActiveSource("meal-plan")
          ? filter(section.plannedItems || [], (food) =>
              matchesAdvancedFilters(food),
            )
          : [];

        if (
          (sourceFilters.length > 0 ||
            searchTerm ||
            hasCalorieFilter ||
            hasDateFilter) &&
          filteredFoods.length === 0 &&
          filteredPlannedItems.length === 0
        ) {
          return sections;
        }

        sections.push([
          type,
          {
            ...section,
            foods: filteredFoods,
            plannedItems: filteredPlannedItems,
          },
        ]);
        return sections;
      },
      [],
    );
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
    let count = sourceFilters.length;
    if (normalizeSearchText(mealSearch)) count += 1;
    if (
      calorieRange[0] > CALORIE_FILTER_DEFAULT[0] ||
      calorieRange[1] < CALORIE_FILTER_DEFAULT[1]
    ) {
      count += 1;
    }
    if (filterDateRange.start || filterDateRange.end) count += 1;
    return count;
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

  const handleMealImageUpload = React.useCallback(
    (mealType, foodId, imageDataUrl, adjustedGrams, macros) => {
      if (adjustedGrams != null && macros) {
        void patchMeal(dateKey, mealType, foodId, {
          ...(imageDataUrl != null ? { image: imageDataUrl } : {}),
          ...(imageDataUrl != null ? { source: "camera" } : {}),
          grams: adjustedGrams,
          cal: macros.cal,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
        }).catch(() => {
          toast.error("Ovqatni yangilab bo'lmadi");
        });
        return;
      }

      if (imageDataUrl != null) {
        void patchMeal(dateKey, mealType, foodId, {
          image: imageDataUrl,
          source: "camera",
        }).catch(() => {
          toast.error("Rasmni saqlab bo'lmadi");
        });
      }
    },
    [dateKey, patchMeal],
  );

  const handleUpdateMeal = React.useCallback(
    (mealType, foodId, patch) => {
      void patchMeal(dateKey, mealType, foodId, patch).catch(() => {
        toast.error("Ovqatni yangilab bo'lmadi");
      });
    },
    [dateKey, patchMeal],
  );

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

  const handleCopyMealToToday = React.useCallback(
    async (mealType, food) => {
      try {
        await addMealAction(todayKey, mealType, {
          ...food,
          id: undefined,
          source: "history-copy",
          addedAt: undefined,
          isConsumed: undefined,
          isFromPlanLinked: undefined,
        });
        toast.success(`${food.name || "Ovqat"} bugunga qo'shildi`);
      } catch {
        toast.error("Ovqatni bugunga qo'shib bo'lmadi");
      }
    },
    [addMealAction, todayKey],
  );

  const handleAddWaterCup = React.useCallback(async () => {
    try {
      await addWaterCup(date, 250);
      toast.success("250 ml suv qo'shildi");
    } catch {
      toast.error("Suvni qo'shib bo'lmadi");
    }
  }, [addWaterCup, date]);

  const sharedViewProps = {
    date,
    setDate: handleOverviewDateChange,
    dateKey,
    todayKey,
    selectedDateLabel,
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
          maxDate={todayDate}
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
