import React from "react";
import { Link } from "react-router";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import StrippedCalendar from "@/components/stripped-calendar";
import useMealPlan from "@/hooks/app/use-meal-plan";
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
import StreakWidget from "@/modules/user/containers/dashboard/streak-widget.jsx";
import AchievementsWidget from "@/modules/user/containers/dashboard/achievements-widget.jsx";
import FriendActivityFeed from "@/modules/user/containers/dashboard/friend-activity-feed.jsx";
import ChallengeWidget from "@/modules/user/containers/dashboard/challenge-widget.jsx";
import ChallengeInvitationsSection from "@/modules/user/containers/dashboard/challenge-invitations-section.jsx";
import { ClipboardListIcon } from "lucide-react";

const ActiveMealPlanBanner = ({ activePlan }) => {
  if (!activePlan) {
    return null;
  }

  return (
    <Link
      to="/user/nutrition"
      className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 transition-colors hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100 dark:hover:bg-emerald-950/50"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/70 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
        <ClipboardListIcon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">Dieta rejasi faol</span>
        <span className="block truncate text-xs opacity-75">
          {activePlan.name}
        </span>
      </span>
    </Link>
  );
};

const DashboardContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { activePlan } = useMealPlan();
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const dateKey = React.useMemo(
    () => normalizeDateKey(selectedDate),
    [selectedDate],
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/dashboard", title: "Dashboard" },
    ]);
  }, [setBreadcrumbs]);

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
        <ConnectedCoachBanner />
        <CoachInvitationsSection />
        <ChallengeInvitationsSection />
        <CoachActivitySection />
        <div className="grid grid-flow-row-dense auto-rows-min grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-11">
          <div className="md:col-span-1 lg:col-span-3">
            <CalorieGaugeWidget dateKey={dateKey} showCalorieModeToggle />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <div className="space-y-3">
              <ActiveMealPlanBanner activePlan={activePlan} />
              <MealsWidget dateKey={dateKey} />
            </div>
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <div className="space-y-4">
              <WaterWidget dateKey={dateKey} />
              <MoodWidget dateKey={dateKey} />
            </div>
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <BmiWidget />
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <WeightWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <WorkoutWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <AchievementsWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <ChallengeWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <FriendActivityFeed />
          </div>
        </div>
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
