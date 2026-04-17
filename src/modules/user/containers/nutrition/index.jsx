import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import useHealthGoals from "@/hooks/app/use-health-goals";
import useMealPlan from "@/hooks/app/use-meal-plan";
import {
  normalizeDayData,
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import useFoodCatalog, {
  enrichTrackedMealItem,
} from "@/hooks/app/use-food-catalog";
import {
  PlusIcon,
  CopyIcon,
  UndoIcon,
  PencilIcon,
  CheckIcon,
  Trash2Icon,
  PauseIcon,
  ArchiveIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  ListFilterIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import MealPlanBuilder from "@/components/meal-plan-builder/index.jsx";
import { ShoppingList } from "./shopping-list.jsx";
import AIGenerator from "./ai-generator";
import CalorieGaugeWidget from "@/components/calorie-gauge-widget";
import MealSection from "./meal-section.jsx";
import { map } from "lodash";
import { useLocation, useNavigate } from "react-router";
import ActionDrawer from "@/modules/user/containers/nutrition/action-drawer.jsx";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";
import NutritionFilterDrawer from "./nutrition-filter-drawer.jsx";
import CustomFoodsDrawer from "./custom-foods-drawer.jsx";
import PlansDrawer from "./plans-drawer.jsx";
import { SOURCE_META } from "./source-meta.js";
import NutritionAnalyticsSection from "./nutrition-analytics-section.jsx";
import { TrackingPageLayout } from "@/components/tracking-page-shell";
import DateNav from "@/components/date-nav/index.jsx";

const mealConfig = {
  breakfast: { label: "Nonushta", emoji: "🍳", time: "06:00 - 10:00" },
  lunch: { label: "Tushlik", emoji: "🥗", time: "12:00 - 14:00" },
  dinner: { label: "Kechki ovqat", emoji: "🍲", time: "18:00 - 21:00" },
  snack: { label: "Snack", emoji: "🥜", time: "Istalgan vaqt" },
};

const NUTRITION_SOURCE_FILTERS = [
  { key: "all", label: "Barcha manba" },
  { key: "manual", label: SOURCE_META.manual.label },
  { key: "text", label: SOURCE_META.text.label },
  { key: "audio", label: SOURCE_META.audio.label },
  { key: "camera", label: SOURCE_META.camera.label },
  { key: "meal-plan", label: SOURCE_META["meal-plan"].label },
];

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

const getPlanSourceLabel = (source) => {
  if (source === "ai") {
    return "AI";
  }

  if (source === "coach") {
    return "Murabbiy";
  }

  return "Manual";
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

const Index = () => {
  const user = useAuthStore((state) => state.user);
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
  const {
    addMeal: addMealAction,
    removeMeal: removeMealAction,
    updateMealImage,
    patchMeal,
  } = useDailyTrackingActions();

  const {
    plans,
    activePlan,
    draftPlan,
    isLoading: isMealPlanLoading,
    isFetching: isMealPlanFetching,
    isError: isMealPlanError,
    refetch: refetchMealPlan,
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

  const weeklyKanban = currentPlan?.weeklyKanban || {};

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
  const [isActionDrawerOpen, setIsActionDrawerOpen] = React.useState(false);
  const [isCancelPlanOpen, setIsCancelPlanOpen] = React.useState(false);
  const [isPlanMetaOpen, setIsPlanMetaOpen] = React.useState(false);
  const [planMetaMode, setPlanMetaMode] = React.useState("create");
  const [planMetaShouldOpenBuilder, setPlanMetaShouldOpenBuilder] =
    React.useState(true);
  const [planMetaName, setPlanMetaName] = React.useState("");
  const [planMetaDescription, setPlanMetaDescription] = React.useState("");
  const [isCustomFoodsOpen, setIsCustomFoodsOpen] = React.useState(false);

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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const isPremiumActive = user?.premium?.status === "active";
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
    isFetching: isDayFetching,
    isError: isDayError,
    refetch: refetchDay,
  } = useDailyTrackingDay(dateKey);
  const { foodMap } = useFoodCatalog();
  const { refetch: refetchYesterday } = useDailyTrackingDay(yesterdayKey, {
    enabled: false,
  });
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

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/nutrition", title: "Mening Rejam" },
    ]);
  }, [setBreadcrumbs]);

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

  const remaining = goals.calories - roundedTotals.calories;

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
    const typeMap = {
      Nonushta: "breakfast",
      Tushlik: "lunch",
      "Kechki ovqat": "dinner",
      Snack: "snack",
    };
    return typeMap[type] || type.toLowerCase();
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

      const { isPlanned, isConsumed, colType, ...foodToLog } = food;
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
      return Object.entries(mealConfig).map(([type, config]) => [
        type,
        {
          ...config,
          name: config.label,
          foods: meals[type] || [],
          plannedItems: plannedByType[type] || [],
        },
      ]);
    }

    const plannedSections = currentDayPlan.reduce((acc, col) => {
      const key = getMealKey(col.type);
      const config = mealConfig[key];

      if (!config || acc[key]) {
        return acc;
      }

      acc[key] = {
        ...config,
        name: config.label,
        time: col.time || config.time,
        foods: meals[key] || [],
        plannedItems: plannedByType[key] || [],
      };

      return acc;
    }, {});

    const loggedOnlyKeys = Object.keys(mealConfig).filter(
      (key) => !plannedSections[key] && (meals[key] || []).length > 0,
    );

    return [...Object.keys(plannedSections), ...loggedOnlyKeys].map((key) => [
      key,
      plannedSections[key] || {
        ...mealConfig[key],
        name: mealConfig[key].label,
        foods: meals[key] || [],
        plannedItems: plannedByType[key] || [],
      },
    ]);
  }, [currentDayPlan, meals, plannedByType]);

  const filteredMealSections = React.useMemo(() => {
    return sortedMealSections.reduce((sections, [type, section]) => {
      if (mealFilter !== "all" && type !== mealFilter) {
        return sections;
      }

      const isActiveSource = (src) =>
        sourceFilters.length === 0 || sourceFilters.includes(src);

      const filteredFoods = (section.foods || []).filter((food) =>
        isActiveSource(food.source || "manual"),
      );

      const filteredPlannedItems = isActiveSource("meal-plan")
        ? section.plannedItems || []
        : [];

      if (
        sourceFilters.length > 0 &&
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
  }, [mealFilter, sortedMealSections, sourceFilters]);

  return (
    <PageTransition mode="fade">
      <div className="flex flex-col gap-6">
        <div className={"flex md:justify-end"}>
          <DateNav date={date} onChange={setDate} format={"short"} className={'shadow md:shadow-none flex-1 md:flex-none rounded-2xl flex justify-between'} />
        </div>
        {plans.length > 0 ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPlansDrawerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsPlansDrawerOpen(true);
              }
            }}
            className="rounded-[2rem] border p-4 sm:p-5 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mening rejalarim
                </p>
                <h3 className="mt-1 truncate text-base font-black">
                  {currentPlan?.name || "Reja tanlang"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plans.length} ta reja •{" "}
                  {currentPlan?.status === "active"
                    ? "Faol reja"
                    : "Saqlangan reja"}
                  {currentPlan
                    ? ` • ${getPlanSourceLabel(currentPlan.source)}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {currentPlan?.status === "active" ? (
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-green-500/10">
                    <CheckIcon className="size-5 text-green-500" />
                  </div>
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/10">
                    <div className="size-2.5 rounded-full bg-amber-500" />
                  </div>
                )}
                <ChevronRightIcon className="size-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsPlansDrawerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsPlansDrawerOpen(true);
              }
            }}
            className="rounded-[2rem] border border-dashed p-5 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mening rejalarim
                </p>
                <h3 className="mt-1 text-base font-black">
                  Ovqatlanish rejasi yo'q
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Qo'lda yoki AI bilan yangi reja yarating
                </p>
              </div>
              <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
            </div>
          </div>
        )}

        <TrackingPageLayout
          aside={
            <CalorieGaugeWidget
              consumed={roundedTotals.calories}
              goal={goals.calories}
              macros={{
                protein: {
                  current: roundedTotals.protein,
                  target: goals.protein,
                },
                carbs: { current: roundedTotals.carbs, target: goals.carbs },
                fat: { current: roundedTotals.fat, target: goals.fat },
              }}
              isGoalLoading={isGoalLoadingState}
              goalMeta={calorieGoalMeta}
              className="w-full py-6"
            />
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 pb-1 overflow-x-auto no-scrollbar relative">
              <div className="flex w-full gap-2 min-w-max lg:w-auto lg:max-w-full">
                <Button
                  type="button"
                  className="shrink-0"
                  variant={mealFilter === "all" ? "default" : "outline"}
                  onClick={() => setMealFilter("all")}
                >
                  Barchasi
                </Button>
                {Object.entries(mealConfig).map(([type, config]) => (
                  <Button
                    key={type}
                    type="button"
                    className="shrink-0"
                    variant={mealFilter === type ? "default" : "outline"}
                    onClick={() => setMealFilter(type)}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
              <div className="sticky right-0 flex items-center bg-background/80 pl-2 backdrop-blur-sm -mr-1 ml-auto h-full">
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 relative"
                  onClick={() => setIsFilterDrawerOpen(true)}
                >
                  <ListFilterIcon className="size-4" />
                  {sourceFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                      {sourceFilters.length}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {filteredMealSections.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed p-6 text-sm text-muted-foreground">
              <p>Tanlangan filter bo'yicha ovqat bo'limlari topilmadi.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMealFilter("all");
                    setSourceFilters([]);
                  }}
                >
                  Filterni tozalash
                </Button>
                {!isPremiumActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openPremiumForAi}
                  >
                    Premium olish
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            map(filteredMealSections, ([type, section]) => (
              <MealSection
                key={type}
                type={type}
                isActive={type === activeMealType}
                time={section.time}
                items={section.foods || []}
                plannedItems={section.plannedItems || []}
                onRemove={handleRemoveFood}
                onAdd={() => {
                  setSelectedMealTypeForAdd(type);
                  setIsActionDrawerOpen(true);
                }}
                onLogPlanned={handleLogPlanned}
                onImageUpload={(t, foodId, img, adjustedGrams, macros) => {
                  if (adjustedGrams != null && macros) {
                    void patchMeal(dateKey, t, foodId, {
                      ...(img != null ? { image: img } : {}),
                      ...(img != null ? { source: "camera" } : {}),
                      grams: adjustedGrams,
                      cal: macros.cal,
                      protein: macros.protein,
                      carbs: macros.carbs,
                      fat: macros.fat,
                    }).catch(() => {
                      toast.error("Ovqatni yangilab bo'lmadi");
                    });
                  } else if (img != null) {
                    void patchMeal(dateKey, t, foodId, {
                      image: img,
                      source: "camera",
                    }).catch(() => {
                      toast.error("Rasmni saqlab bo'lmadi");
                    });
                  }
                }}
                onTogglePlanned={handleTogglePlanned}
              />
            ))
          )}
        </TrackingPageLayout>

        <NutritionAnalyticsSection />
      </div>

      <MealPlanBuilder
        initialData={builderInitialData || currentPlan?.weeklyKanban || {}}
        selectedDay={selectedDay}
        onSave={handleSaveBuilder}
        onClose={() => {
          setIsBuilderOpen(false);
          setBuilderInitialData(null);
        }}
        open={isBuilderOpen}
        onOpenChange={(val) => {
          setIsBuilderOpen(val);
          if (!val) setBuilderInitialData(null);
        }}
      />
      <ShoppingList
        open={isShoppingOpen}
        onOpenChange={setIsShoppingOpen}
        plan={currentPlan}
        isLoading={isMealPlanLoading}
        isFetching={isMealPlanFetching}
      />

      <PlansDrawer
        open={isPlansDrawerOpen}
        onOpenChange={setIsPlansDrawerOpen}
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
          setIsPlansDrawerOpen(false);
          setIsShoppingOpen(true);
        }}
        onCreateManual={openPlanMetaCreateDrawer}
        onCreateAI={handleOpenAiGenerator}
      />

      <Drawer open={isAIOpen} onOpenChange={setIsAIOpen} direction="bottom">
        <NutritionDrawerContent size="sm">
          <AIGenerator
            onClose={() => setIsAIOpen(false)}
            onGenerated={handleAiGenerated}
          />
        </NutritionDrawerContent>
      </Drawer>

      <ActionDrawer
        open={isActionDrawerOpen}
        onOpenChange={setIsActionDrawerOpen}
        dateKey={dateKey}
        mealType={selectedMealTypeForAdd}
        onOpenCustomFoods={() => setIsCustomFoodsOpen(true)}
        onCloseAll={() => setIsActionDrawerOpen(false)}
      />

      <CustomFoodsDrawer
        open={isCustomFoodsOpen}
        onOpenChange={setIsCustomFoodsOpen}
        dateKey={dateKey}
        mealType={selectedMealTypeForAdd}
        onAddMeal={addMealAction}
      />

      <Drawer
        open={isPlanMetaOpen}
        onOpenChange={setIsPlanMetaOpen}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>
              {planMetaMode === "edit"
                ? planMetaShouldOpenBuilder
                  ? "Reja ma'lumotlari"
                  : "Reja nomini o'zgartirish"
                : "Yangi reja"}
            </DrawerTitle>
            <DrawerDescription>
              {planMetaMode === "edit"
                ? planMetaShouldOpenBuilder
                  ? "Nom va izohni yangilang."
                  : "Faqat reja nomini yangilang."
                : "Avval reja nomi va izohini saqlang, keyin builder ochiladi."}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-3 pt-0">
            <Input
              value={planMetaName}
              onChange={(event) => setPlanMetaName(event.target.value)}
              placeholder="Masalan: Haftalik protein reja"
              autoFocus
            />
            {planMetaMode !== "edit" || planMetaShouldOpenBuilder ? (
              <Textarea
                value={planMetaDescription}
                onChange={(event) => setPlanMetaDescription(event.target.value)}
                placeholder="Qisqacha izoh yoki maqsadni yozing"
                rows={4}
              />
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button
              onClick={handleSubmitPlanMeta}
              disabled={!planMetaName.trim() || isSavingDraft}
            >
              {planMetaMode === "edit"
                ? planMetaShouldOpenBuilder
                  ? "Saqlash va tahrirlash"
                  : "Nomni saqlash"
                : "Saqlash va davom etish"}
            </Button>
            <Button variant="outline" onClick={() => setIsPlanMetaOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>
      <Drawer
        open={isCancelPlanOpen}
        onOpenChange={setIsCancelPlanOpen}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>{currentPlan ? currentPlan.name : "Reja"}</DrawerTitle>
            <DrawerDescription>
              {isCurrentPlanCoachAssigned
                ? "Murabbiy yuborgan reja bilan ishlash usulini tanlang."
                : "Reja bilan nima qilmoqchisiz?"}
            </DrawerDescription>
          </DrawerHeader>
          <NutritionDrawerBody className="flex flex-col gap-3">
            {isCurrentPlanCoachAssigned ? (
              <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 text-sm text-muted-foreground">
                Murabbiy yuborgan reja o&apos;z holicha saqlanadi. Uni
                o&apos;zgartirish uchun nusxa olib, keyin tahrirlashingiz
                mumkin.
              </div>
            ) : null}
            {isCurrentPlanUpdateAvailable ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300 group"
                disabled={isApplyingCoachUpdate}
                onClick={handleApplyCoachUpdate}
              >
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <RefreshCwIcon className="size-5 text-blue-600 dark:text-blue-300" />
                </div>
                Yangilanishni qo&apos;llash
              </Button>
            ) : null}
            {currentPlan?.status === "active" && (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
                onClick={async () => {
                  try {
                    await pausePlan(currentPlan.id);
                    setIsCancelPlanOpen(false);
                    toast.success("Reja to'xtatildi", {
                      description: "Qoralama sifatida saqlandi",
                    });
                  } catch {
                    toast.error("Rejani to'xtatib bo'lmadi");
                  }
                }}
              >
                <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <PauseIcon className="size-5 text-amber-500" />
                </div>
                Rejani to'xtatish
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
              onClick={handleOpenBuilderManual}
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                {isCurrentPlanCoachAssigned ? (
                  <CopyIcon className="size-5 text-primary" />
                ) : (
                  <PencilIcon className="size-5 text-primary" />
                )}
              </div>
              {isCurrentPlanCoachAssigned
                ? "Nusxalab tahrirlash"
                : "Reja tarkibini tahrirlash"}
            </Button>
            {!isCurrentPlanCoachAssigned ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
                onClick={() => openPlanMetaEditDrawer(false)}
              >
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <PencilIcon className="size-5 text-primary" />
                </div>
                Nomini o'zgartirish
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
              disabled={isDuplicatingPlan}
              onClick={handleDuplicateCurrentPlan}
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <CopyIcon className="size-5 text-primary" />
              </div>
              Nusxalash
            </Button>
            {currentPlan?.status !== "archived" &&
            !isCurrentPlanCoachAssigned ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 transition-all font-bold text-[15px] border-border/50 group"
                disabled={isArchivingPlan}
                onClick={handleArchiveCurrentPlan}
              >
                <div className="size-10 rounded-full bg-muted flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <ArchiveIcon className="size-5 text-foreground" />
                </div>
                Arxivlash
              </Button>
            ) : null}
            {!isCurrentPlanCoachAssigned ? (
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-destructive/5 hover:border-destructive/30 transition-all font-bold text-[15px] text-destructive border-border/50 group"
                onClick={async () => {
                  try {
                    if (currentPlan?.id) {
                      await removePlan(currentPlan.id);
                      setSelectedPlanId(null);
                    }
                    setIsCancelPlanOpen(false);
                    toast.success("Reja o'chirildi");
                  } catch {
                    toast.error("Rejani o'chirib bo'lmadi");
                  }
                }}
              >
                <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Trash2Icon className="size-5 text-destructive" />
                </div>
                Umuman o'chirish
              </Button>
            ) : null}
          </NutritionDrawerBody>
          <DrawerFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelPlanOpen(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>

      <Drawer
        open={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <NutritionFilterDrawer
            activeFilters={sourceFilters}
            onToggleFilter={(key) =>
              setSourceFilters((current) =>
                current.includes(key)
                  ? current.filter((f) => f !== key)
                  : [...current, key],
              )
            }
          />
        </NutritionDrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default Index;
