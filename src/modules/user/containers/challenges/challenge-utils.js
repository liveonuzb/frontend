import { format } from "date-fns";
import { uz } from "date-fns/locale";
import find from "lodash/find";
import get from "lodash/get";
import keys from "lodash/keys";
import toNumber from "lodash/toNumber";
import {
  CheckCircle2Icon,
  CircleOffIcon,
  Clock3Icon,
  FlagIcon,
} from "lucide-react";

export const CHALLENGE_STATUS_META = {
  UPCOMING: {
    label: "Kutilmoqda",
    className:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: Clock3Icon,
  },
  ACTIVE: {
    label: "Faol",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: FlagIcon,
  },
  COMPLETED: {
    label: "Yakunlangan",
    className:
      "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    icon: CheckCircle2Icon,
  },
  CANCELLED: {
    label: "Bekor qilingan",
    className:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    icon: CircleOffIcon,
  },
};

export const METRIC_TYPE_OPTIONS = [
  {
    value: "STEPS",
    label: "Qadam",
    title: "Qadam o'lchagich",
    unit: "qadam/kuniga",
    shortUnit: "qadam",
    emoji: "🚶",
    default: 10000,
    step: 1000,
    min: 1000,
    max: 100000,
  },
  {
    value: "WORKOUT_MINUTES",
    label: "Mashq",
    title: "Mashq vaqti",
    unit: "daqiqa/kuniga",
    shortUnit: "daqiqa",
    emoji: "🏋️",
    default: 30,
    step: 5,
    min: 5,
    max: 300,
  },
  {
    value: "BURNED_CALORIES",
    label: "Kaloriya",
    title: "Kaloriya yoqish",
    unit: "kcal/kuniga",
    shortUnit: "kcal",
    emoji: "🔥",
    default: 500,
    step: 50,
    min: 50,
    max: 5000,
  },
  {
    value: "SLEEP_HOURS",
    label: "Uyqu",
    title: "Uyqu",
    unit: "soat/kuniga",
    shortUnit: "soat",
    emoji: "😴",
    default: 8,
    step: 1,
    min: 1,
    max: 12,
  },
];

export const PRESET_COVERS = [
  { id: "run", emoji: "🏃", from: "from-blue-500", to: "to-indigo-600" },
  { id: "lift", emoji: "🏋️", from: "from-orange-500", to: "to-red-600" },
  { id: "bike", emoji: "🚴", from: "from-green-500", to: "to-emerald-600" },
  { id: "yoga", emoji: "🧘", from: "from-purple-500", to: "to-violet-600" },
  { id: "swim", emoji: "🏊", from: "from-cyan-500", to: "to-sky-600" },
  { id: "zap", emoji: "⚡", from: "from-yellow-400", to: "to-amber-500" },
];

export const getMetricMeta = (type) =>
  find(METRIC_TYPE_OPTIONS, { value: type }) || METRIC_TYPE_OPTIONS[0];

export const getPresetCover = (id) =>
  find(PRESET_COVERS, { id }) || PRESET_COVERS[0];

export const formatChallengeDateRange = (startDate, endDate) => {
  try {
    return `${format(new Date(startDate), "dd MMM", { locale: uz })} - ${format(
      new Date(endDate),
      "dd MMM",
      { locale: uz },
    )}`;
  } catch {
    return "Sana belgilanmagan";
  }
};

export const formatRewardText = (challenge) => {
  const details = challenge?.rewardDetails;
  if (
    get(details, "mode") === "PERCENT_OF_POOL" &&
    get(details, "percent") != null
  ) {
    return `${get(details, "percent")}% pool`;
  }
  if (
    get(details, "mode") === "PLACE_XP" &&
    get(details, "placeRewardPreview") &&
    typeof get(details, "placeRewardPreview") === "object"
  ) {
    const places = keys(get(details, "placeRewardPreview"));
    if (places.length) return `Top ${places.length} o'rin`;
    return "O'rin bo'yicha";
  }
  const previewRewardXp = details?.previewRewardXp ?? challenge?.rewardXp ?? 0;
  if (previewRewardXp > 0) {
    return `${new Intl.NumberFormat("uz-UZ").format(previewRewardXp)} XP`;
  }
  return "Mukofot yo'q";
};

export const getParticipantCount = (challenge) =>
  get(challenge, "_count.participants") ??
  get(challenge, "participants.length") ??
  0;

export const getMyProgress = (challenge) => {
  const raw =
    get(challenge, "myProgress.percent") ??
    get(challenge, "progress.percent") ??
    get(challenge, "myProgressPercentage") ??
    0;
  return Math.max(0, Math.min(100, toNumber(raw) || 0));
};

export const getMyRankText = (challenge) => {
  const rank = get(challenge, "myRank") ?? get(challenge, "myProgress.rank");
  const count = getParticipantCount(challenge);
  if (!rank) return count ? `${count} ishtirokchi` : "Hali reyting yo'q";
  return `${rank}-o'rin / ${count || "?"} ishtirokchi`;
};
