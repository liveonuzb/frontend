import { get, keys, reduce, sumBy, take } from "lodash";
import { getApiResponseData } from "@/lib/api-response";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import {
  hasDefaultHealthGoalPreset,
  normalizeHealthGoals,
  resolveHealthGoalIntent,
} from "@/hooks/app/use-health-goals";

export const DASHBOARD_ME_QUERY_KEY = ["me"];
export const DASHBOARD_HEALTH_GOALS_QUERY_KEY = ["health-goals"];
export const DASHBOARD_MEASUREMENTS_QUERY_KEY = ["measurements"];
export const DASHBOARD_FRIENDS_QUERY_KEY = ["friends"];
export const DASHBOARD_CHALLENGES_QUERY_KEY = ["dashboard", "challenges"];
export const DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY = [
  "dashboard",
  "challenge-invitations",
];
export const DASHBOARD_COACH_INVITATIONS_QUERY_KEY = [
  "me",
  "coach-invitations",
];
export const DASHBOARD_COACH_FEEDBACK_QUERY_KEY = ["me", "coach-feedback"];
export const DASHBOARD_COACH_TASKS_QUERY_KEY = ["me", "coach-tasks"];
export const DASHBOARD_WEEKLY_CHECK_INS_QUERY_KEY = [
  "user",
  "weekly-check-ins",
];
export const DASHBOARD_WORKOUT_PLANS_QUERY_KEY = ["user", "workout", "plans"];
export const DASHBOARD_WORKOUT_OVERVIEW_QUERY_KEY = [
  "user",
  "workout",
  "overview",
];

export const challengeMetricLabels = {
  STEPS: "Qadam",
  WORKOUT_MINUTES: "Mashq vaqti",
  BURNED_CALORIES: "Kaloriya",
  SLEEP_HOURS: "Uyqu",
};

export const challengeMetricUnits = {
  STEPS: "qadam",
  WORKOUT_MINUTES: "daqiqa",
  BURNED_CALORIES: "kcal",
  SLEEP_HOURS: "soat",
};

export const getDashboardDayQueryKey = (date) => [
  "daily-tracking",
  normalizeDateKey(date),
];

const formatLocalDateKey = (date) => {
  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    return formatLocalDateKey(new Date());
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const normalizeDateKey = (date) => {
  if (!date) {
    return formatLocalDateKey(new Date());
  }

  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    return formatLocalDateKey(date);
  }

  return formatLocalDateKey(date);
};

export const createEmptyDayData = (dateKey = "") => ({
  date: dateKey,
  waterCups: 0,
  waterLog: [],
  workoutLogs: [],
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
  steps: 0,
  workoutMinutes: 0,
  burnedCalories: 0,
  sleepHours: 0,
  mood: null,
});

const normalizeMealItem = (item = {}) => ({
  id: item.id,
  savedMealId: item.savedMealId ?? null,
  source: item.source ?? null,
  name: item.name ?? "",
  barcode: item.barcode ?? null,
  cal: item.cal ?? item.calories ?? 0,
  protein: item.protein ?? 0,
  carbs: item.carbs ?? 0,
  fat: item.fat ?? 0,
  fiber: item.fiber ?? 0,
  qty: item.qty ?? item.quantity ?? 1,
  image: item.image ?? item.imageUrl ?? null,
  grams: item.grams ?? null,
  ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
  addedAt: item.addedAt ?? null,
});

export const normalizeDayData = (payload = {}, fallbackDateKey = "") => {
  const dateKey = normalizeDateKey(payload.date || fallbackDateKey);
  const empty = createEmptyDayData(dateKey);

  return {
    ...empty,
    date: dateKey,
    waterCups: payload.waterCups ?? payload.waterLog?.length ?? empty.waterCups,
    waterLog: Array.isArray(payload.waterLog)
      ? payload.waterLog.map((entry) => ({
          id: entry.id,
          time: entry.time ?? new Date().toISOString(),
          amountMl: entry.amountMl ?? 0,
        }))
      : empty.waterLog,
    meals: {
      breakfast: Array.isArray(payload.meals?.breakfast)
        ? payload.meals.breakfast.map(normalizeMealItem)
        : empty.meals.breakfast,
      lunch: Array.isArray(payload.meals?.lunch)
        ? payload.meals.lunch.map(normalizeMealItem)
        : empty.meals.lunch,
      dinner: Array.isArray(payload.meals?.dinner)
        ? payload.meals.dinner.map(normalizeMealItem)
        : empty.meals.dinner,
      snack: Array.isArray(payload.meals?.snack)
        ? payload.meals.snack.map(normalizeMealItem)
        : empty.meals.snack,
    },
    workoutLogs: Array.isArray(payload.workoutLogs) ? payload.workoutLogs : [],
    steps: payload.steps ?? empty.steps,
    workoutMinutes: payload.workoutMinutes ?? empty.workoutMinutes,
    burnedCalories: payload.burnedCalories ?? empty.burnedCalories,
    sleepHours: payload.sleepHours ?? empty.sleepHours,
    mood: payload.mood ?? empty.mood,
  };
};

export const getDayDataFromResponse = (response, dateKey) =>
  normalizeDayData(getApiResponseData(response, {}), dateKey);

