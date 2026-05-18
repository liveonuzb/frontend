import {
  filter,
  find,
  get,
  gte,
  gt,
  isArray,
  keys,
  map,
  orderBy,
  reduce,
  size,
  some,
  sumBy,
  take,
  toNumber,
} from "lodash";
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
  id: get(item, "id"),
  savedMealId: get(item, "savedMealId", null),
  source: get(item, "source", null),
  name: get(item, "name", ""),
  barcode: get(item, "barcode", null),
  cal: get(item, "cal", get(item, "calories", 0)),
  protein: get(item, "protein", 0),
  carbs: get(item, "carbs", 0),
  fat: get(item, "fat", 0),
  fiber: get(item, "fiber", 0),
  qty: get(item, "qty", get(item, "quantity", 1)),
  image: get(item, "image", get(item, "imageUrl", null)),
  grams: get(item, "grams", null),
  ingredients: isArray(get(item, "ingredients"))
    ? get(item, "ingredients")
    : [],
  addedAt: get(item, "addedAt", null),
});

const normalizeMealItems = (payload, mealKey, empty) => {
  const foods = get(payload, ["meals", mealKey], []);
  return isArray(foods)
    ? map(foods, normalizeMealItem)
    : get(empty, ["meals", mealKey], []);
};

export const normalizeDayData = (payload = {}, fallbackDateKey = "") => {
  const dateKey = normalizeDateKey(get(payload, "date") || fallbackDateKey);
  const empty = createEmptyDayData(dateKey);
  const waterLog = get(payload, "waterLog", []);

  return {
    ...empty,
    date: dateKey,
    waterCups: get(
      payload,
      "waterCups",
      isArray(waterLog) ? size(waterLog) : empty.waterCups,
    ),
    waterLog: isArray(waterLog)
      ? map(waterLog, (entry) => ({
          id: get(entry, "id"),
          time: get(entry, "time", new Date().toISOString()),
          amountMl: get(entry, "amountMl", 0),
        }))
      : empty.waterLog,
    meals: {
      breakfast: normalizeMealItems(payload, "breakfast", empty),
      lunch: normalizeMealItems(payload, "lunch", empty),
      dinner: normalizeMealItems(payload, "dinner", empty),
      snack: normalizeMealItems(payload, "snack", empty),
    },
    workoutLogs: isArray(get(payload, "workoutLogs"))
      ? get(payload, "workoutLogs")
      : [],
    steps: get(payload, "steps", empty.steps),
    workoutMinutes: get(payload, "workoutMinutes", empty.workoutMinutes),
    burnedCalories: get(payload, "burnedCalories", empty.burnedCalories),
    sleepHours: get(payload, "sleepHours", empty.sleepHours),
    mood: get(payload, "mood", empty.mood),
  };
};

export const getDayDataFromResponse = (response, dateKey) =>
  normalizeDayData(getApiResponseData(response, {}), dateKey);

export const getUserFromResponse = (response) =>
  getApiResponseData(response, null);

export const toFiniteNumber = (value, fallback = 0) => {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : fallback;
};

export const toNonNegativeNumber = (value, fallback = 0) => {
  const number = toFiniteNumber(value, fallback);
  return gte(number, 0) ? number : fallback;
};

export const toPositiveNumber = (value, fallback = 1) => {
  const number = toFiniteNumber(value, fallback);
  return gt(number, 0) ? number : fallback;
};

export const firstFiniteNumber = (values = [], fallback = 0) =>
  reduce(
    values,
    (result, value) => {
      if (result.found) {
        return result;
      }

      const number = toNumber(value);
      return Number.isFinite(number) ? { found: true, value: number } : result;
    },
    { found: false, value: fallback },
  ).value;

export const getGoalsStateFromResponses = ({ goalsResponse, user }) => {
  const payload = getApiResponseData(goalsResponse, null);
  const onboarding = normalizeUserOnboarding(get(user, "onboarding"));
  const resolvedGoalIntent = resolveHealthGoalIntent({
    healthGoalGoal: get(payload, "goal"),
    onboardingGoal: get(onboarding, "goal"),
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
  if (get(user, "onboardingCompleted") && !hasServerGoals && isGoalLoading) {
    return {
      label: "Profil maqsadi",
      description: "Onboarding ma'lumotlari asosida yangilanmoqda",
      tone: "loading",
    };
  }

  if (get(user, "onboardingCompleted") && goalSource !== "fallback") {
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
        (food) =>
          toNonNegativeNumber(get(food, "cal"), 0) *
          toPositiveNumber(get(food, "qty"), 1),
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
          const qty = toPositiveNumber(get(food, "qty"), 1);
          result.protein += toNonNegativeNumber(get(food, "protein"), 0) * qty;
          result.fat += toNonNegativeNumber(get(food, "fat"), 0) * qty;
          result.carbs += toNonNegativeNumber(get(food, "carbs"), 0) * qty;
          result.fiber += toNonNegativeNumber(get(food, "fiber"), 0) * qty;
          return result;
        },
        acc,
      );
    },
    { protein: 0, fat: 0, carbs: 0, fiber: 0 },
  );

