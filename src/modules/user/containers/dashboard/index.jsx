import React, { useState, useEffect } from "react";
import { get, keys, reduce, sumBy } from "lodash";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore, useBreadcrumbStore, useChallengeStore } from "@/store";
import useGetQuery from "@/hooks/api/use-get-query";
import useHealthGoals from "@/hooks/app/use-health-goals";
import { useCoachInvitations } from "@/hooks/app/use-coach-invitations";
import useCoachFeedback from "@/hooks/app/use-coach-feedback";
import useCoachTasks from "@/hooks/app/use-coach-tasks";
import useWeeklyCheckIns from "@/hooks/app/use-weekly-check-ins";
import {
  useDailyTrackingActions,
  useDailyTrackingDay,
} from "@/hooks/app/use-daily-tracking";
import PageTransition from "@/components/page-transition";
import DateNav from "@/components/date-nav";
import CoachConnectionDetailsDrawer from "@/components/coach-connection-details-drawer";
import ConnectedCoachBanner from "./connected-coach-banner.jsx";
import WeeklyCheckInDrawer from "./weekly-check-in-drawer.jsx";
import DeclineInvitationDrawer from "./decline-invitation-drawer.jsx";

import CalorieGaugeWidget from "./calorie-gauge-widget.jsx";
import MealsWidget from "./meals-widget.jsx";
import WaterWidget from "./water-widget.jsx";
import WorkoutWidget from "./workout-widget.jsx";
import WeightWidget from "./weight-widget.jsx";
import BmiWidget from "./bmi-widget.jsx";
import MoodWidget from "./mood-widget.jsx";
import FriendsWidget from "./friends-widget.jsx";
import FriendActivityFeed from "./friend-activity-feed.jsx";
import CurrentChallengeWidget from "./current-challenge-widget.jsx";
import StreakWidget from "./streak-widget.jsx";
import AchievementsWidget from "./achievements-widget.jsx";
import CoachInvitationsSection from "./coach-invitations-section.jsx";
import ChallengeInvitationsSection from "./challenge-invitations-section.jsx";
import CoachActivitySection from "./coach-activity-section.jsx";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { deriveWorkoutPlanMetrics } from "../workout/utils";

const calcMealCalories = (meals) => {
  return reduce(
    keys(meals),
    (total, type = "") => {
      return (
        total +
        sumBy(
          get(meals, type, []),
          (food) => get(food, "cal", 0) * get(food, "qty", 1),
        )
      );
    },
    0,
  );
};

const calcMacros = (meals) => {
  return reduce(
    keys(meals),
    (acc, type) => {
      const foods = get(meals, type, []);
      return reduce(
        foods,
        (result, food) => {
          const qty = get(food, "qty", 1);
          result.protein += get(food, "protein", 0) * qty;
          result.fat += get(food, "fat", 0) * qty;
          result.carbs += get(food, "carbs", 0) * qty;
          result.fiber += get(food, "fiber", 0) * qty;
          return result;
        },
        acc,
      );
    },
    { protein: 0, fat: 0, carbs: 0, fiber: 0 },
  );
};

const challengeMetricLabels = {
  STEPS: "Qadam",
  WORKOUT_MINUTES: "Mashq vaqti",
  BURNED_CALORIES: "Kaloriya",
  SLEEP_HOURS: "Uyqu",
};

const challengeMetricUnits = {
  STEPS: "qadam",
  WORKOUT_MINUTES: "daqiqa",
  BURNED_CALORIES: "kcal",
  SLEEP_HOURS: "soat",
};

const getChallengeStatusWeight = (status) => {
  if (status === "ACTIVE") return 0;
  if (status === "UPCOMING") return 1;
  if (status === "COMPLETED") return 2;
  return 3;
};

