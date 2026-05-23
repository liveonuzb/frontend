import React from "react";
import { useTranslation } from "react-i18next";
import { get, join, map, take, toNumber, toUpper, trim, split } from "lodash";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import CalendarBottomDrawer from "@/components/calendar-bottom-drawer.jsx";
import NotificationCenter from "@/components/notification-center";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  FlameIcon,
  RefreshCwIcon,
} from "lucide-react";
import {
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";

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

const getDashboardDisplayName = (user, fallback) =>
  trim(`${user?.firstName || ""} ${user?.lastName || ""}`) ||
  user?.username ||
  fallback;

const getDashboardInitials = (displayName) =>
  toUpper(
    join(
      take(
        map(split(displayName, " "), (part) => get(part, "[0]", "")),
        2,
      ),
      "",
    ),
  );

const DashboardMobileTopBar = ({
  user,
  selectedDateLabel,
  onOpenCalendar,
}) => {
  const { t } = useTranslation();
  const { openProfile } = useProfileOverlay();
  const displayName = getDashboardDisplayName(
    user,
    t("common.navUser.user", "Foydalanuvchi"),
  );
  const initials = getDashboardInitials(displayName);
  const streakDays = Math.max(0, toNumber(get(user, "currentStreak", 0)) || 0);

  return (
    <div
      data-testid="dashboard-mobile-top-bar"
      className="flex items-center justify-between gap-3 pt-[max(0.25rem,env(safe-area-inset-top))] md:hidden"
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 rounded-2xl text-left outline-none transition-opacity active:opacity-80"
        onClick={() => openProfile(PROFILE_OVERVIEW_TAB)}
        aria-label={`Profilni ochish: ${displayName}`}
      >
        <Avatar className="size-11 shrink-0 border border-border/70 bg-card">
          <AvatarImage src={user?.avatar} alt={displayName} />
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 space-y-0.5">
          <span
            data-testid="dashboard-mobile-greeting-line"
            className="flex min-w-0 items-baseline gap-1.5 leading-tight"
          >
            <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
              {t("user.dashboard.mobileGreeting", "Salom")}
            </span>{" "}
            <span className="truncate text-[15px] font-semibold text-foreground">
              {displayName}
            </span>
          </span>
          <span
            data-testid="dashboard-mobile-streak"
            className="flex items-center gap-1 text-[11px] font-medium leading-tight text-muted-foreground"
          >
            <FlameIcon className="size-3.5 text-orange-500" />
            <span>
              {t("user.dashboard.mobileStreakDays", {
                count: streakDays,
                defaultValue: "{{count}} kun",
              })}
            </span>
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <NotificationCenter className="size-11 rounded-full border border-border/60 bg-card/80 shadow-none hover:bg-card" />
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-11 rounded-full bg-card/80 shadow-none hover:shadow-none"
          onClick={onOpenCalendar}
          aria-label={`Sana tanlash: ${selectedDateLabel}`}
        >
          <CalendarDaysIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
};

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
        <DashboardMobileTopBar
          user={user}
          selectedDateLabel={selectedDateLabel}
          onOpenCalendar={() => setCalendarOpen(true)}
        />
        <div className="hidden justify-end md:flex">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-2xl bg-card/80 shadow-none hover:shadow-none"
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
                className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:h-[400px] lg:grid-cols-11"
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
