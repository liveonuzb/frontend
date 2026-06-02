import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/store";
import useHealthGoals from "@/hooks/app/use-health-goals";
import {
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import { useGetQuery } from "@/hooks/api";
import {
  PlusIcon,
  FlameIcon,
  AwardIcon,
  ActivityIcon,
  SparklesIcon,
  CalendarDaysIcon,
} from "lucide-react";
import { triggerTelegramHapticFeedback } from "@/lib/telegram-haptics";
import PageTransition from "@/components/page-transition";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import AnimatedWaterWidget from "@/components/animated-water-widget";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import WaterSettingsDrawer from "./water-settings-drawer";
import WaterAnalyticsSection from "./water-analytics-section";
import { toast } from "sonner";
import first from "lodash/first";
import get from "lodash/get";
import sumBy from "lodash/sumBy";
import clamp from "lodash/clamp";
import round from "lodash/round";
import split from "lodash/split";
import isUndefined from "lodash/isUndefined";
import gt from "lodash/gt";
import gte from "lodash/gte";
import lt from "lodash/lt";
import { TrackingPageLayout } from "@/components/tracking-page-shell";

const formatWaterDateLabel = (date) =>
  date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
  });

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    goals: { waterMl: DAILY_GOAL_ML, cupSize },
  } = useHealthGoals();
  const { addWaterCup } = useDailyTrackingActions();

  const [date, setDate] = React.useState(new Date());
  const [isSavingWater, setIsSavingWater] = React.useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const dateKey = first(split(date.toISOString(), "T"));
  const { dayData } = useDailyTrackingDay(dateKey);
  const { data: hydrationInsightData, isLoading: isInsightLoading } =
    useGetQuery({
      url: "/daily-tracking/water/insight",
      params: { date: dateKey, days: 7 },
      queryProps: {
        queryKey: ["water", "insight", dateKey, 7],
      },
    });

  const waterLog = get(dayData, "waterLog", []);
  const hydrationInsight =
    get(hydrationInsightData, "data.data") ??
    get(hydrationInsightData, "data") ??
    null;

  const currentMl = sumBy(waterLog, (entry) => get(entry, "amountMl", cupSize));
  const pct = clamp((currentMl / DAILY_GOAL_ML) * 100, 0, 100);
  const remaining = clamp(DAILY_GOAL_ML - currentMl, 0, DAILY_GOAL_ML);

  const prevPct = React.useRef(pct);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/water", title: "Suv" },
    ]);

    // Trigger confetti when goal is reached for the first time
    if (
      gte(pct, 100) &&
      lt(get(prevPct, "current"), 100) &&
      !isUndefined(get(prevPct, "current"))
    ) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"], // Water theme colors
      });
    }
    prevPct.current = pct;
  }, [setBreadcrumbs, pct]);

  const handleAdd = async (amount = cupSize) => {
    try {
      setIsSavingWater(true);
      await addWaterCup(dateKey, amount);
      triggerTelegramHapticFeedback("success");
    } catch {
      triggerTelegramHapticFeedback("error");
      toast.error("Suvni saqlab bo'lmadi");
    } finally {
      setIsSavingWater(false);
    }
  };

  const goalHit = gte(currentMl, DAILY_GOAL_ML);
  const hydrationRate = gt(DAILY_GOAL_ML, 0)
    ? round((currentMl / DAILY_GOAL_ML) * 100)
    : 0;

  const displayRemaining = remaining;
  const formatStat = (val) => val;
  const dateLabel = formatWaterDateLabel(date);
  const aiInsightText =
    get(hydrationInsight, "mainInsight") ??
    (gt(remaining, 0)
      ? "Kun bo'yi ozdan-ozdan suv ichish foydaliroq. Keyingi stakaningizni 1-2 soatdan so'ng iching!"
      : "Ajoyib ish! Kunlik suv maqsadiga erishdingiz. Ertaga ham shunday davom eting!");
  const aiNextAction = get(hydrationInsight, "nextAction.label");
  const isPremiumInsight = Boolean(get(hydrationInsight, "isPremium"));

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full bg-card px-4"
            onClick={() => setIsCalendarOpen(true)}
            aria-label={`Sana tanlash: ${dateLabel}`}
          >
            <CalendarDaysIcon data-icon="inline-start" />
            {dateLabel}
          </Button>
          <WaterSettingsDrawer />
        </div>

        <TrackingPageLayout>
          <div className="relative">
            <AnimatedWaterWidget
              currentMl={currentMl}
              maxMl={DAILY_GOAL_ML}
              onAdd={() => handleAdd(cupSize)}
            />

            <motion.p
              key={gt(remaining, 0) ? "remaining" : "done"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-center text-sm font-medium text-muted-foreground"
            >
              {gt(remaining, 0)
                ? `Yana ${displayRemaining} ml suv ichish kerak 💧`
                : "Maqsadga erishdingiz! 🎉"}
            </motion.p>
          </div>

          <Button
            className="w-full"
            disabled={isSavingWater}
            onClick={() => handleAdd(cupSize)}
          >
            <PlusIcon data-icon="inline-start" />
            {cupSize} ml qo'shish
          </Button>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                <div className="mb-1 flex size-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                  <FlameIcon className="size-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Progress
                </span>
                <span className="text-lg font-bold">{hydrationRate}%</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                <div className="mb-1 flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <ActivityIcon className="size-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Ichilgan
                </span>
                <span className="text-lg font-bold">
                  {formatStat(currentMl)} ml
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
                <div className="mb-1 flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <AwardIcon className="size-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Holat
                </span>
                <span className="text-lg font-bold">
                  {goalHit ? "Bajarildi" : "Jarayonda"}
                </span>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 p-4"
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md">
              <SparklesIcon className="size-4" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xs font-bold uppercase tracking-wider text-transparent dark:from-blue-400 dark:to-purple-400">
                  AI Hydration
                </span>
                {isPremiumInsight ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Premium
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                {isInsightLoading
                  ? "AI Hydration tayyorlanmoqda..."
                  : aiInsightText}
              </p>
              {aiNextAction ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {aiNextAction}
                </p>
              ) : null}
            </div>
          </motion.div>

          <WaterAnalyticsSection days={7} />
        </TrackingPageLayout>
      </div>

      <CalendarBottomDrawer
        open={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        date={date}
        onChange={setDate}
        title="Sana tanlang"
        description="Suv qaydlarini tanlangan kunga moslab ko'ring."
      />
    </PageTransition>
  );
};

export default Index;
