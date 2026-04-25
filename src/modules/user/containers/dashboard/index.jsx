import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import DateNav from "@/components/date-nav";
import OnboardingHealthReportCard from "@/components/onboarding-health-report-card";
import { getUserOnboardingReportPath } from "@/lib/app-paths";
import ConnectedCoachBanner from "./connected-coach-banner.jsx";
import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";
import MealsWidget from "./meals-widget.jsx";
import WaterWidget from "./water-widget.jsx";
import MoodWidget from "./mood-widget.jsx";
import BmiWidget from "./bmi-widget.jsx";
import WeightWidget from "./weight-widget.jsx";
import WorkoutWidget from "./workout-widget.jsx";
import StreakWidget from "./streak-widget.jsx";
import AchievementsWidget from "./achievements-widget.jsx";
import CoachInvitationsSection from "./coach-invitations-section.jsx";
import ChallengeInvitationsSection from "./challenge-invitations-section.jsx";
import CoachActivitySection from "./coach-activity-section.jsx";
import CurrentChallengeWidget from "./current-challenge-widget.jsx";
import FriendActivityFeed from "./friend-activity-feed.jsx";
import { normalizeDateKey } from "./query-helpers.js";

const DashboardContainer = () => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = React.useState(() => new Date());
  const dateKey = React.useMemo(
    () => normalizeDateKey(selectedDate),
    [selectedDate],
  );
  const openDailyPage = React.useCallback(
    (date) => {
      navigate(`/user/dashboard/day?date=${normalizeDateKey(date)}`);
    },
    [navigate],
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
          <DateNav
            date={selectedDate}
            onChange={setSelectedDate}
            onLabelClick={openDailyPage}
          />
        </div>
        <ConnectedCoachBanner />
        <CoachInvitationsSection />
        <CoachActivitySection />
        <ChallengeInvitationsSection />

        <div className="grid grid-flow-row-dense auto-rows-min grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-11">
          <div className="md:col-span-1 lg:col-span-3">
            <CalorieGaugeWidget dateKey={dateKey} showCalorieModeToggle />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <MealsWidget dateKey={dateKey} />
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
          <div className="md:col-span-1 lg:col-span-3">
            <StreakWidget />
          </div>
          <div className="md:col-span-1 lg:col-span-4">
            <AchievementsWidget />
          </div>
          <div className="md:col-span-1 lg:col-span-4">
            <CurrentChallengeWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-11">
            <FriendActivityFeed />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DashboardContainer;
