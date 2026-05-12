import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { get } from "lodash";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import StrippedCalendar from "@/components/stripped-calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectedCoachBanner from "./connected-coach-banner.jsx";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";
import MealsWidget from "./meals-widget.jsx";
import WaterWidget from "./water-widget.jsx";
import MoodWidget from "./mood-widget.jsx";
import BmiWidget from "./bmi-widget.jsx";
import WeightWidget from "./weight-widget.jsx";
import WorkoutWidget from "./workout-widget.jsx";
import CoachInvitationsSection from "./coach-invitations-section.jsx";
import CoachActivitySection from "./coach-activity-section.jsx";
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
import ChallengeWidget from "@/modules/user/containers/dashboard/challenge-widget.jsx";
import ChallengeInvitationsSection from "@/modules/user/containers/dashboard/challenge-invitations-section.jsx";
import {
  AlertTriangleIcon,
  ClipboardListIcon,
  RefreshCwIcon,
} from "lucide-react";

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

const ActiveMealPlanBanner = ({ activePlan, t }) => {
  if (!activePlan) {
    return null;
  }

  return (
    <Link
      to="/user/nutrition/home"
      state={{ openMealPlanBuilder: true, planId: get(activePlan, "id") }}
      className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 transition-colors hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100 dark:hover:bg-emerald-950/50"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/70 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
        <ClipboardListIcon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">
          {t("user.dashboard.mealPlan.active")}
        </span>
        <span className="block truncate text-xs opacity-75">
          {get(activePlan, "name")}
        </span>
      </span>
    </Link>
  );
};

const DashboardContainer = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
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
    currentChallenge,
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
          <StrippedCalendar
            date={selectedDate}
            onChange={setSelectedDate}
            className="w-full max-w-md"
          />
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
            <ConnectedCoachBanner user={user} />
            <CoachInvitationsSection />
            <ChallengeInvitationsSection />
            <CoachActivitySection user={user} />
            <div className="grid grid-flow-row-dense auto-rows-min grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-11">
              <div className="md:col-span-1 lg:col-span-3">
                <CalorieGaugeWidget
                  dateKey={dateKey}
                  dayData={dayData}
                  goalsState={goalsState}
                  user={user}
                  showCalorieModeToggle
                />
              </div>
              <div className="md:col-span-2 lg:col-span-5">
                <div className="space-y-3">
                  <ActiveMealPlanBanner activePlan={activeMealPlan} t={t} />
                  <MealsWidget
                    dateKey={dateKey}
                    dayData={dayData}
                    goalsState={goalsState}
                  />
                </div>
              </div>
              <div className="md:col-span-1 lg:col-span-3">
                <div className="space-y-4">
                  <WaterWidget
                    dateKey={dateKey}
                    dayData={dayData}
                    goalsState={goalsState}
                  />
                  <MoodWidget dateKey={dateKey} dayData={dayData} />
                </div>
              </div>
              <div className="md:col-span-1 lg:col-span-3">
                <BmiWidget measurementSnapshot={measurementSnapshot} />
              </div>
              <div className="md:col-span-1 lg:col-span-3">
                <WeightWidget measurementSnapshot={measurementSnapshot} />
              </div>
              <div className="md:col-span-2 lg:col-span-5">
                <WorkoutWidget activePlan={activeWorkoutPlan} />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <AchievementsWidget />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <ChallengeWidget currentChallenge={currentChallenge} />
              </div>
              <div className="md:col-span-2 lg:col-span-5">
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
      <ChallengeReminderDrawer />
      <ChallengeCompletionDrawer />
    </PageTransition>
  );
};

export default DashboardContainer;