export const calculateWaterConsumedMl = (dayData, cupSize = 250) => {
  const safeCupSize = toPositiveNumber(cupSize, 250);
  const waterLog = isArray(get(dayData, "waterLog"))
    ? get(dayData, "waterLog")
    : [];

  if (size(waterLog) > 0) {
    return reduce(
      waterLog,
      (total, entry) =>
        total + toPositiveNumber(get(entry, "amountMl"), safeCupSize),
      0,
    );
  }

  return toNonNegativeNumber(get(dayData, "waterCups"), 0) * safeCupSize;
};

export const normalizeMeasurementHistory = (entries = []) =>
  orderBy(
    isArray(entries) ? entries : [],
    [
      (entry) => {
        const time = new Date(get(entry, "date", 0)).getTime();
        return Number.isFinite(time) ? time : 0;
      },
    ],
    ["desc"],
  );

export const getMeasurementSnapshot = ({
  history,
  onboarding = {},
  currentWeightValue,
  targetWeightValue,
  startWeightValue,
  heightCmValue,
} = {}) => {
  const normalizedHistory = normalizeMeasurementHistory(history);
  const latest = get(normalizedHistory, 0, {});
  const previous = get(normalizedHistory, 1, {});
  const historySize = size(normalizedHistory);
  const currentWeight = firstFiniteNumber(
    [
      currentWeightValue,
      get(latest, "weight"),
      get(onboarding, "currentWeight.value"),
    ],
    0,
  );
  const previousWeight =
    historySize >= 2
      ? firstFiniteNumber([get(previous, "weight")], null)
      : null;
  const targetWeight = firstFiniteNumber(
    [targetWeightValue, get(onboarding, "targetWeight.value")],
    70,
  );
  const lastHistoryWeight = get(normalizedHistory, [historySize - 1, "weight"]);
  const startWeight =
    firstFiniteNumber(
      [
        startWeightValue,
        historySize >= 2 ? lastHistoryWeight : undefined,
        currentWeight ? currentWeight + 5 : undefined,
      ],
      currentWeight,
    ) || currentWeight;
  const heightCm = firstFiniteNumber(
    [heightCmValue, get(onboarding, "height.value")],
    0,
  );
  const heightM = heightCm / 100;
  const bmi =
    gt(heightM, 0) && gt(currentWeight, 0)
      ? currentWeight / (heightM * heightM)
      : null;
  const weightChange =
    previousWeight !== null ? currentWeight - previousWeight : 0;

  return {
    history: normalizedHistory,
    latest,
    previous,
    currentWeight,
    previousWeight,
    targetWeight,
    startWeight,
    heightCm,
    bmi,
    weightChange,
  };
};

const getChallengeStatusWeight = (status) => {
  if (status === "ACTIVE") return 0;
  if (status === "UPCOMING") return 1;
  if (status === "COMPLETED") return 2;
  return 3;
};