export const getUserFromResponse = (response) => getApiResponseData(response, null);

export const getGoalsStateFromResponses = ({ goalsResponse, user }) => {
  const payload = getApiResponseData(goalsResponse, null);
  const onboarding = normalizeUserOnboarding(get(user, "onboarding"));
  const resolvedGoalIntent = resolveHealthGoalIntent({
    healthGoalGoal: payload?.goal,
    onboardingGoal: onboarding?.goal,
    goals: payload ?? {},
  });
  const serverGoals = payload
    ? normalizeHealthGoals({
        ...payload,
        goal: resolvedGoalIntent,
      })
    : null;
  const goals =
    serverGoals ??
    normalizeHealthGoals({
      goal: resolvedGoalIntent,
    });

  return {
    goals,
    goalSource: serverGoals
      ? hasDefaultHealthGoalPreset(serverGoals)
        ? "default"
        : "personalized"
      : "fallback",
    hasServerGoals: Boolean(serverGoals),
  };
};

export const getCalorieGoalMeta = ({
  user,
  goalSource,
  hasServerGoals,
  isGoalLoading,
}) => {
  if (user?.onboardingCompleted && !hasServerGoals && isGoalLoading) {
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
};

export const calculateMealCalories = (meals = {}) =>
  reduce(
    keys(meals),
    (total, type = "") =>
      total +
      sumBy(
        get(meals, type, []),
        (food) => get(food, "cal", 0) * get(food, "qty", 1),
      ),
    0,
  );

export const calculateMealMacros = (meals = {}) =>
  reduce(
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

export const calculateWaterConsumedMl = (dayData, cupSize = 250) => {
  const waterLog = Array.isArray(dayData?.waterLog) ? dayData.waterLog : [];

  if (waterLog.length > 0) {
    return reduce(
      waterLog,
      (total, entry) => total + Number(entry?.amountMl ?? cupSize),
      0,
    );
  }

  return Number(dayData?.waterCups ?? 0) * Number(cupSize || 250);
};

const getChallengeStatusWeight = (status) => {
  if (status === "ACTIVE") return 0;
  if (status === "UPCOMING") return 1;
  if (status === "COMPLETED") return 2;
  return 3;
};

const clampProgress = (value) => {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
};

export const formatShortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
};

export const buildCommunityChallenge = ({
  challenges = [],
  friends = [],
  userId,
}) => {
  const sortedChallenges = challenges
    .filter((challenge) => {
      const isJoined = Boolean(challenge?.isJoined);
      const hasParticipant = Array.isArray(challenge?.participants)
        ? challenge.participants.some((participant) => participant.userId === userId)
        : false;

      return isJoined || hasParticipant;
    })
    .slice()
    .sort((left, right) => {
      const statusDiff =
        getChallengeStatusWeight(left?.status) -
        getChallengeStatusWeight(right?.status);

      if (statusDiff !== 0) {
        return statusDiff;
      }

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

      if (metricDiff !== 0) {
        return metricDiff;
      }

      return Number(right?.progress ?? 0) - Number(left?.progress ?? 0);
    })
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
    }));

  const myEntry = ranking.find((participant) => participant.userId === userId);
  const sharedFriendEntry = ranking.find(
    (participant) =>
      participant?.userId &&
      participant.userId !== userId &&
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

  const startDate = challenge?.startDate ? new Date(challenge.startDate) : null;
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
};

export const buildFriendActivities = ({
  friends = [],
  challenges = [],
  currentUserId,
}) => {
  const friendIds = new Set(friends.map((friend) => friend.id));
  const friendNameById = new Map(
    friends.map((friend) => [friend.id, friend.name || "Do'st"]),
  );
  const friendAvatarById = new Map(
    friends.map((friend) => [friend.id, friend.avatarUrl || null]),
  );
  const activities = [];

  for (const challenge of challenges) {
    const participants = Array.isArray(challenge?.participants)
      ? challenge.participants
      : [];

    if (participants.length === 0) {
      continue;
    }

    const sorted = [...participants].sort(
      (left, right) =>
        Number(right?.metricValue ?? 0) - Number(left?.metricValue ?? 0),
    );
    const metricType =
      get(challenge, "metricDetails.type") ??
      get(challenge, "metricType") ??
      "STEPS";
    const metricUnit = challengeMetricUnits[metricType] || "birlik";

    for (let index = 0; index < sorted.length; index += 1) {
      const participant = sorted[index];
      const userId = get(participant, "userId");

      if (!userId || userId === currentUserId || !friendIds.has(userId)) {
        continue;
      }

      activities.push({
        key: `${challenge.id}-${userId}`,
        uid: userId,
        name: friendNameById.get(userId) || "Do'st",
        avatarUrl: friendAvatarById.get(userId),
        challengeTitle: get(challenge, "title", "Challenge"),
        challengeId: challenge.id,
        rank: index + 1,
        metricValue: Number(get(participant, "metricValue", 0)),
        metricUnit,
        progress: Math.min(100, Math.round(Number(get(participant, "progress", 0)))),
        status: get(challenge, "status", "ACTIVE"),
      });
    }
  }

  return take(
    activities.sort((left, right) => right.metricValue - left.metricValue),
    6,
  );
};
