import React from "react";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import map from "lodash/map";
import range from "lodash/range";
import {
  addDays,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";
import MealsWidget from "./meals-widget.jsx";
import WaterWidget from "./water-widget.jsx";
import MoodWidget from "./mood-widget.jsx";
import BmiWidget from "./bmi-widget.jsx";
import WeightWidget from "./weight-widget.jsx";
import WorkoutWidget from "./workout-widget.jsx";
import MoodReminderDrawer from "./mood-reminder-drawer.jsx";
import StreakReminderDrawer from "./streak-reminder-drawer.jsx";
import StreakRestoreDrawer from "./streak-restore-drawer.jsx";
import WaterReminderDrawer from "./water-reminder-drawer.jsx";
import DailyReviewDrawer from "./daily-review-drawer.jsx";
import TenDayPopupDrawer from "./ten-day-popup-drawer.jsx";
import ChallengeReminderDrawer from "./challenge-reminder-drawer.jsx";
import ChallengeCompletionDrawer from "./challenge-completion-drawer.jsx";
import { normalizeDateKey } from "./query-helpers.js";
import useDashboardData from "./use-dashboard-data.js";
import AchievementsWidget from "@/modules/user/containers/dashboard/achievements-widget.jsx";
import FriendActivityFeed from "@/modules/user/containers/dashboard/friend-activity-feed.jsx";
import ChallengeInvitationsSection from "@/modules/user/containers/dashboard/challenge-invitations-section.jsx";
import { USER_CHALLENGES_ENABLED } from "@/modules/user/user-feature-flags.js";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { useUserLayoutDate } from "@/modules/user/layout/user-layout-date-context.jsx";
import { cn } from "@/lib/utils";

const DASHBOARD_WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const DASHBOARD_PAST_DAY_COUNT = 30;

const DashboardWeekDatePicker = ({ selectedDate, onSelectDate }) => {
  const selectedButtonRef = React.useRef(null);
  const today = React.useMemo(() => startOfDay(new Date()), []);
  const selectedDay = React.useMemo(
    () => startOfDay(selectedDate),
    [selectedDate],
  );
  const visibleDays = React.useMemo(() => {
    const defaultStart = addDays(today, -DASHBOARD_PAST_DAY_COUNT);
    const rangeStart = isBefore(selectedDay, defaultStart)
      ? selectedDay
      : defaultStart;
    const rangeEnd = isAfter(selectedDay, today) ? selectedDay : today;
    const dayCount = differenceInCalendarDays(rangeEnd, rangeStart);

    return map(range(0, dayCount + 1), (offset) =>
      addDays(rangeStart, offset),
    );
  }, [selectedDay, today]);

  React.useEffect(() => {
    selectedButtonRef.current?.scrollIntoView?.({
      block: "nearest",
      inline: "center",
    });
  }, [selectedDate]);

  return (
    <div
      data-testid="dashboard-week-date-picker"
      className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max items-center gap-0.5 px-1">
        {map(visibleDays, (date) => {
          const selected = isSameDay(date, selectedDay);
          const label = DASHBOARD_WEEKDAY_LABELS[date.getDay()];

          return (
            <button
              key={date.toISOString()}
              ref={selected ? selectedButtonRef : null}
              type="button"
              aria-label={`${label} ${date.getDate()}`}
              aria-pressed={selected}
              className={cn(
                "flex h-[48px] w-10 shrink-0 flex-col items-center justify-center rounded-2xl text-center transition-colors",
                selected
                  ? "bg-primary text-primary-foreground shadow-[0_8px_18px_rgb(var(--accent-rgb)/0.18)]"
                  : "text-muted-foreground hover:bg-card/70",
              )}
              onClick={() => onSelectDate(date)}
            >
              <span className="text-[10px] font-medium leading-none">
                {label}
              </span>
              <span className="mt-1 text-[16px] font-semibold leading-none">
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 gap-4">
    <Skeleton className="h-80" />
    <Skeleton className="h-80" />
    <Skeleton className="h-40" />
    <Skeleton className="h-36" />
    <Skeleton className="h-44" />
    <Skeleton className="h-44" />
    <Skeleton className="h-44" />
    <Skeleton className="h-44" />
    <Skeleton className="h-44" />
  </div>
);

const DashboardStatusMessage = ({
  title,
  description,
  actionLabel,
  onRetry,
  tone = "error",
}) => (
  <div
    className={
      tone === "warning"
        ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        : "rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-destructive"
    }
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <AlertTriangleIcon className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5 text-sm opacity-80">{description}</p>
        </div>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start bg-background/60 sm:self-center"
          onClick={onRetry}
        >
          <RefreshCwIcon data-icon="inline-start" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  </div>
);

const DashboardContainer = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const layoutDateState = useUserLayoutDate();
  const [fallbackSelectedDate, setFallbackSelectedDate] = React.useState(
    () => new Date(),
  );
  const selectedDate = layoutDateState?.selectedDate ?? fallbackSelectedDate;
  const setSelectedDate =
    layoutDateState?.setSelectedDate ?? setFallbackSelectedDate;
  const dateKey = React.useMemo(
    () => normalizeDateKey(selectedDate),
    [selectedDate],
  );
  const {
    user,
    dayData,
    goalsState,
    measurementSnapshot,
    activeMealPlan,
    activeWorkoutPlan,
    friends,
    challenges,
    isCoreLoading,
    hasCoreError,
    hasSupportingError,
    refetchDashboard,
  } = useDashboardData(dateKey);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: t("user.dashboard.breadcrumbs.home") },
      {
        url: "/user/dashboard",
        title: t("user.dashboard.breadcrumbs.dashboard"),
      },
    ]);
  }, [setBreadcrumbs, t]);

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6 [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:ring-0">
        <DashboardWeekDatePicker
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        {isCoreLoading ? (
          <DashboardSkeleton />
        ) : hasCoreError ? (
          <DashboardStatusMessage
            title={t("user.dashboard.status.errorTitle")}
            description={t("user.dashboard.status.errorDescription")}
            actionLabel={t("user.dashboard.status.retry")}
            onRetry={refetchDashboard}
          />
        ) : (
          <>
            {hasSupportingError ? (
              <DashboardStatusMessage
                tone="warning"
                title={t("user.dashboard.status.supportingWarningTitle")}
                description={t("user.dashboard.status.supportingWarning")}
                actionLabel={t("user.dashboard.status.retry")}
                onRetry={refetchDashboard}
              />
            ) : null}
            {USER_CHALLENGES_ENABLED ? <ChallengeInvitationsSection /> : null}
            <div
              data-testid="dashboard-card-list"
              className="grid grid-cols-1 items-stretch gap-4"
            >
              <div className="flex min-h-0">
                <CalorieGaugeWidget
                  dateKey={dateKey}
                  dayData={dayData}
                  goalsState={goalsState}
                  user={user}
                  showCalorieModeToggle
                />
              </div>
              <div className="flex min-h-0">
                <MealsWidget
                  dateKey={dateKey}
                  selectedDate={selectedDate}
                  activeMealPlan={activeMealPlan}
                  dayData={dayData}
                  goalsState={goalsState}
                />
              </div>
              <div>
                <WaterWidget
                  dateKey={dateKey}
                  dayData={dayData}
                  goalsState={goalsState}
                />
              </div>
              <div>
                <MoodWidget dateKey={dateKey} dayData={dayData} />
              </div>
              <div>
                <BmiWidget measurementSnapshot={measurementSnapshot} />
              </div>
              <div>
                <WeightWidget measurementSnapshot={measurementSnapshot} />
              </div>
              <div>
                <WorkoutWidget activePlan={activeWorkoutPlan} />
              </div>
              <div>
                <AchievementsWidget />
              </div>
              <div>
                <FriendActivityFeed
                  friends={friends}
                  challenges={challenges}
                  currentUserId={get(user, "id")}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <StreakRestoreDrawer />
      <DailyReviewDrawer />
      <TenDayPopupDrawer />
      <MoodReminderDrawer />
      <StreakReminderDrawer />
      <WaterReminderDrawer />
      {USER_CHALLENGES_ENABLED ? <ChallengeReminderDrawer /> : null}
      {USER_CHALLENGES_ENABLED ? <ChallengeCompletionDrawer /> : null}
    </PageTransition>
  );
};

export default DashboardContainer;