const clampProgress = (value) => {
  const numeric = toNumber(value ?? 0);

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
  const sortedChallenges = orderBy(
    filter(challenges, (challenge) => {
      const participants = isArray(get(challenge, "participants"))
        ? get(challenge, "participants")
        : [];
      const isJoined = Boolean(get(challenge, "isJoined"));
      const hasParticipant = some(
        participants,
        (participant) => get(participant, "userId") === userId,
      );

      return isJoined || hasParticipant;
    }),
    [
      (challenge) => getChallengeStatusWeight(get(challenge, "status")),
      (challenge) => {
        const dateValue =
          get(challenge, "status") === "ACTIVE"
            ? get(challenge, "endDate")
            : get(challenge, "startDate");
        const time = new Date(dateValue).getTime();
        return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
      },
    ],
    ["asc", "asc"],
  );

  const challenge = get(sortedChallenges, 0);

  if (!challenge) {
    return null;
  }

  const friendNameById = new Map(
    map(friends, (friend) => [
      get(friend, "id"),
      get(friend, "name") || "Do'st",
    ]),
  );
  const participants = isArray(get(challenge, "participants"))
    ? get(challenge, "participants")
    : [];
  const ranking = map(
    orderBy(
      participants,
      [
        (participant) => toNumber(get(participant, "metricValue", 0)),
        (participant) => toNumber(get(participant, "progress", 0)),
      ],
      ["desc", "desc"],
    ),
    (participant, index) => ({
      ...participant,
      rank: index + 1,
    }),
  );

  const myEntry = find(
    ranking,
    (participant) => get(participant, "userId") === userId,
  );
  const sharedFriendEntry = find(
    ranking,
    (participant) =>
      get(participant, "userId") &&
      get(participant, "userId") !== userId &&
      friendNameById.has(get(participant, "userId")),
  );
  const metricType =
    get(challenge, "metricDetails.type") ??
    get(challenge, "metricType") ??
    "STEPS";
  const metricUnit = challengeMetricUnits[metricType] ?? "birlik";
  const metricTarget = toNumber(get(challenge, "metricDetails.target") ??
    get(challenge, "metricTarget") ??
    0);
  const progress = clampProgress(
    get(challenge, "myProgress", get(myEntry, "progress", 0)),
  );
  const myMetricValue = toNumber(get(challenge, "myMetricValue", get(myEntry, "metricValue", 0)));

  const startDate = get(challenge, "startDate")
    ? new Date(get(challenge, "startDate"))
    : null;
  const endDate = get(challenge, "endDate")
    ? new Date(get(challenge, "endDate"))
    : null;
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
    id: get(challenge, "id"),
    title: get(challenge, "title") || "Challenge",
    progress,
    dayLabel:
      get(challenge, "status") === "UPCOMING"
        ? `Boshlanishi ${formatShortDate(get(challenge, "startDate"))}`
        : totalDays && currentDay
          ? `Day ${currentDay} / ${totalDays}`
          : "Muddati belgilanmagan",
    rankLabel: get(myEntry, "rank") ? `Rank #${get(myEntry, "rank")}` : null,
    metricSummary:
      metricTarget > 0
        ? `${new Intl.NumberFormat("uz-UZ").format(myMetricValue)} / ${new Intl.NumberFormat("uz-UZ").format(metricTarget)} ${metricUnit}`
        : `${new Intl.NumberFormat("uz-UZ").format(myMetricValue)} ${metricUnit}`,
    contextLabel: sharedFriendEntry
      ? `${friendNameById.get(get(sharedFriendEntry, "userId"))} ham shu challenge ichida faol`
      : `${challengeMetricLabels[metricType] || "Progress"} bo'yicha ishlayapsiz`,
    friendParticipant: sharedFriendEntry
      ? {
          name: friendNameById.get(get(sharedFriendEntry, "userId")),
          metricValue: toNumber(get(sharedFriendEntry, "metricValue", 0)),
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
  const friendIds = new Set(map(friends, (friend) => get(friend, "id")));
  const friendNameById = new Map(
    map(friends, (friend) => [
      get(friend, "id"),
      get(friend, "name") || "Do'st",
    ]),
  );
  const friendAvatarById = new Map(
    map(friends, (friend) => [
      get(friend, "id"),
      get(friend, "avatarUrl", null),
    ]),
  );
  const activities = [];

  for (const challenge of challenges) {
    const participants = isArray(get(challenge, "participants"))
      ? get(challenge, "participants")
      : [];

    if (size(participants) === 0) {
      continue;
    }

    const sorted = orderBy(
      participants,
      [(participant) => toNumber(get(participant, "metricValue", 0))],
      ["desc"],
    );
    const metricType =
      get(challenge, "metricDetails.type") ??
      get(challenge, "metricType") ??
      "STEPS";
    const metricUnit = challengeMetricUnits[metricType] || "birlik";

    for (let index = 0; index < size(sorted); index += 1) {
      const participant = get(sorted, index);
      const userId = get(participant, "userId");

      if (!userId || userId === currentUserId || !friendIds.has(userId)) {
        continue;
      }

      activities.push({
        key: `${get(challenge, "id")}-${userId}`,
        uid: userId,
        name: friendNameById.get(userId) || "Do'st",
        avatarUrl: friendAvatarById.get(userId),
        challengeTitle: get(challenge, "title", "Challenge"),
        challengeId: get(challenge, "id"),
        rank: index + 1,
        metricValue: toNumber(get(participant, "metricValue", 0)),
        metricUnit,
        progress: Math.min(
          100,
          Math.round(toNumber(get(participant, "progress", 0))),
        ),
        status: get(challenge, "status", "ACTIVE"),
      });
    }
  }

  return take(
    orderBy(
      activities,
      [(activity) => get(activity, "metricValue", 0)],
      ["desc"],
    ),
    6,
  );
};