const clampProgress = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const formatShortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    goals,
    isLoading: isGoalsLoading,
    isFetching: isGoalsFetching,
    hasServerGoals,
    goalSource,
  } = useHealthGoals();
  const { activePlan: persistedActivePlan } = useWorkoutPlan();
  const activePlan = React.useMemo(
    () => deriveWorkoutPlanMetrics(persistedActivePlan),
    [persistedActivePlan],
  );
  const { setMood } = useDailyTrackingActions();
  const { invitations, acceptInvitation, declineInvitation, isDeclining } =
    useCoachInvitations();
  const {
    challenges,
    challengeInvitations,
    fetchChallenges,
    fetchMyInvitations: fetchChallengeInvitations,
    respondToInvitation: respondToChallengeInvitation,
    actionLoading: challengeActionLoading,
  } = useChallengeStore();
  const challengeList = React.useMemo(
    () => (Array.isArray(challenges) ? challenges : []),
    [challenges],
  );
  const challengeInvitationList = React.useMemo(
    () => (Array.isArray(challengeInvitations) ? challengeInvitations : []),
    [challengeInvitations],
  );
  const { data: friendsData } = useGetQuery({
    url: "/users/me/friends",
    queryProps: { queryKey: ["friends"] },
  });
  const friends = get(friendsData, "data.items", []);

  const { data: friendRequestsData } = useGetQuery({
    url: "/users/me/friends/requests",
    queryProps: { queryKey: ["friend-requests"] },
  });
  const incomingRequests = get(friendRequestsData, "data.incoming", []);
  const outgoingRequests = get(friendRequestsData, "data.outgoing", []);
  const { pendingCheckIns, submitWeeklyCheckIn, isSubmittingWeeklyCheckIn } =
    useWeeklyCheckIns();
  const { latestFeedback } = useCoachFeedback();
  const { openTasks, completeTask, isCompletingTask } = useCoachTasks();

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isSavingMood, setIsSavingMood] = useState(false);
  const [connectedCoach, setConnectedCoach] = useState(null);
  const [dismissedCoachConnectionId, setDismissedCoachConnectionId] =
    useState(null);
  const [isCoachDetailsOpen, setIsCoachDetailsOpen] = useState(false);
  const [coachInvitationPendingById, setCoachInvitationPendingById] = useState(
    {},
  );
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [declineInvitationTarget, setDeclineInvitationTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isCompletingTaskId, setIsCompletingTaskId] = useState(null);
  const [checkInForm, setCheckInForm] = useState({
    weightKg: "",
    moodScore: 3,
    energyScore: 3,
    adherenceScore: 3,
    responseNotes: "",
  });
  const challengeInvitationRespondingById =
    challengeActionLoading?.respondingById || {};
  const isCoachInvitationPending = React.useCallback(
    (invitationId) => Boolean(coachInvitationPendingById[invitationId]),
    [coachInvitationPendingById],
  );

  const dateKey = get(selectedDate.toISOString().split("T"), 0);
  const { dayData } = useDailyTrackingDay(dateKey);

  const handleMoodSelect = async (mood) => {
    try {
      setIsSavingMood(true);
      await setMood(dateKey, mood);
      toast.success("Kayfiyat saqlandi");
    } catch {
      toast.error("Kayfiyatni saqlab bo'lmadi");
    } finally {
      setIsSavingMood(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    if (!invitationId || isCoachInvitationPending(invitationId)) {
      return;
    }

    const invitation = invitations.find((item) => item.id === invitationId);
    setCoachInvitationPendingById((current) => ({
      ...current,
      [invitationId]: true,
    }));
    try {
      await acceptInvitation(invitationId);
      if (invitation?.coach) {
        setConnectedCoach({
          id: invitation.coach.id,
          name: invitation.coach.name,
          avatar: invitation.coach.avatar,
          specializations: invitation.coach.specializations ?? [],
        });
      }
      toast.success("Murabbiy taklifi qabul qilindi");
    } catch {
      toast.error("Taklifni qabul qilib bo'lmadi");
    } finally {
      setCoachInvitationPendingById((current) => {
        const next = { ...current };
        delete next[invitationId];
        return next;
      });
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    if (!invitationId || isCoachInvitationPending(invitationId)) {
      return;
    }

    setCoachInvitationPendingById((current) => ({
      ...current,
      [invitationId]: true,
    }));
    try {
      await declineInvitation(invitationId, {
        reason: declineReason.trim() || undefined,
      });
      toast.success("Taklif rad etildi");
      setDeclineInvitationTarget(null);
      setDeclineReason("");
    } catch {
      toast.error("Taklifni rad etib bo'lmadi");
    } finally {
      setCoachInvitationPendingById((current) => {
        const next = { ...current };
        delete next[invitationId];
        return next;
      });
    }
  };

  const pendingChallengeInvitations = challengeInvitationList.filter(
    (invitation) => invitation.status === "PENDING",
  );

  const handleChallengeInvitationResponse = async (invitationId, action) => {
    if (!invitationId || challengeInvitationRespondingById[invitationId]) {
      return;
    }
    try {
      await respondToChallengeInvitation(invitationId, action);
    } catch {
      toast.error("Challenge taklifiga javob berib bo'lmadi");
    }
  };

  useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/dashboard", title: "Dashboard" },
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetchChallenges({}, { silent: true });
    fetchChallengeInvitations("PENDING");
  }, [fetchChallengeInvitations, fetchChallenges]);

  // Friends and friend requests are now fetched automatically via useGetQuery hooks above.

  useEffect(() => {
    const assignmentId = get(user, "coachConnection.assignmentId", null);
    if (!assignmentId) {
      setConnectedCoach(null);
      return;
    }
    if (dismissedCoachConnectionId === assignmentId) return;

    const coach = get(user, "coachConnection.coach", null);
    if (!coach) return;

    setConnectedCoach({
      id: coach.id,
      assignmentId,
      name: coach.name,
      avatar: coach.avatar,
      specializations: coach.specializations ?? [],
      connectedAt: get(user, "coachConnection.connectedAt", null),
    });
  }, [dismissedCoachConnectionId, user]);

  const meals = get(dayData, "meals", {});
  const totalCalories = calcMealCalories(meals);
  const macros = calcMacros(meals);
  const cupSize = get(goals, "cupSize", 250);
  const waterLog = get(dayData, "waterLog", []);
  const waterConsumedMl =
    waterLog.length > 0
      ? reduce(waterLog, (s, entry) => s + get(entry, "amountMl", cupSize), 0)
      : get(dayData, "waterCups", 0) * cupSize;

  const goalWaterMl = get(goals, "waterMl", 0);
  const isGoalLoadingState =
    user?.onboardingCompleted &&
    !hasServerGoals &&
    (isGoalsLoading || isGoalsFetching);
  const calorieGoalMeta = React.useMemo(() => {
    if (isGoalLoadingState) {
      return {
        label: "Profil maqsadi",
        description: "Onboarding ma'lumotlari asosida yangilanmoqda",
        tone: "loading",
      };
    }

    if (user?.onboardingCompleted && goalSource !== "fallback") {
      return {
        label: "Shaxsiy maqsad",
        description: "Yosh, vazn, bo'y va faollik bo'yicha hisoblangan",
        tone: "personalized",
      };
    }

    return {
      label: "Standart maqsad",
      description: "Xohlasangiz Health settings ichida o'zgartirasiz",
      tone: "default",
    };
  }, [goalSource, isGoalLoadingState, user?.onboardingCompleted]);

  const openCheckIn = (checkIn) => {
    setActiveCheckIn(checkIn);
    setCheckInForm({
      weightKg: "",
      moodScore: 3,
      energyScore: 3,
      adherenceScore: 3,
      responseNotes: "",
    });
  };

  const handleSubmitCheckIn = async () => {
    if (!activeCheckIn) {
      return;
    }

    try {
      await submitWeeklyCheckIn(activeCheckIn.id, {
        weightKg: checkInForm.weightKg
          ? Number(checkInForm.weightKg)
          : undefined,
        moodScore: checkInForm.moodScore,
        energyScore: checkInForm.energyScore,
        adherenceScore: checkInForm.adherenceScore,
        responseNotes: checkInForm.responseNotes || undefined,
      });
      toast.success("Weekly check-in yuborildi");
      setActiveCheckIn(null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Weekly check-in yuborib bo'lmadi",
      );
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setIsCompletingTaskId(taskId);
      await completeTask(taskId);
      toast.success("Vazifa bajarildi");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Vazifani yopib bo'lmadi");
    } finally {
      setIsCompletingTaskId(null);
    }
  };

  useEffect(() => {
    const checkInId = location.state?.openWeeklyCheckInId;

    if (!checkInId || pendingCheckIns.length === 0) {
      return;
    }

    const matchedCheckIn = pendingCheckIns.find(
      (item) => item.id === checkInId,
    );

    if (matchedCheckIn) {
      openCheckIn(matchedCheckIn);
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    pendingCheckIns,
  ]);

  const communityChallenge = React.useMemo(() => {
    const sortedChallenges = challengeList
      .filter((challenge) => {
        const isJoined = Boolean(challenge?.isJoined);
        const hasParticipant = Array.isArray(challenge?.participants)
          ? challenge.participants.some(
              (participant) => participant.userId === user?.id,
            )
          : false;
        return isJoined || hasParticipant;
      })
      .slice()
      .sort((left, right) => {
        const statusDiff =
          getChallengeStatusWeight(left?.status) -
          getChallengeStatusWeight(right?.status);
        if (statusDiff !== 0) return statusDiff;

        const leftDate = new Date(
          left?.status === "ACTIVE" ? left?.endDate : left?.startDate,
        ).getTime();
        const rightDate = new Date(
          right?.status === "ACTIVE" ? right?.endDate : right?.startDate,
        ).getTime();

        return leftDate - rightDate;
      });

    const challenge = sortedChallenges[0];
    if (!challenge) {
      return null;
    }

    const friendNameById = new Map(
      friends.map((friend) => [friend.id, friend.name || "Do'st"]),
    );
    const participants = Array.isArray(challenge?.participants)
      ? [...challenge.participants]
      : [];
    const ranking = participants
      .sort((left, right) => {
        const metricDiff =
          Number(right?.metricValue ?? 0) - Number(left?.metricValue ?? 0);
        if (metricDiff !== 0) return metricDiff;
        return Number(right?.progress ?? 0) - Number(left?.progress ?? 0);
      })
      .map((participant, index) => ({
        ...participant,
        rank: index + 1,
      }));

    const myEntry = ranking.find(
      (participant) => participant.userId === user?.id,
    );
    const sharedFriendEntry = ranking.find(
      (participant) =>
        participant?.userId &&
        participant.userId !== user?.id &&
        friendNameById.has(participant.userId),
    );
    const metricType =
      challenge?.metricDetails?.type ?? challenge?.metricType ?? "STEPS";
    const metricUnit = challengeMetricUnits[metricType] ?? "birlik";
    const metricTarget = Number(
      challenge?.metricDetails?.target ?? challenge?.metricTarget ?? 0,
    );
    const progress = clampProgress(
      challenge?.myProgress ?? myEntry?.progress ?? 0,
    );
    const myMetricValue = Number(
      challenge?.myMetricValue ?? myEntry?.metricValue ?? 0,
    );

    const startDate = challenge?.startDate
      ? new Date(challenge.startDate)
      : null;
    const endDate = challenge?.endDate ? new Date(challenge.endDate) : null;
    const hasValidDates =
      startDate &&
      endDate &&
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime());
    const totalDays = hasValidDates
      ? Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1,
        )
      : null;
    const rawCurrentDay = hasValidDates
      ? Math.ceil((Date.now() - startDate.getTime()) / 86400000) + 1
      : null;
    const currentDay =
      totalDays != null && rawCurrentDay != null
        ? Math.max(1, Math.min(totalDays, rawCurrentDay))
        : null;

    return {
      id: challenge.id,
      title: challenge.title || "Challenge",
      progress,
      dayLabel:
        challenge?.status === "UPCOMING"
          ? `Boshlanishi ${formatShortDate(challenge?.startDate)}`
          : totalDays && currentDay
            ? `Day ${currentDay} / ${totalDays}`
            : "Muddati belgilanmagan",
      rankLabel: myEntry?.rank ? `Rank #${myEntry.rank}` : null,
      metricSummary:
        metricTarget > 0
          ? `${new Intl.NumberFormat("uz-UZ").format(myMetricValue)} / ${new Intl.NumberFormat("uz-UZ").format(metricTarget)} ${metricUnit}`
          : `${new Intl.NumberFormat("uz-UZ").format(myMetricValue)} ${metricUnit}`,
      contextLabel: sharedFriendEntry
        ? `${friendNameById.get(sharedFriendEntry.userId)} ham shu challenge ichida faol`
        : `${challengeMetricLabels[metricType] || "Progress"} bo'yicha ishlayapsiz`,
      friendParticipant: sharedFriendEntry
        ? {
            name: friendNameById.get(sharedFriendEntry.userId),
            metricValue: Number(sharedFriendEntry.metricValue ?? 0),
            metricUnit,
          }
        : null,
    };
  }, [challengeList, friends, user?.id]);

  const streakData = React.useMemo(() => {
    const currentStreak = get(user, "currentStreak", 0);
    const longestStreak = get(user, "longestStreak", currentStreak);
    const trackedDays = get(user, "trackedDays", 0);
    return { streak: currentStreak, longestStreak, trackedDays };
  }, [user]);

  const achievementStats = React.useMemo(() => {
    const meals = get(dayData, "meals", {});
    const totalMeals = reduce(
      keys(meals),
      (sum, type) => sum + get(meals, type, []).length,
      0,
    );
    return {
      totalMeals: Math.max(totalMeals, get(user, "totalMeals", 0)),
      totalWorkouts: get(user, "totalWorkouts", 0),
      waterGoalsHit: get(user, "waterGoalsHit", 0),
      longestStreak: streakData.longestStreak,
    };
  }, [dayData, user, streakData.longestStreak]);

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6">
        <div className={"flex justify-end"}>
          <DateNav date={selectedDate} onChange={setSelectedDate} />
        </div>
        <ConnectedCoachBanner
          connectedCoach={connectedCoach}
          onNavigateChat={() => navigate("/user/chat")}
          onOpenDetails={() => setIsCoachDetailsOpen(true)}
          onDismiss={() => {
            setDismissedCoachConnectionId(
              connectedCoach.assignmentId ??
                get(user, "coachConnection.assignmentId", null),
            );
            setConnectedCoach(null);
          }}
        />
        <CoachInvitationsSection
          invitations={invitations}
          isPending={isCoachInvitationPending}
          onAccept={handleAcceptInvitation}
          onDecline={(invitation) => {
            setDeclineInvitationTarget(invitation);
            setDeclineReason("");
          }}
        />

        <CoachActivitySection
          pendingCheckIns={pendingCheckIns}
          latestFeedback={latestFeedback}
          openTasks={openTasks}
          isCompletingTask={isCompletingTask}
          isCompletingTaskId={isCompletingTaskId}
          onOpenCheckIn={openCheckIn}
          onCompleteTask={handleCompleteTask}
        />

        <ChallengeInvitationsSection
          invitations={pendingChallengeInvitations}
          respondingById={challengeInvitationRespondingById}
          onRespond={handleChallengeInvitationResponse}
        />

        <div className="grid grid-cols-1 items-stretch gap-4 auto-rows-min grid-flow-row-dense md:grid-cols-2 lg:grid-cols-11">
          <div className="md:col-span-1 lg:col-span-3">
            <CalorieGaugeWidget
              totalCalories={totalCalories}
              goals={goals}
              macros={macros}
              isGoalLoading={isGoalLoadingState}
              goalMeta={calorieGoalMeta}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <MealsWidget dayData={dayData} goals={goals} />
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <div className="space-y-4">
              <WaterWidget
                waterConsumedMl={waterConsumedMl}
                waterGoalMl={goalWaterMl}
                cupSize={cupSize}
                dateKey={dateKey}
              />
              <MoodWidget
                selectedMood={get(dayData, "mood", null)}
                onSelectMood={handleMoodSelect}
                isSaving={isSavingMood}
              />
            </div>
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <BmiWidget />
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <WeightWidget />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <WorkoutWidget activePlan={activePlan} />
          </div>
          <div className="md:col-span-1 lg:col-span-3">
            <StreakWidget
              streak={streakData.streak}
              longestStreak={streakData.longestStreak}
              trackedDays={streakData.trackedDays}
            />
          </div>
          <div className="md:col-span-1 lg:col-span-4">
            <AchievementsWidget stats={achievementStats} />
          </div>

          <div className="md:col-span-1 lg:col-span-4">
            <CurrentChallengeWidget
              currentChallenge={communityChallenge}
              onOpenChallenge={(challengeId) =>
                navigate(
                  challengeId
                    ? `/user/challenges/${challengeId}`
                    : "/user/challenges",
                )
              }
            />
          </div>
          <div className="md:col-span-2 lg:col-span-11">
            <FriendActivityFeed
              friends={friends}
              challenges={challengeList}
              currentUserId={user?.id}
              onAddFriend={() => navigate("/user/friends")}
              onOpenChallenges={() => navigate("/user/challenges")}
            />
          </div>
        </div>
        <CoachConnectionDetailsDrawer
          open={isCoachDetailsOpen}
          onOpenChange={setIsCoachDetailsOpen}
          coachConnection={get(user, "coachConnection", connectedCoach)}
          onDisconnected={() => setConnectedCoach(null)}
        />
        <WeeklyCheckInDrawer
          checkIn={activeCheckIn}
          form={checkInForm}
          setForm={setCheckInForm}
          onSubmit={handleSubmitCheckIn}
          isSubmitting={isSubmittingWeeklyCheckIn}
          onClose={() => setActiveCheckIn(null)}
        />

        <DeclineInvitationDrawer
          target={declineInvitationTarget}
          reason={declineReason}
          setReason={setDeclineReason}
          isDeclining={isDeclining}
          onDecline={handleDeclineInvitation}
          onClose={() => {
            setDeclineInvitationTarget(null);
            setDeclineReason("");
          }}
        />
      </div>
    </PageTransition>
  );
};

export default Index;
