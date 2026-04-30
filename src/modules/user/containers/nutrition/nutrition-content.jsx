import React from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useWorkoutCalorieAdjustmentPreference from "@/hooks/app/use-workout-calorie-adjustment";
import useMealPlan from "@/hooks/app/use-meal-plan";
import {
  getTodayKey,
  normalizeDayData,
  setMealDuplicateConfirmHandler,
  useDailyTrackingActions,
  useDailyTrackingDay,
  useDailyTrackingMealFeedback,
} from "@/hooks/app/use-daily-tracking";
import useFoodCatalog, {
  enrichTrackedMealItem,
  useFoodScan,
} from "@/hooks/app/use-food-catalog";
import {
  UndoIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import ErrorBoundary from "@/components/error-boundary/index.jsx";
import useOnlineStatus from "@/hooks/utils/use-online-status.js";
import { useLocation, useNavigate } from "react-router";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import { MEAL_CONFIG, MEAL_LABEL_TO_TYPE, MEAL_TYPES } from "@/modules/user/lib/meal-config";
import NutritionHomeView from "./views/home-view.jsx";
import NutritionMealsView from "./views/meals-view.jsx";
import NutritionPlansView from "./views/plans-view.jsx";
import NutritionReportView from "./views/report-view.jsx";
import NutritionDrawers from "./nutrition-drawers.jsx";
import {
  buildMealPayloadFromDraft,
  getDraftNutritionPreview,
} from "./meal-draft-review.jsx";

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

const normalizeWeekdayKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("’", "'")
    .replaceAll(/[^a-z\u0400-\u04ff]+/g, "");

const getPlanInsights = (plan) => {
  const weeklyKanban =
    plan?.weeklyKanban && typeof plan.weeklyKanban === "object"
      ? plan.weeklyKanban
      : {};

  const dayColumns = Object.values(weeklyKanban).filter((value) =>
    Array.isArray(value),
  );

  const filledDays = dayColumns.filter((columns) =>
    columns.some(
      (column) => Array.isArray(column?.items) && column.items.length > 0,
    ),
  ).length;

  const totalItems = dayColumns.reduce((sum, columns) => {
    return (
      sum +
      columns.reduce((columnSum, column) => {
        return (
          columnSum + (Array.isArray(column?.items) ? column.items.length : 0)
        );
      }, 0)
    );
  }, 0);

  return {
    filledDays,
    totalItems,
    updatedLabel: plan?.updatedAt
      ? new Date(plan.updatedAt).toLocaleDateString("uz-UZ")
      : null,
  };
};

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
  if (source === "coach") {
    return {
      label: "Murabbiy reja",
      badgeClassName:
        "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300",
    };
  }

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

const normalizeSearchText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getMealDateKey = (food, fallbackDateKey) => {
  const value = food?.addedAt || food?.createdAt || food?.date || fallbackDateKey;
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
    startPlan,
    duplicatePlan,
    archivePlan,
    applyCoachUpdate,
    pausePlan,
    removePlan,
    isSavingDraft,
    isDuplicatingPlan,
    isArchivingPlan,
    isApplyingCoachUpdate,
  } = useMealPlan();

  const [selectedPlanId, setSelectedPlanId] = React.useState(null);

  React.useEffect(() => {
    if (plans.length === 0) {
      setSelectedPlanId(null);
      return;
    }

    if (selectedPlanId && plans.some((plan) => plan.id === selectedPlanId)) {
      return;
    }

    setSelectedPlanId(activePlan?.id || draftPlan?.id || plans[0]?.id || null);
  }, [activePlan?.id, draftPlan?.id, plans, selectedPlanId]);

  const currentPlan = React.useMemo(() => {
    if (!plans.length) {
      return null;
    }

    return (
      plans.find((plan) => plan.id === selectedPlanId) ||
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
    return plans.reduce((acc, plan) => {
      acc[plan.id] = getPlanInsights(plan);
      return acc;
    }, {});
  }, [plans]);
  const orderedPlans = React.useMemo(() => {
    return [...plans].sort((left, right) => {
      const leftPriority =
        left.status === "active" ? 0 : left.status === "draft" ? 1 : 2;
      const rightPriority =
        right.status === "active" ? 0 : right.status === "draft" ? 1 : 2;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return (
        new Date(right.updatedAt || right.createdAt || 0).getTime() -
        new Date(left.updatedAt || left.createdAt || 0).getTime()
      );
    });
  }, [plans]);

  const weeklyKanban = React.useMemo(
    () => currentPlan?.weeklyKanban || {},
    [currentPlan?.weeklyKanban],
  );

  const saveKanban = async (newKanban) => {
    if (currentPlan?.status === "active") {
      await startPlan({ ...currentPlan, weeklyKanban: newKanban });
      return;
    }

    await saveDraftPlan({
      ...(currentPlan || {}),
      name:
        currentPlan?.name ||
        `Qo'lda reja ${new Date().toLocaleDateString("uz-UZ")}`,
      source: currentPlan?.source || "manual",
      weeklyKanban: newKanban,
    });
  };

  const [date, setDate] = React.useState(new Date());
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [builderInitialData, setBuilderInitialData] = React.useState(null);
  const [isShoppingOpen, setIsShoppingOpen] = React.useState(false);
  const [isAIOpen, setIsAIOpen] = React.useState(false);
  const [isPlansDrawerOpen, setIsPlansDrawerOpen] = React.useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] =
    React.useState(false);
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

    if (!state?.openMealPlansDrawer) {
      return;
    }

    setIsPlansDrawerOpen(true);

    if (state.planId) {
      setSelectedPlanId(state.planId);
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);
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
  const isCurrentPlanCoachAssigned = currentPlan?.source === "coach";
  const isCurrentPlanUpdateAvailable =
    currentPlan?.syncStatus === "update_available";

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
    setBuilderInitialData(normalizedPlan.weeklyKanban || {});
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

  const handleTemplateSelected = React.useCallback(
    async (template) => {
      const weeklyKanban =
        template?.weeklyKanban &&
        typeof template.weeklyKanban === "object" &&
        !Array.isArray(template.weeklyKanban)
          ? template.weeklyKanban
          : {};
      const mealCount =
        template?.mealCount ||
        Math.max(
          1,
          ...Object.values(weeklyKanban).map((day) =>
            Array.isArray(day) ? day.length : 0,
          ),
        );

      try {
        const nextState = await saveDraftPlan({
          name: `${template?.title || template?.name || "Tayyor shablon"} nusxa`,
          description: template?.description || null,
          source: "template",
          goal: template?.goal || "maintenance",
          mealCount,
          weeklyKanban,
        });
        const nextPlan =
          nextState?.draftPlan ||
          nextState?.plans?.find(
            (plan) =>
              plan.status === "draft" &&
              plan.name?.startsWith(template?.title || template?.name || ""),
          ) ||
          nextState?.plans?.[0] ||
          null;

        if (nextPlan?.id) {
          setSelectedPlanId(nextPlan.id);
        }

        setBuilderInitialData(nextPlan?.weeklyKanban || weeklyKanban);
        setIsTemplateLibraryOpen(false);
        schedulePlanMetaDrawerOpen(() => {
          setIsBuilderOpen(true);
        });
        toast.success("Shablon asosida reja yaratildi");
      } catch {
        toast.error("Shablondan reja yaratib bo'lmadi");
      }
    },
    [saveDraftPlan, schedulePlanMetaDrawerOpen],
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
    if (isCurrentPlanCoachAssigned) {
      void handleDuplicateCurrentPlan(true);
      return;
    }

    setIsCancelPlanOpen(false);
    if (!currentPlan) {
      openPlanMetaCreateDrawer();
      return;
    }

    setIsPlansDrawerOpen(false);
    setBuilderInitialData(currentPlan?.weeklyKanban || {});
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
      } catch {
        toast.error("Rejani faollashtirib bo'lmadi");
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
    const safeName = planMetaName.trim();
    const safeDescription = planMetaDescription.trim() || null;

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
          weeklyKanban: currentPlan.weeklyKanban || {},
          source: currentPlan.source || "manual",
        });
        const updatedPlan =
          nextState?.plans?.find((plan) => plan.id === currentPlan.id) ||
          nextState?.activePlan ||
          nextState?.draftPlan ||
          null;

        if (updatedPlan?.id) {
          setSelectedPlanId(updatedPlan.id);
        }

        setIsPlanMetaOpen(false);
        if (planMetaShouldOpenBuilder && updatedPlan) {
          setBuilderInitialData(updatedPlan.weeklyKanban || {});
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
        weeklyKanban: {},
      });
      const nextPlan =
        nextState?.draftPlan ||
        nextState?.plans?.find(
          (plan) => plan.status === "draft" && plan.name === safeName,
        ) ||
        nextState?.plans?.[0] ||
        null;

      if (nextPlan?.id) {
        setSelectedPlanId(nextPlan.id);
      }

      setBuilderInitialData(nextPlan?.weeklyKanban || {});
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
          nextState?.plans?.find(
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
          setBuilderInitialData(duplicatedPlan.weeklyKanban || {});
          setIsBuilderOpen(true);
          toast.success("Murabbiy rejasi nusxalanib, tahrirlash uchun ochildi");
          return;
        }

        toast.success(
          currentPlan.source === "coach"
            ? "Murabbiy rejasi nusxalandi"
            : "Reja nusxalandi",
        );
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
        nextState?.plans?.find((plan) => plan.id !== currentPlan.id) ||
        null;

      setSelectedPlanId(nextSelectable?.id || currentPlan.id);
      setIsCancelPlanOpen(false);
      toast.success("Reja arxivlandi");
    } catch {
      toast.error("Rejani arxivlab bo'lmadi");
    }
  }, [archivePlan, currentPlan]);

  const handleApplyCoachUpdate = React.useCallback(async () => {
    if (!currentPlan?.id) {
      return;
    }

    try {
      await applyCoachUpdate(currentPlan.id);
      setIsCancelPlanOpen(false);
      toast.success("Murabbiy yangilanishi qo'llandi");
    } catch {
      toast.error("Yangilanishni qo'llab bo'lmadi");
    }
  }, [applyCoachUpdate, currentPlan]);

  const dateKey = date.toISOString().split("T")[0];
  const todayKey = getTodayKey();
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

  const selectedDay = React.useMemo(
    () => WEEK_DAYS[(date.getDay() + 6) % 7],
    [date],
  );
  const yesterdayKey = React.useMemo(() => {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }, [date]);
  const {
    dayData,
    isLoading: isDayLoading,
  } = useDailyTrackingDay(dateKey);
  const { byMealId: mealFeedbackById } = useDailyTrackingMealFeedback({
    startDate: dateKey,
    endDate: dateKey,
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

    return Math.max(0, Math.round(Number(dayData.burnedCalories) || 0));
  }, [dateKey, dayData.burnedCalories, todayKey, workoutCalorieAdjustmentEnabled]);
  const effectiveGoals = React.useMemo(
    () =>
      workoutCalorieAdjustment > 0
        ? {
            ...goals,
            calories: Number(goals.calories || 0) + workoutCalorieAdjustment,
          }
        : goals,
    [goals, workoutCalorieAdjustment],
  );

  React.useEffect(() => {
    if (!workoutCalorieAdjustment) {
      return;
    }

    const baseCalories = Number(goals.calories || 0);
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
      breakfast: dayData.meals.breakfast.map((item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
      lunch: dayData.meals.lunch.map((item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
      dinner: dayData.meals.dinner.map((item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
      snack: dayData.meals.snack.map((item) =>
        enrichTrackedMealItem(item, foodMap),
      ),
    }),
    [dayData.meals, foodMap],
  );

  const processInlineScan = React.useCallback(
    async (scan) => {
      const scanId = scan.id;

      setPendingScans((current) =>
        current.map((item) =>
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
        const draftItems = (Array.isArray(response?.items)
          ? response.items
          : []
        ).map((item) => ({
          ...item,
          imageUrl: uploadedImageUrl || scan.imageDataUrl,
        }));

        if (draftItems.length === 0) {
          setPendingScans((current) =>
            current.map((item) =>
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

            return draftItems.map((draftItem, index) => ({
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
          current.map((item) =>
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

  const handleInlineCameraCapture = React.useCallback(
    (imageDataUrl, mealType = "breakfast") => {
      const scan = {
        id: `scan-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        groupId: null,
        dateKey,
        mealType,
        imageDataUrl,
        imageUrl: null,
        status: "scanning",
        item: null,
        error: null,
      };

      setPendingScans((current) => [...current, scan]);
      toast("Rasm qabul qilindi, AI tahlil qilmoqda");
      void processInlineScan(scan);
    },
    [dateKey, processInlineScan],
  );

  const pendingScanFoodsByType = React.useMemo(() => {
    return pendingScans.reduce(
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
    () => pendingScans.find((scan) => scan.id === selectedScanId) || null,
    [pendingScans, selectedScanId],
  );
  const selectedScanDraftGroup = React.useMemo(() => {
    if (!selectedScan) return [];
    const groupId = selectedScan.groupId || selectedScan.id;
    return pendingScans.filter(
      (scan) =>
        (scan.groupId || scan.id) === groupId && scan.status === "draft",
    );
  }, [pendingScans, selectedScan]);

  React.useEffect(() => {
    const breadcrumbTitle =
      entryView === "plans"
        ? "Ovqatlanish rejalari"
        : entryView === "meals"
          ? "Ovqatlar"
          : entryView === "report"
            ? "Ovqatlanish hisobotlari"
            : "Ovqatlanish";

    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/nutrition/home", title: breadcrumbTitle },
    ]);
  }, [entryView, setBreadcrumbs]);

  const allFoods = Object.values(meals).flat();
  const totals = allFoods.reduce(
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
    const cupSize = Number(goals.cupSize || 250);
    const waterLog = Array.isArray(dayData.waterLog) ? dayData.waterLog : [];

    if (waterLog.length > 0) {
      return waterLog.reduce(
        (sum, entry) => sum + Number(entry?.amountMl || cupSize || 0),
        0,
      );
    }

    return Number(dayData.waterCups || 0) * cupSize;
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
      if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
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

        toast.success(
          isMove ? "Ovqat ko'chirildi" : "Ovqatdan nusxa olindi",
        );
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

  const currentDayPlan = React.useMemo(() => {
    if (!weeklyKanban || typeof weeklyKanban !== "object") {
      return [];
    }

    if (Array.isArray(weeklyKanban[selectedDay])) {
      return weeklyKanban[selectedDay];
    }

    const normalizedSelectedDay = normalizeWeekdayKey(selectedDay);
    const matchedKey = Object.keys(weeklyKanban).find(
      (key) => normalizeWeekdayKey(key) === normalizedSelectedDay,
    );

    return matchedKey && Array.isArray(weeklyKanban[matchedKey])
      ? weeklyKanban[matchedKey]
      : [];
  }, [selectedDay, weeklyKanban]);

  const getMealKey = (type) => {
    return MEAL_LABEL_TO_TYPE[type] || String(type || "").toLowerCase();
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
    currentDayPlan.forEach((col) => {
      const key = getMealKey(col.type);
      if (key) {
        result[key] = [
          ...(result[key] || []),
          ...(col.items || []).map((item, idx) => ({
            ...item,
            // Ensure stable ID so duplicate-prevention works correctly
            id: item.id || `plan-${col.type}-${item.name}-${idx}`,
            colType: col.type,
            coachApproved: currentPlan?.source === "coach",
          })),
        ];
      }
    });
    return result;
  }, [currentDayPlan, currentPlan?.source]);

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
        source:
          currentPlan?.source === "coach" ? "coach-meal-plan" : "meal-plan",
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
          source:
            currentPlan?.source === "coach" ? "coach-meal-plan" : "meal-plan",
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
    [addMealAction, currentPlan?.source, dateKey],
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
          meals[mealType].map((f) => f.barcode || f.id),
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
          : nextState?.plans?.find((plan) => plan.id === currentPlan?.id) ||
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
      return Object.entries(MEAL_CONFIG).map(([type, config]) => [
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

    const plannedSections = currentDayPlan.reduce((acc, col) => {
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
    }, {});

    const loggedOnlyKeys = MEAL_TYPES.filter(
      (key) =>
        !plannedSections[key] &&
        ((meals[key] || []).length > 0 ||
          (pendingScanFoodsByType[key] || []).length > 0),
    );

    return [...Object.keys(plannedSections), ...loggedOnlyKeys].map((key) => [
      key,
      plannedSections[key] || {
        ...MEAL_CONFIG[key],
        name: MEAL_CONFIG[key].label,
        foods: [
          ...(meals[key] || []),
          ...(pendingScanFoodsByType[key] || []),
        ],
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
      return [
        food?.name,
        food?.title,
        food?.description,
        food?.barcode,
        ...(Array.isArray(food?.ingredients)
          ? food.ingredients.map((ingredient) => ingredient?.name)
          : []),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchTerm),
        );
    };

    const matchesCalories = (food) => {
      if (!hasCalorieFilter) return true;
      const calories = Math.round(Number(food?.cal ?? food?.calories ?? 0));
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

    return sortedMealSections.reduce((sections, [type, section]) => {
      if (mealFilter !== "all" && type !== mealFilter) {
        return sections;
      }

      const isActiveSource = (src) => {
        if (sourceFilters.length === 0) return true;
        if (src === "coach-meal-plan") {
          return (
            sourceFilters.includes("coach-meal-plan") ||
            sourceFilters.includes("meal-plan")
          );
        }
        return sourceFilters.includes(src);
      };

      const filteredFoods = (section.foods || []).filter(
        (food) =>
          isActiveSource(food.source || "manual") &&
          matchesAdvancedFilters(food),
      );

      const filteredPlannedItems = isActiveSource("meal-plan")
        ? (section.plannedItems || []).filter((food) =>
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
    }, []);
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
  }, [calorieRange, filterDateRange.end, filterDateRange.start, mealSearch, sourceFilters.length]);

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
      const scan = pendingScans.find((item) => item.id === food?.scanId);
      if (!scan) return;
      void processInlineScan(scan);
    },
    [pendingScans, processInlineScan],
  );

  const handleRemoveScan = React.useCallback((scanId) => {
    setPendingScans((current) => current.filter((scan) => scan.id !== scanId));
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
              grams: Math.max(0, Number(draft.manualGramsOverride) || 0),
              cal: Math.max(0, Number(manualNutrition.calories) || 0),
              protein: Math.max(0, Number(manualNutrition.protein) || 0),
              carbs: Math.max(0, Number(manualNutrition.carbs) || 0),
              fat: Math.max(0, Number(manualNutrition.fat) || 0),
              fiber: Math.max(0, Number(manualNutrition.fiber) || 0),
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
          current.filter((scan) => scan.id !== selectedScan.id),
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

      const idsToRemove = new Set(selectedScanDraftGroup.map((scan) => scan.id));
      setPendingScans((current) =>
        current.filter((scan) => !idsToRemove.has(scan.id)),
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

  const sharedViewProps = {
    date,
    setDate,
    plans,
    currentPlan,
    goals: effectiveGoals,
    roundedTotals,
    waterConsumedMl,
    waterGoalMl: Number(effectiveGoals.waterMl || 2500),
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
    mealFeedbackById,
    activeMealType,
    setSelectedMealTypeForAdd,
    setIsActionDrawerOpen,
    setIsSavedMealsOpen,
    setIsPlansDrawerOpen,
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
        />
      ) : entryView === "meals" ? (
        <NutritionMealsView {...sharedViewProps} />
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
        handleApplyCoachUpdate={handleApplyCoachUpdate}
        handleArchiveCurrentPlan={handleArchiveCurrentPlan}
        handleConfirmAllInlineScans={handleConfirmAllInlineScans}
        handleConfirmInlineScan={handleConfirmInlineScan}
        handleConfirmMealTransfer={handleConfirmMealTransfer}
        handleDuplicateCurrentPlan={handleDuplicateCurrentPlan}
        handleInlineCameraCapture={handleInlineCameraCapture}
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
        isApplyingCoachUpdate={isApplyingCoachUpdate}
        isArchivingPlan={isArchivingPlan}
        isBuilderOpen={isBuilderOpen}
        isCancelPlanOpen={isCancelPlanOpen}
        isCurrentPlanCoachAssigned={isCurrentPlanCoachAssigned}
        isCurrentPlanUpdateAvailable={isCurrentPlanUpdateAvailable}
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
    </PageTransition>
  );
};

const NutritionContentPage = (props) => (
  <ErrorBoundary fallback={<NutritionErrorFallback />}>
    <NutritionContent {...props} />
  </ErrorBoundary>
);

export default NutritionContentPage;
