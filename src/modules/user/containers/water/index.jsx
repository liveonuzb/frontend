import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useBreadcrumbStore } from "@/store";
import useHealthGoals from "@/hooks/app/use-health-goals";
import {
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import {
  PlusIcon,
  DropletIcon,
  TrendingUpIcon,
  ClockIcon,
  FlameIcon,
  AwardIcon,
  ActivityIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMoodMeta } from "@/lib/mood";
import PageTransition from "@/components/page-transition";
import AnimatedWaterWidget from "@/components/animated-water-widget";
import EmptyState from "@/components/empty-state";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import WaterSettingsDrawer from "./water-settings-drawer";
import WaterAnalyticsSection from "./water-analytics-section";
import { toast } from "sonner";
import {
  first,
  get,
  sumBy,
  clamp,
  isEmpty,
  last,
  round,
  ceil,
  split,
  isNil,
  isUndefined,
  gt,
  gte,
  lt,
  min,
  map,
  nth,
} from "lodash";
import { format } from "date-fns";
import { Drop } from "iconsax-reactjs";
import {
  TrackingPageHeader,
  TrackingPageLayout,
} from "@/components/tracking-page-shell";

const formatWaterTime = (value) => {
  if (!value) return "—";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "HH:mm");
};

const WaterLogList = ({
  hasDailyEntries,
  moodMeta,
  waterLog,
  cupSize,
  onRemoveEntry,
}) => {
  if (!hasDailyEntries) {
    return (
      <EmptyState
        emoji="💧"
        title="Qaydlar yo'q"
        description="Ichishni boshlash uchun Qo'shishni bosing"
        className="py-10"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {!isNil(moodMeta) ? (
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 p-4 px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base">
              {get(moodMeta, "emoji")}
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Kayfiyat
              </span>
              <span className="font-semibold">{get(moodMeta, "label")}</span>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">Bugun</span>
        </div>
      ) : null}
      {map(waterLog, (entry, i) => (
        <div
          key={`${get(entry, "time")}-${i}`}
          className="group flex items-center justify-between border-b border-border/40 p-4 px-5 transition-colors last:border-0 hover:bg-muted/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <Drop className="size-4" />
            </div>
            <span className="font-semibold">{get(entry, "amountMl", cupSize)} ml</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-muted-foreground">
              {formatWaterTime(get(entry, "time"))}
            </span>
            <button
              onClick={() => onRemoveEntry(i)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    goals: { waterMl: DAILY_GOAL_ML, cupSize },
  } = useHealthGoals();
  const { addWaterCup, removeLastWaterCup, removeWaterLogEntry, setWaterCups } =
    useDailyTrackingActions();

  const [date, setDate] = React.useState(new Date());
  const [isSavingWater, setIsSavingWater] = React.useState(false);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = React.useState(false);

  const dateKey = first(split(date.toISOString(), "T"));
  const {
    dayData,
    isLoading: isDayLoading,
    isFetching: isDayFetching,
    isError: isDayError,
  } = useDailyTrackingDay(dateKey);

  const waterLog = get(dayData, "waterLog", []);
  const moodMeta = getMoodMeta(get(dayData, "mood"));

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
    } catch {
      toast.error("Suvni saqlab bo'lmadi");
    } finally {
      setIsSavingWater(false);
    }
  };

  const handleRemove = async () => {
    if (isEmpty(waterLog)) return;
    const lastEntry = last(waterLog);
    try {
      setIsSavingWater(true);
      await removeLastWaterCup(dateKey);
      toast.info("Suv olib tashlandi", {
        action: {
          label: "Qaytarish (Undo)",
          onClick: () => {
            void addWaterCup(dateKey, get(lastEntry, "amountMl")).catch(() => {
              toast.error("Suvni qaytarib bo'lmadi");
            });
          },
        },
        duration: 4000,
      });
    } catch {
      toast.error("Suvni o'chirib bo'lmadi");
    } finally {
      setIsSavingWater(false);
    }
  };

  const handleCupClick = async (cupIndex) => {
    try {
      setIsSavingWater(true);
      await setWaterCups(dateKey, cupIndex + 1, cupSize);
    } catch {
      toast.error("Suv holatini yangilab bo'lmadi");
    } finally {
      setIsSavingWater(false);
    }
  };

  const hasDailyEntries = !isEmpty(moodMeta) || !isEmpty(waterLog);

  const goalHit = gte(currentMl, DAILY_GOAL_ML);
  const hydrationRate = gt(DAILY_GOAL_ML, 0)
    ? round((currentMl / DAILY_GOAL_ML) * 100)
    : 0;
  const lastDrink = last(waterLog);

  const displayRemaining = remaining;
  const formatStat = (val) => val;

  const handleRemoveEntry = async (index) => {
    const entry = nth(waterLog, index);
    if (isNil(entry)) return;
    try {
      setIsSavingWater(true);
      await removeWaterLogEntry(dateKey, index);
      toast.info("Suv qaydi o'chirildi", {
        action: {
          label: "Qaytarish (Undo)",
          onClick: () => {
            void addWaterCup(dateKey, get(entry, "amountMl", cupSize)).catch(
              () => {
                toast.error("Suvni qaytarib bo'lmadi");
              },
            );
          },
        },
        duration: 4000,
      });
    } catch {
      toast.error("Suv qaydini o'chirib bo'lmadi");
    } finally {
      setIsSavingWater(false);
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6 pb-24">
        <TrackingPageHeader
          title="Suv"
          subtitle="Kunlik suv iste'molingiz"
          date={date}
          onDateChange={setDate}
          actions={
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full lg:hidden"
                onClick={() => setIsLogsDrawerOpen(true)}
                aria-label="Bugungi qaydlar"
              >
                <ClockIcon className="size-5 text-muted-foreground" />
              </Button>
              <WaterSettingsDrawer />
            </div>
          }
        />

        <TrackingPageLayout
          aside={
            <div className="space-y-6">
              <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Kunlik xulosa
                    </p>
                    <h2 className="mt-2 text-xl font-black tracking-tight">
                      {formatStat(currentMl)} / {DAILY_GOAL_ML} ml
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {goalHit
                        ? "Bugungi maqsad bajarildi."
                        : `${formatStat(remaining)} ml qoldi.`}
                    </p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                    <DropletIcon className="size-5" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-border/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Progress
                    </p>
                    <p className="mt-2 text-xl font-black">{hydrationRate}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      maqsadga yaqinlik
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-border/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Holat
                    </p>
                    <p className="mt-2 text-xl font-black">
                      {goalHit ? "Bajarildi" : "Jarayonda"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      bugungi holat
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-border/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Qolgan
                    </p>
                    <p className="mt-2 text-xl font-black">
                      {formatStat(remaining)} ml
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      keyingi qo'shishgacha
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-border/60 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Oxirgisi
                    </p>
                    <p className="mt-2 text-xl font-black">
                      {formatWaterTime(get(lastDrink, "time"))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ichilgan vaqt
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${min([hydrationRate, 100])}%` }}
                  />
                </div>

                <Button className="mt-5 w-full" onClick={() => handleAdd(cupSize)}>
                  <PlusIcon className="mr-2 size-4" />
                  {cupSize} ml qo'shish
                </Button>
              </section>

              <Card className="hidden h-[520px] flex-col lg:flex">
                <CardHeader className="shrink-0 bg-muted/30 p-5 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <ClockIcon className="size-4 text-emerald-500" />
                    Bugungi qaydlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0 no-scrollbar">
                  <WaterLogList
                    hasDailyEntries={hasDailyEntries}
                    moodMeta={moodMeta}
                    waterLog={waterLog}
                    cupSize={cupSize}
                    onRemoveEntry={handleRemoveEntry}
                  />
                </CardContent>
              </Card>
            </div>
          }
        >
          <section className="rounded-[28px] border bg-card p-5 shadow-sm sm:p-6">
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
          </section>

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
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xs font-bold uppercase tracking-wider text-transparent dark:from-blue-400 dark:to-purple-400">
                AI Hydration Coach
              </span>
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                {gt(remaining, 0)
                  ? "Kun bo'yi ozdan-ozdan suv ichish foydaliroq. Keyingi stakaningizni 1-2 soatdan so'ng iching!"
                  : "Ajoyib ish! Kunlik suv maqsadiga erishdingiz. Ertaga ham shunday davom eting!"}
              </p>
            </div>
          </motion.div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 p-5 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <TrendingUpIcon className="size-4 text-blue-500" />
                Aktiv kun holati
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-muted-foreground">
                      Maqsadga yaqinlik
                    </span>
                    <span>{min([hydrationRate, 100])}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{ width: `${min([hydrationRate, 100])}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                    <p className="mb-1 text-muted-foreground">Qolgan miqdor</p>
                    <p className="text-lg font-bold">
                      {formatStat(remaining)} ml
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                    <p className="mb-1 text-muted-foreground">
                      Oxirgi ichilgan vaqt
                    </p>
                    <p className="text-lg font-bold">
                      {formatWaterTime(get(lastDrink, "time"))}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <WaterAnalyticsSection days={7} />
        </TrackingPageLayout>
      </div>

      <Drawer
        direction="bottom"
        open={isLogsDrawerOpen}
        onOpenChange={setIsLogsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Bugungi qaydlar</DrawerTitle>
            <DrawerDescription>
              Bugun ichilgan suv va kayfiyat qaydlaringiz.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="px-0">
            <WaterLogList
              hasDailyEntries={hasDailyEntries}
              moodMeta={moodMeta}
              waterLog={waterLog}
              cupSize={cupSize}
              onRemoveEntry={handleRemoveEntry}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default Index;
