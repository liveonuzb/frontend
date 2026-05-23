import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
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
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  RefreshCwIcon,
} from "lucide-react";

const formatDashboardDateLabel = (date) =>
  date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
  });

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-11">
    <Skeleton className="h-80 md:col-span-1 lg:col-span-3" />
    <Skeleton className="h-80 md:col-span-2 lg:col-span-5" />
    <div className="space-y-4 md:col-span-1 lg:col-span-3">
      <Skeleton className="h-40" />
      <Skeleton className="h-36" />
    </div>
    <Skeleton className="h-44 md:col-span-1 lg:col-span-3" />
    <Skeleton className="h-44 md:col-span-1 lg:col-span-3" />
    <Skeleton className="h-44 md:col-span-2 lg:col-span-5" />
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
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [maxSelectableDate] = React.useState(() => new Date());
  const dateKey = React.useMemo(
    () => normalizeDateKey(selectedDate),
    [selectedDate],
  );
  const selectedDateLabel = React.useMemo(
    () => formatDashboardDateLabel(selectedDate),
    [selectedDate],
  );
  const {
    user,
    dayData,
    goalsState,
    measurementSnapshot,
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
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-2xl bg-card/80 shadow-sm"
            onClick={() => setCalendarOpen(true)}
            aria-label={`Sana tanlash: ${selectedDateLabel}`}
          >
            <CalendarDaysIcon className="size-5" />
          </Button>
        </div>
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
            <div className="grid grid-cols-1 gap-4">
              <div
                data-testid="dashboard-top-card-row"
                className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-11"
              >
                <div className="flex min-h-0 md:col-span-1 lg:col-span-3">
                  <CalorieGaugeWidget
                    dateKey={dateKey}
                    dayData={dayData}
                    goalsState={goalsState}
                    user={user}
                    showCalorieModeToggle
                  />
                </div>
                <div className="flex min-h-0 md:col-span-2 lg:col-span-5">
                  <MealsWidget
                    dateKey={dateKey}
                    dayData={dayData}
                    goalsState={goalsState}
                  />
                </div>
                <div className="flex flex-col gap-y-4 md:col-span-1 lg:col-span-3">
                  <WaterWidget
                    dateKey={dateKey}
                    dayData={dayData}
                    goalsState={goalsState}
                  />
                  <MoodWidget dateKey={dateKey} dayData={dayData}  />
                </div>
              </div>
              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-11">
                <div className="md:col-span-1 lg:col-span-3">
                  <BmiWidget measurementSnapshot={measurementSnapshot} />
                </div>
                <div className="md:col-span-1 lg:col-span-3">
                  <WeightWidget measurementSnapshot={measurementSnapshot} />
                </div>
                <div className="md:col-span-2 lg:col-span-5">
                  <WorkoutWidget activePlan={activeWorkoutPlan} />
                </div>
                <div className="md:col-span-2 lg:col-span-5">
                  <AchievementsWidget />
                </div>
                <div className="md:col-span-2 lg:col-span-6">
                  <FriendActivityFeed
                    friends={friends}
                    challenges={challenges}
                    currentUserId={get(user, "id")}
                  />
                </div>
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
      <CalendarBottomDrawer
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        date={selectedDate}
        onChange={setSelectedDate}
        maxDate={maxSelectableDate}
        title="Sana tanlang"
        description="Dashboard ma'lumotlari tanlangan kunga moslanadi."
      />
    </PageTransition>
  );
};

export default DashboardContainer;
