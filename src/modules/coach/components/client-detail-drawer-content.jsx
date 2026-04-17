import React from "react";
import {
  entries,
  filter,
  find,
  get,
  includes,
  isArray,
  isEmpty,
  isNil,
  join,
  map,
  size,
  slice,
  split,
  toLower,
  toUpper,
  trim,
} from "lodash";
import ClientOverviewTab from "@/modules/coach/containers/client-detail/components/client-overview-tab.jsx";
import ClientPaymentsTab from "@/modules/coach/containers/client-detail/components/client-payments-tab.jsx";
import ClientPlansTab from "@/modules/coach/containers/client-detail/components/client-plans-tab.jsx";
import {
  ActivityIcon,
  BanknoteIcon,
  CalendarPlusIcon,
  CheckIcon,
  ChevronRightIcon,
  DropletsIcon,
  DumbbellIcon,
  MessageSquareIcon,
  MoonIcon,
  PlusIcon,
  RulerIcon,
  ScaleIcon,
  SearchIcon,
  TargetIcon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
  XCircleIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useCoachClientDetail,
  useCoachMealPlans,
  useCoachWorkoutPlans,
} from "@/hooks/app/use-coach.js";
import DateNav from "@/components/date-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import DatePicker from "@/components/reui/date-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CalorieGaugeWidget from "@/modules/user/containers/dashboard/calorie-gauge-widget.jsx";
import MealsWidget from "@/modules/user/containers/dashboard/meals-widget.jsx";
import WaterWidget from "@/modules/user/containers/dashboard/water-widget.jsx";
import MoodWidget from "@/modules/user/containers/dashboard/mood-widget.jsx";
import WeightWidget from "@/modules/user/containers/dashboard/weight-widget.jsx";
import BmiWidget from "@/modules/user/containers/dashboard/bmi-widget.jsx";
import WorkoutWidget from "@/modules/user/containers/dashboard/workout-widget.jsx";
import MealSection from "@/modules/user/containers/nutrition/meal-section.jsx";
import { InteractiveBodyModel } from "@/modules/user/containers/measurements/interactive-body-model.jsx";
import { measurementTypes } from "@/modules/user/containers/measurements/measurements-tab.jsx";

const getInitials = (name) => {
  const initials = join(
    map(split(get({ v: name }, "v", ""), " "), (part) => get(part, "[0]", "")),
    "",
  );
  return toUpper(initials);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
  });
};

const formatLongDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatNumber = (value, suffix = "") => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value).toLocaleString("en-US")}${suffix}`;
};

const statusLabel = (status) => {
  if (status === "active") return "Faol";
  if (status === "paused") return "Pauza";
  return "Faolsiz";
};

const moodLabel = (value) => {
  if (!value) return "Kiritilmagan";

  const map = {
    terrible: "Juda yomon",
    bad: "Yomon",
    okay: "O'rtacha",
    good: "Yaxshi",
    great: "Zo'r",
  };

  return get(map, value, value);
};

const getUnitLabel = (value) => {
  const map = {
    kg: "kg",
    cm: "sm",
    mm: "mm",
  };
  return get(map, value, value);
};

const coachMealConfig = {
  breakfast: { label: "Nonushta", emoji: "🍳", time: "06:00 - 10:00" },
  lunch: { label: "Tushlik", emoji: "🥗", time: "12:00 - 14:00" },
  dinner: { label: "Kechki ovqat", emoji: "🍲", time: "18:00 - 21:00" },
  snack: { label: "Snack", emoji: "🥜", time: "Istalgan vaqt" },
};

const PAYMENT_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;

  return {
    value: String(day),
    label: `${day}-kun`,
  };
});

const matchesMealSearch = (value, query) =>
  includes(toLower(get({ v: value }, "v", "")), toLower(trim(get({ v: query }, "v", ""))));

const SummaryMetricCard = ({ icon: Icon, label, value, hint, isLoading }) => (
  <Card className="py-6">
    <CardContent className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        )}
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="rounded-full border p-3">
        <Icon className="size-5" />
      </div>
    </CardContent>
  </Card>
);

const EmptyCardState = ({ children }) => (
  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

export default function ClientDetailDrawerContent({ clientId, onClose }) {
  const {
    detail,
    isLoading,
    isError,
    refetch,
    markPayment,
    updateClientPricing,
    cancelPayment,
    isMarkingPayment,
    isUpdatingClientPricing,
    isCancellingPayment,
    removeClient,
    isRemovingClient,
  } = useCoachClientDetail(clientId, Boolean(clientId));
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isPaymentDayOpen, setIsPaymentDayOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = React.useState(false);
  const [mealSearch, setMealSearch] = React.useState("");
  const [mealFilter, setMealFilter] = React.useState("all");
  const [measurementsView, setMeasurementsView] = React.useState("weight");
  const [paymentNote, setPaymentNote] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentPaidAt, setPaymentPaidAt] = React.useState("");
  const [paymentDay, setPaymentDay] = React.useState("");
  const [paymentToCancel, setPaymentToCancel] = React.useState(null);
  const [pricingAmount, setPricingAmount] = React.useState("");
  const [isPricingDirty, setIsPricingDirty] = React.useState(false);
  const [isMealAssignOpen, setIsMealAssignOpen] = React.useState(false);
  const [isWorkoutAssignOpen, setIsWorkoutAssignOpen] = React.useState(false);
  const hasInitializedDateRef = React.useRef(false);

  const { mealPlans, assignMealPlan, unassignMealPlan, isAssigning: isAssigningMeal } = useCoachMealPlans();
  const { workoutPlans, assignWorkoutPlan, unassignWorkoutPlan, isAssigning: isAssigningWorkout } = useCoachWorkoutPlans();

  const client = get(detail, "client");
  const measurements = get(detail, "measurements", []);
  const dailyLogs = get(detail, "dailyLogs", []);
  const assignedTemplates = get(detail, "assignedTemplates", []);
  const payments = get(detail, "payments", []);
  const overview = get(detail, "overview", {});
  const goals = get(overview, "healthGoals");
  const activeMealPlan = get(overview, "activeMealPlan");
  const paymentSummary = get(overview, "paymentSummary");
  const latestAssignedTemplate = get(assignedTemplates, "[0]");
  const pricingAmountRaw = trim(String(get({ v: pricingAmount }, "v", "")));
  const hasPricingAmount = pricingAmountRaw !== "";
  const pricingAmountNumber = Number(pricingAmountRaw);
  const isPricingAmountValid =
    hasPricingAmount && Number.isFinite(pricingAmountNumber) && pricingAmountNumber >= 0;

  const currentPricingAmountRaw =
    !isNil(get(paymentSummary, "agreedAmount"))
      ? String(get(paymentSummary, "agreedAmount"))
      : "";
  const isPricingChanged =
    isPricingDirty && pricingAmountRaw !== currentPricingAmountRaw;
  const paymentAmountRaw = String(get({ v: paymentAmount }, "v", "")).trim();
  const hasPaymentAmount = paymentAmountRaw !== "";
  const paymentAmountNumber = Number(paymentAmountRaw);
  const isPaymentAmountValid =
    !hasPaymentAmount ||
    (Number.isFinite(paymentAmountNumber) && paymentAmountNumber >= 0);

  React.useEffect(() => {
    if (hasInitializedDateRef.current || isEmpty(dailyLogs)) return;

    const firstDate = new Date(dailyLogs[0].date);
    if (Number.isNaN(firstDate.getTime())) return;

    setSelectedDate(firstDate);
    hasInitializedDateRef.current = true;
  }, [dailyLogs]);

  React.useEffect(() => {
    if (isPricingDirty) return;

    setPricingAmount(currentPricingAmountRaw);
  }, [currentPricingAmountRaw, isPricingDirty]);

  const selectedDateKey = React.useMemo(
    () => get(split(selectedDate.toISOString(), "T"), "[0]"),
    [selectedDate],
  );

  const selectedLog = React.useMemo(
    () => {
      const selectedLog = get(
        {
          v: find(dailyLogs, (log) =>
            String(get(log, "date")).startsWith(selectedDateKey),
          ),
        },
        "v",
        get(dailyLogs, "[0]", null),
      );
      return selectedLog;
    },
    [dailyLogs, selectedDateKey],
  );

  const selectedMeasurement = React.useMemo(() => {
    const reversed = [...measurements].reverse();
    const selectedMeasurement = get(
      {
        v: find(reversed, (item) =>
          String(get(item, "date")).startsWith(selectedDateKey),
        ),
      },
      "v",
      get(reversed, "[0]", null),
    );
    return selectedMeasurement;
  }, [measurements, selectedDateKey]);

  const selectedDayData = React.useMemo(
    () => ({
      meals: get(selectedLog, "meals", {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      }),
      waterLog:
        get(selectedLog, "waterMl") != null
          ? [{ id: `${get(selectedLog, "id")}-water`, amountMl: get(selectedLog, "waterMl") }]
          : [],
      steps: get(selectedLog, "steps", 0),
      sleepHours: get(selectedLog, "sleepHours", 0),
      mood: get(selectedLog, "mood"),
    }),
    [selectedLog],
  );

  const maxDate = React.useMemo(() => {
    const firstLogDate = get(dailyLogs, "[0].date");
    const current = firstLogDate ? new Date(firstLogDate) : new Date();
    return Number.isNaN(current.getTime()) ? new Date() : current;
  }, [dailyLogs]);

  const dashboardMetrics = [
    {
      label: "Kaloriya",
      value: `${formatNumber(get(selectedLog, "calories"))} kcal`,
      hint: get(goals, "calories") ? `Maqsad ${formatNumber(get(goals, "calories"))} kcal` : null,
      icon: UtensilsCrossedIcon,
    },
    {
      label: "Suv",
      value: `${formatNumber(get(selectedLog, "waterMl"))} ml`,
      hint: get(goals, "waterMl") ? `Maqsad ${formatNumber(get(goals, "waterMl"))} ml` : null,
      icon: DropletsIcon,
    },
    {
      label: "Qadam",
      value: formatNumber(get(selectedLog, "steps")),
      hint: get(goals, "steps") ? `Maqsad ${formatNumber(get(goals, "steps"))}` : null,
      icon: ActivityIcon,
    },
    {
      label: "Uyqu",
      value:
        get(selectedLog, "sleepHours") != null
          ? `${formatNumber(get(selectedLog, "sleepHours"))} soat`
          : "—",
      hint: "Tanlangan sana bo'yicha",
      icon: MoonIcon,
    },
  ];

  const nutritionSections = React.useMemo(
    () =>
      map(entries(coachMealConfig), ([type, config]) => [
        type,
        {
          ...config,
          foods: get(selectedLog, `meals.${type}`, []),
        },
      ]),
    [selectedLog],
  );

  const filteredNutritionSections = React.useMemo(() => {
    const normalizedSearch = toLower(trim(get({ v: mealSearch }, "v", "")));

    return nutritionSections.reduce((sections, [type, section]) => {
      if (mealFilter !== "all" && type !== mealFilter) {
        return sections;
      }

      const visibleFoods = normalizedSearch
        ? filter(section.foods || [],
            (food) =>
              matchesMealSearch(food.name, normalizedSearch) ||
              matchesMealSearch(food.originalName, normalizedSearch),
          )
        : section.foods || [];

      const sectionMatches = matchesMealSearch(section.label, normalizedSearch);

      if (normalizedSearch && !sectionMatches && isEmpty(visibleFoods)) {
        return sections;
      }

      sections.push([
        type,
        {
          ...section,
          foods: visibleFoods,
        },
      ]);
      return sections;
    }, []);
  }, [mealFilter, mealSearch, nutritionSections]);

  const selectedMeasurementValues = React.useMemo(
    () =>
      measurementTypes.reduce((acc, item) => {
        const value = get(selectedMeasurement, get(item, "id"));
        acc[get(item, "id")] = value != null && value !== 0 ? String(value) : "";
        return acc;
      }, {}),
    [selectedMeasurement],
  );


  const handleRemoveClient = async () => {
    try {
      await removeClient();
      toast.success("Shogirt ro'yxatdan chiqarildi");
      setIsRemoveOpen(false);
      if (onClose) onClose();
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "Shogirtni chiqarib bo'lmadi"),
      );
    }
  };

  const handleMarkPayment = async () => {
    if (!isPaymentAmountValid) {
      toast.error("To'lov summasini to'g'ri kiriting.");
      return;
    }

    try {
      await markPayment({
        amount: hasPaymentAmount ? Math.round(paymentAmountNumber) : undefined,
        paidAt: paymentPaidAt || undefined,
        note: paymentNote || undefined,
      });
      toast.success("To'lov belgilandi");
      setPaymentNote("");
      setPaymentPaidAt("");
      setPaymentAmount("");
      setIsPaymentOpen(false);
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "To'lovni belgilab bo'lmadi"),
      );
    }
  };

  const handleUpdatePaymentDay = async () => {
    try {
      await updateClientPricing({
        paymentDay: paymentDay ? Number(paymentDay) : null,
      });
      toast.success(
        paymentDay
          ? "To'lov kuni yangilandi."
          : "To'lov kuni olib tashlandi.",
      );
      setIsPaymentDayOpen(false);
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "To'lov kunini saqlab bo'lmadi"),
      );
    }
  };

  const handleCancelPayment = async () => {
    if (!get(paymentToCancel, "id")) return;

    try {
      await cancelPayment(paymentToCancel.id, {});
      toast.success("To'lov bekor qilindi.");
      setPaymentToCancel(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "To'lovni bekor qilib bo'lmadi"),
      );
    }
  };

  const handleUpdatePricing = async () => {
    if (!isPricingAmountValid) {
      toast.error("Narxni to'g'ri kiriting yoki bo'sh qoldiring.");
      return;
    }

    try {
      await updateClientPricing({
        agreedAmount: hasPricingAmount ? Math.round(pricingAmountNumber) : null,
      });
      toast.success(
        hasPricingAmount
          ? "Mijoz narxi yangilandi."
          : "Mijoz narxi kelishuv asosida qoldirildi.",
      );
      setIsPricingDirty(false);
      setIsPricingOpen(false);
    } catch (error) {
      toast.error(
        get(error, "response.data.message", "Mijoz narxini yangilab bo'lmadi"),
      );
    }
  };
  const handleAssignMealPlan = async (planId) => {
    try {
      await assignMealPlan(planId, [clientId]);
      toast.success("Meal plan biriktirildi");
      setIsMealAssignOpen(false);
      await refetch();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleAssignWorkoutPlan = async (planId) => {
    try {
      await assignWorkoutPlan(planId, [clientId]);
      toast.success("Workout reja biriktirildi");
      setIsWorkoutAssignOpen(false);
      await refetch();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleUnassignMealPlan = async (planId) => {
    try {
      await unassignMealPlan(planId, clientId);
      toast.success("Ovqatlanish rejasi biriktirishdan olib tashlandi");
      await refetch();
    } catch (error) {
      toast.error(get(error, "response.data.message", "Rejani olib tashlab bo'lmadi"));
    }
  };

  const handleUnassignWorkoutPlan = async (planId) => {
    try {
      await unassignWorkoutPlan(planId, clientId);
      toast.success("Workout rejasi biriktirishdan olib tashlandi");
      await refetch();
    } catch (error) {
      toast.error(get(error, "response.data.message", "Rejani olib tashlab bo'lmadi"));
    }
  };



  if (isError) {
    return (
      <div className="flex h-full flex-col justify-center gap-4 p-6">
        <div>
          <h2 className="text-xl font-semibold">Mijoz topilmadi</h2>
          <p className="text-sm text-muted-foreground">
            Mijoz tafsilotlarini yuklab bo&apos;lmadi.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()}>Qayta urinish</Button>
          <Button variant="outline" onClick={onClose}>
            Yopish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <DrawerHeader className="shrink-0 border-b px-6 py-5 text-left">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1">
              <DrawerTitle>Mijoz tafsilotlari</DrawerTitle>
              <DrawerDescription>
                To&apos;lov, ovqatlanish, rejalar va weekly check-in ma&apos;lumotlari.
              </DrawerDescription>
            </div>
            <DateNav
              date={selectedDate}
              onChange={setSelectedDate}
              maxDate={maxDate}
              className="justify-between xl:justify-end"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-xl bg-muted/40 p-1">
              <TabsTrigger value="dashboard" className="px-4 py-2 font-medium">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="px-4 py-2 font-medium">
                Ovqatlanish
              </TabsTrigger>
              <TabsTrigger value="payment" className="px-4 py-2 font-medium">
                To&apos;lovlar
              </TabsTrigger>
              <TabsTrigger value="measurements" className="px-4 py-2 font-medium">
                O&apos;lchamlar
              </TabsTrigger>
              <TabsTrigger value="plans" className="px-4 py-2 font-medium">
                Rejalar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsContent value="dashboard" className="space-y-6">
                <ClientOverviewTab
                  client={client}
                  isLoading={isLoading}
                  selectedLog={selectedLog}
                  selectedDateKey={selectedDateKey}
                  selectedDayData={selectedDayData}
                  selectedMeasurement={selectedMeasurement}
                  measurements={measurements}
                  goals={goals}
                  paymentSummary={paymentSummary}
                  onOpenPricing={() => {
                    setPricingAmount(currentPricingAmountRaw);
                    setIsPricingDirty(false);
                    setIsPricingOpen(true);
                  }}
                  onOpenPayment={() => {
                    setPaymentAmount(
                      !isNil(get(paymentSummary, "agreedAmount")) &&
                      get(paymentSummary, "agreedAmount") !== 0
                        ? String(get(paymentSummary, "agreedAmount"))
                        : "",
                    );
                    setPaymentPaidAt(new slice(Date().toISOString(), 0, 10));
                    setPaymentNote("");
                    setIsPaymentOpen(true);
                  }}
                  onOpenPaymentDay={() => {
                    setPaymentDay(
                      get(paymentSummary, "dayOfMonth")
                        ? String(get(paymentSummary, "dayOfMonth"))
                        : "",
                    );
                    setIsPaymentDayOpen(true);
                  }}
                  onOpenPlans={() => setActiveTab("plans")}
                  onRemove={() => setIsRemoveOpen(true)}
                />
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-28 w-full rounded-[2rem]" />
                    <Skeleton className="h-24 w-full rounded-[2rem]" />
                    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                      <Skeleton className="h-[360px] w-full rounded-[2rem]" />
                      <div className="space-y-6">
                        {map(Array.from({ length: 4 }), (_, index) => (
                          <Skeleton
                            key={`client-nutrition-skeleton-${index}`}
                            className="h-48 w-full rounded-[2rem]"
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : selectedLog ? (
                  <>
                    {activeMealPlan || size(assignedTemplates) > 0 ? (
                      <div className="rounded-[2rem] border p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Biriktirilgan reja
                            </p>
                            <h3 className="mt-1 truncate text-base font-black">
                              {get(activeMealPlan, "name") ||
                                get(latestAssignedTemplate, "title") ||
                                "Murabbiy reja biriktirgan"}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {activeMealPlan
                                ? `Faol reja • ${get(activeMealPlan, "source", "coach")}`
                                : `${size(assignedTemplates)} ta biriktirilgan template`}
                              {get(latestAssignedTemplate, "assignedAt")
                                ? ` • ${formatLongDate(get(latestAssignedTemplate, "assignedAt"))}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {activeMealPlan ? (
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
                    ) : null}

                    <div className="rounded-[2rem] border p-4 sm:p-5">
                      <div className="flex flex-col gap-4">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Ovqat yoki bo'lim bo'yicha qidiring..."
                            className="pl-9"
                            value={mealSearch}
                            onChange={(event) => setMealSearch(event.target.value)}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant={mealFilter === "all" ? "default" : "outline"}
                            onClick={() => setMealFilter("all")}
                          >
                            Barchasi
                          </Button>
                          {map(entries(coachMealConfig), ([type, config]) => (
                            <Button
                              key={type}
                              type="button"
                              variant={mealFilter === type ? "default" : "outline"}
                              onClick={() => setMealFilter(type)}
                            >
                              {config.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[380px_1fr]">
                      <div className="space-y-6 xl:sticky xl:top-0">
                        <CalorieGaugeWidget
                          totalCalories={get(selectedLog, "calories", 0)}
                          goals={goals || {}}
                          macros={{
                            protein: {
                              current: get(selectedLog, "macros.protein", 0),
                              target: get(goals, "protein", 0),
                            },
                            carbs: {
                              current: get(selectedLog, "macros.carbs", 0),
                              target: get(goals, "carbs", 0),
                            },
                            fat: {
                              current: get(selectedLog, "macros.fat", 0),
                              target: get(goals, "fat", 0),
                            },
                          }}
                          onOpen={() => {}}
                        />
                      </div>

                      <div className="flex flex-col gap-6">
                        {isEmpty(filteredNutritionSections) ? (
                          <EmptyCardState>
                            Tanlangan filter bo&apos;yicha ovqat topilmadi.
                          </EmptyCardState>
                        ) : (
                          map(filteredNutritionSections, ([type, section]) => (
                            <div key={type} className="space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{get(section, "emoji")}</span>
                                <div>
                                  <h3 className="font-semibold">{get(section, "label")}</h3>
                                  <p className="text-xs text-muted-foreground">{get(section, "time")}</p>
                                </div>
                              </div>
                              {size(get(section, "foods")) > 0 ? (
                                <div className="space-y-3">
                                  {map(get(section, "foods"), (food, i) => (
                                    <div
                                      key={`${type}-food-${i}`}
                                      className="flex items-center justify-between gap-4 rounded-xl border p-4"
                                    >
                                      <div className="flex items-center gap-3">
                                        <UtensilsCrossedIcon className="size-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium">{get(food, "name")}</p>
                                          <p className="text-xs text-muted-foreground line-clamp-1">
                                            {get(food, "quantity")} {get(food, "unit")}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">{formatNumber(get(food, "calories"))} kcal</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                          P: {formatNumber(get(food, "macros.protein"))}g · C: {formatNumber(get(food, "macros.carbs"))}g · F: {formatNumber(get(food, "macros.fat"))}g
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <EmptyCardState>Ushbu vaqt uchun ovqat kiritilmagan.</EmptyCardState>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {activeMealPlan || size(assignedTemplates) > 0 ? (
                      <div className="rounded-[2rem] border p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Biriktirilgan reja
                            </p>
                            <h3 className="mt-1 truncate text-base font-black">
                              {get(activeMealPlan, "name") ||
                                get(latestAssignedTemplate, "title") ||
                                "Murabbiy reja biriktirgan"}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {activeMealPlan
                                ? `Faol reja • ${get(activeMealPlan, "source", "coach")}`
                                : `${size(assignedTemplates)} ta biriktirilgan template`}
                              {get(latestAssignedTemplate, "assignedAt")
                                ? ` • ${formatLongDate(get(latestAssignedTemplate, "assignedAt"))}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {activeMealPlan ? (
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
                    ) : null}

                    <EmptyCardState>
                      Tanlangan sana uchun ovqatlanish logi topilmadi.
                    </EmptyCardState>
                  </>
                )}
              </TabsContent>

              <TabsContent value="payment" className="space-y-6">
                <ClientPaymentsTab
                  isLoading={isLoading}
                  payments={payments}
                  paymentSummary={paymentSummary}
                  onOpenPaymentDay={() => {
                    setPaymentDay(
                      get(paymentSummary, "dayOfMonth")
                        ? String(get(paymentSummary, "dayOfMonth"))
                        : "",
                    );
                    setIsPaymentDayOpen(true);
                  }}
                  onOpenPayment={() => {
                    setPaymentAmount(
                      !isNil(get(paymentSummary, "agreedAmount"))
                        ? String(get(paymentSummary, "agreedAmount"))
                        : "",
                    );
                    setPaymentPaidAt(new slice(Date().toISOString(), 0, 10));
                    setPaymentNote("");
                    setIsPaymentOpen(true);
                  }}
                  onCancelPayment={setPaymentToCancel}
                />
              </TabsContent>

              <TabsContent value="measurements" className="space-y-6">
                <Tabs
                  value={measurementsView}
                  onValueChange={setMeasurementsView}
                  className="space-y-6"
                >
                  <TabsList className="w-full justify-start rounded-xl bg-muted/40 p-1">
                    <TabsTrigger value="weight">
                      <ScaleIcon className="size-3.5" />
                      Vazn
                    </TabsTrigger>
                    <TabsTrigger value="measurements">
                      <RulerIcon className="size-3.5" />
                      O&apos;lchamlar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="weight" className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                      <WeightWidget
                        currentWeightValue={
                          get(selectedMeasurement, "weight", get(client, "currentWeight", 0))
                        }
                        targetWeightValue={get(client, "targetWeight", 0)}
                        history={measurements}
                        interactive={false}
                      />
                      <BmiWidget
                        currentWeightValue={
                          get(selectedMeasurement, "weight", get(client, "currentWeight", 0))
                        }
                        heightCmValue={get(client, "heightCm", 0)}
                        interactive={false}
                      />
                    </div>

                    <Card className="py-6">
                      <CardHeader>
                        <CardTitle>Vazn progressi</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[320px]">
                        {isLoading ? (
                          <Skeleton className="h-full w-full" />
                        ) : isEmpty(measurements) ? (
                          <EmptyCardState>O&apos;lchamlar kiritilmagan.</EmptyCardState>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={measurements}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" tickFormatter={formatDate} />
                              <YAxis />
                              <Tooltip
                                labelFormatter={(value) => formatDate(value)}
                                formatter={(value) => [`${value} kg`, "Vazn"]}
                              />
                              <Line
                                type="monotone"
                                dataKey="weight"
                                stroke="currentColor"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="measurements" className="space-y-6">
                    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                      <InteractiveBodyModel
                        values={selectedMeasurementValues}
                        onChange={() => {}}
                        editing={false}
                        onEdit={undefined}
                        measurementTypes={measurementTypes}
                        genderOverride={get(client, "gender")}
                        hideActionButton
                      />

                      <Card className="py-6">
                        <CardHeader>
                          <CardTitle>O&apos;lchamlar tarixi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {isLoading ? (
                            map(Array.from({ length: 4 }), (_, index) => (
                              <Skeleton
                                key={`client-measurements-skeleton-${index}`}
                                className="h-16 w-full"
                              />
                            ))
                          ) : isEmpty(measurements) ? (
                            <EmptyCardState>O&apos;lchamlar kiritilmagan.</EmptyCardState>
                          ) : (
                            map(measurements, (row) => (
                              <button
                                key={get(row, "id")}
                                type="button"
                                onClick={() => {
                                  const nextDate = new Date(get(row, "date"));
                                  if (!Number.isNaN(nextDate.getTime())) {
                                    setSelectedDate(nextDate);
                                  }
                                }}
                                className={`grid w-full gap-3 rounded-xl border p-4 text-left transition-colors md:grid-cols-4 ${
                                  String(get(row, "date")).startsWith(selectedDateKey)
                                    ? "border-primary/30 bg-primary/5"
                                    : "hover:bg-muted/40"
                                }`}
                              >
                                <div>
                                  <p className="text-xs text-muted-foreground">Sana</p>
                                  <p className="font-medium">{formatDate(get(row, "date"))}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Vazn</p>
                                  <p className="font-medium">
                                    {!isNil(get(row, "weight")) ? `${get(row, "weight")} kg` : "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Bel / Ko&apos;krak
                                  </p>
                                  <p className="font-medium">
                                    {!isNil(get(row, "waist")) ? `${get(row, "waist")}` : "—"} /{" "}
                                    {!isNil(get(row, "chest")) ? `${get(row, "chest")}` : "—"} cm
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Son / Qo&apos;l
                                  </p>
                                  <p className="font-medium">
                                    {!isNil(get(row, "thigh")) ? `${get(row, "thigh")}` : "—"} /{" "}
                                    {!isNil(get(row, "arm")) ? `${get(row, "arm")}` : "—"} cm
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="plans" className="space-y-6">
                <ClientPlansTab
                  isLoading={isLoading}
                  assignedTemplates={assignedTemplates}
                  activeMealPlan={activeMealPlan}
                  overview={overview}
                  onOpenMealAssign={() => setIsMealAssignOpen(true)}
                  onOpenWorkoutAssign={() => setIsWorkoutAssignOpen(true)}
                  onUnassignMealPlan={handleUnassignMealPlan}
                  onUnassignWorkoutPlan={handleUnassignWorkoutPlan}
                />
              </TabsContent>


            </Tabs>
          </div>
        </div>
      </div>



      <Drawer open={isPaymentOpen} onOpenChange={setIsPaymentOpen} direction="bottom">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
          <DrawerHeader>
            <DrawerTitle>To&apos;lovni qayd etish</DrawerTitle>
            <DrawerDescription>
              Qo&apos;lda to&apos;lov qo&apos;shing va tarixga kiriting.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>To&apos;lov summasi (so&apos;m)</Label>
              <NumberField
                minValue={0}
                step={10000}
                value={paymentAmount !== "" ? Number(paymentAmount) : undefined}
                onValueChange={(value) => {
                  setPaymentAmount(
                    value !== undefined ? String(Math.round(value)) : "",
                  );
                }}
                formatOptions={{
                  useGrouping: true,
                  maximumFractionDigits: 0,
                }}
              >
                <NumberFieldGroup className="h-11 rounded-2xl bg-card">
                  <NumberFieldDecrement className="rounded-s-2xl px-3" />
                  <NumberFieldInput
                    className="px-3 text-sm"
                    placeholder="Masalan: 500000"
                  />
                  <NumberFieldIncrement className="rounded-e-2xl px-3" />
                </NumberFieldGroup>
              </NumberField>
            </div>
            <div className="space-y-2">
              <Label>To&apos;lov sanasi</Label>
              <DatePicker
                value={paymentPaidAt}
                onChange={setPaymentPaidAt}
                placeholder="Sanani kiriting"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-note">Izoh</Label>
              <Textarea
                id="payment-note"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Masalan, Payme orqali to'landi"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleMarkPayment}
              disabled={isMarkingPayment || !isPaymentAmountValid}
            >
              {isMarkingPayment ? "Saqlanmoqda..." : "To&apos;lov qo&apos;shish"}
            </Button>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isPaymentDayOpen}
        onOpenChange={setIsPaymentDayOpen}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
          <DrawerHeader>
            <DrawerTitle>To&apos;lov kunini belgilash</DrawerTitle>
            <DrawerDescription>
              Mijoz uchun oylik to&apos;lov kunini 1-31 oralig&apos;ida tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="coach-client-payment-day-edit">To&apos;lov kuni</Label>
              <select
                id="coach-client-payment-day-edit"
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
                value={paymentDay}
                onChange={(event) => setPaymentDay(event.target.value)}
              >
                <option value="">Belgilanmagan</option>
                {map(PAYMENT_DAY_OPTIONS, (option) => (
                  <option key={get(option, "value")} value={get(option, "value")}>
                    {get(option, "label")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleUpdatePaymentDay}>Saqlash</Button>
            <Button variant="outline" onClick={() => setIsPaymentDayOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={isPricingOpen} onOpenChange={setIsPricingOpen} direction="bottom">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
          <DrawerHeader>
            <DrawerTitle>Mijoz narxini belgilash</DrawerTitle>
            <DrawerDescription>
              Har bir mijoz uchun alohida narx belgilashingiz mumkin.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>Kelishilgan summa (so&apos;m)</Label>
              <NumberField
                minValue={0}
                step={10000}
                value={pricingAmount !== "" ? Number(pricingAmount) : undefined}
                onValueChange={(value) => {
                  setPricingAmount(
                    value !== undefined ? String(Math.round(value)) : "",
                  );
                  setIsPricingDirty(true);
                }}
                formatOptions={{
                  useGrouping: true,
                  maximumFractionDigits: 0,
                }}
              >
                <NumberFieldGroup className="h-11 rounded-2xl bg-card">
                  <NumberFieldDecrement className="rounded-s-2xl px-3" />
                  <NumberFieldInput
                    className="px-3 text-sm"
                    placeholder="Kelishiladi (bo'sh qoldiring)"
                  />
                  <NumberFieldIncrement className="rounded-e-2xl px-3" />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleUpdatePricing}
              disabled={
                !isPricingAmountValid ||
                !isPricingChanged ||
                isUpdatingClientPricing
              }
            >
              {isUpdatingClientPricing ? "Saqlanmoqda..." : "Narxni saqlash"}
            </Button>
            <Button variant="outline" onClick={() => setIsPricingOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>



      <AlertDialog
        open={Boolean(paymentToCancel)}
        onOpenChange={(open) => !open && setPaymentToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>To&apos;lovni bekor qilish</AlertDialogTitle>
            <AlertDialogDescription>
              {get(paymentToCancel, "paidAt")
                ? `${formatLongDate(paymentToCancel.paidAt)} to'lov yozuvi bekor qilinadi.`
                : "Ushbu to'lov yozuvi bekor qilinadi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingPayment}>
              Orqaga
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleCancelPayment();
              }}
              disabled={isCancellingPayment}
            >
              {isCancellingPayment ? "Saqlanmoqda..." : "Bekor qilish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Shogirtni ro&apos;yxatdan chiqarasizmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Siz va shogirt bir-biringiz ro&apos;yxatidan chiqasiz. Siz yuborgan
              coach rejalari userda oddiy reja bo&apos;lib qoladi, lekin endi sync
              qilinmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRemoveClient();
              }}
              disabled={isRemovingClient}
            >
              {isRemovingClient ? "Chiqarilmoqda..." : "Ro'yxatdan chiqarish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Drawer
        open={isMealAssignOpen}
        onOpenChange={setIsMealAssignOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Meal plan biriktirish</DrawerTitle>
            <DrawerDescription>
              Mavjud template&apos;lardan birini tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-8 pt-2">
            <div className="grid gap-3">
              {size(mealPlans) === 0 ? (
                <EmptyCardState>
                  Sizda hali meal plan template&apos;lar yo&apos;q.
                </EmptyCardState>
              ) : (
                map(mealPlans, (plan) => (
                  <button
                    key={get(plan, "id")}
                    onClick={() => handleAssignMealPlan(get(plan, "id"))}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10">
                        <UtensilsCrossedIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{get(plan, "title")}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{get(plan, "description")}</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={isWorkoutAssignOpen}
        onOpenChange={setIsWorkoutAssignOpen}
        direction="bottom"
      >
        <DrawerContent className="mx-auto max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Workout reja biriktirish</DrawerTitle>
            <DrawerDescription>
              Mavjud template&apos;lardan birini tanlang.
            </DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto px-4 pb-8 pt-2">
            <div className="grid gap-3">
              {size(workoutPlans) === 0 ? (
                <EmptyCardState>
                  Sizda hali workout template&apos;lar yo&apos;q.
                </EmptyCardState>
              ) : (
                map(workoutPlans, (plan) => (
                  <button
                    key={get(plan, "id")}
                    onClick={() => handleAssignWorkoutPlan(get(plan, "id"))}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10">
                        <DumbbellIcon className="size-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{get(plan, "title")}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{get(plan, "description")}</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
