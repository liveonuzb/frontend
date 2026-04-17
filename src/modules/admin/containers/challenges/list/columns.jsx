import React from "react";
import { get, toPairs, take } from "lodash";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  CheckCircle2Icon,
  Clock3Icon,
  ImagePlusIcon,
  ShieldIcon,
  StopCircleIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ActionsMenu from "./actions-menu.jsx";

const STATUS_META = {
  UPCOMING: {
    label: "Boshlanmagan",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Clock3Icon,
  },
  ACTIVE: {
    label: "Faol",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },
  COMPLETED: {
    label: "Yakunlangan",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    icon: TrophyIcon,
  },
  CANCELLED: {
    label: "Bekor qilingan",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: StopCircleIcon,
  },
};

const TYPE_META = {
  GLOBAL: {
    label: "Global",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    icon: ShieldIcon,
  },
  USER_CREATED: {
    label: "Community",
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    icon: UserIcon,
  },
};

const REWARD_MODE_META = {
  FIXED_XP: {
    label: "Fixed XP",
    description: "Doimiy XP beriladi",
  },
  PERCENT_OF_POOL: {
    label: "Pool foizi",
    description: "Yig'ilgan XP havzasidan foiz",
  },
  PLACE_XP: {
    label: "O'rinlar bo'yicha",
    description: "1-2-3 o'rinlar uchun alohida XP",
  },
};

const METRIC_TYPE_META = {
  STEPS: { label: "Qadam", unit: "qadam" },
  WORKOUT_MINUTES: { label: "Mashq vaqti", unit: "daqiqa" },
  BURNED_CALORIES: { label: "Yondirilgan kaloriya", unit: "kcal" },
  SLEEP_HOURS: { label: "Uyqu", unit: "soat" },
};

const METRIC_AGGREGATION_META = {
  SUM: "Yig'indi",
  AVERAGE: "O'rtacha",
};

const getChallengeRewardMode = (challenge) =>
  challenge.rewardMode || challenge.rewardDetails?.mode || "FIXED_XP";

const getChallengeImageUrl = (challenge) =>
  challenge.image?.url || challenge.imageUrl || "";

const extractPlaceRewards = (challenge) => {
  const source =
    challenge.rewardDetails?.placeRewards || challenge.placeRewards;

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return source;
};

const extractPlaceRewardPreview = (challenge) => {
  const source = challenge.rewardDetails?.placeRewardPreview;

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return source;
};

const getPlaceRewardUnit = (challenge) =>
  challenge.rewardDetails?.placeRewardUnit ||
  (Number(challenge.joinFeeXp || 0) > 0 ? "PERCENT" : "XP");

const getRewardSummary = (challenge) => {
  const mode = getChallengeRewardMode(challenge);

  if (mode === "FIXED_XP") {
    const fixedXp = challenge.rewardDetails?.fixedXp ?? challenge.rewardXp ?? 0;
    return {
      title: `Mukofot: ${fixedXp} XP`,
      subtitle: REWARD_MODE_META.FIXED_XP.description,
    };
  }

  if (mode === "PERCENT_OF_POOL") {
    const percent =
      challenge.rewardDetails?.percent ?? challenge.rewardPercent ?? 0;
    const preview = challenge.rewardDetails?.previewRewardXp ?? 0;
    return {
      title: `Mukofot: ${percent}% (\u2248 ${preview} XP)`,
      subtitle: REWARD_MODE_META.PERCENT_OF_POOL.description,
    };
  }

  const placeRewards = extractPlaceRewards(challenge);
  const placeRewardPreview = extractPlaceRewardPreview(challenge);
  const placeUnit = getPlaceRewardUnit(challenge);
  const placeLabel = take(toPairs(placeRewards), 3)
    .map(
      ([place, value]) =>
        `${place}-o'rin ${value}${placeUnit === "PERCENT" ? "%" : " XP"}`,
    )
    .join(" \u00B7 ");
  const previewLabel = take(toPairs(placeRewardPreview), 3)
    .map(([place, value]) => `${place}-o'rin \u2248 ${value} XP`)
    .join(" \u00B7 ");

  return {
    title: `Mukofot: ${placeLabel || "O'rin mukofotlari"}`,
    subtitle:
      placeUnit === "PERCENT"
        ? previewLabel || "Pooldan foiz bo'yicha taqsimlanadi"
        : REWARD_MODE_META.PLACE_XP.description,
  };
};

const getMetricSummary = (challenge) => {
  const type = challenge.metricDetails?.type || challenge.metricType || "STEPS";
  const aggregation =
    challenge.metricDetails?.aggregation ||
    challenge.metricAggregation ||
    "SUM";
  const target = challenge.metricDetails?.target ?? challenge.metricTarget ?? 0;
  const typeMeta = METRIC_TYPE_META[type] || METRIC_TYPE_META.STEPS;
  const aggregationLabel =
    METRIC_AGGREGATION_META[aggregation] || METRIC_AGGREGATION_META.SUM;

  return `${typeMeta.label}: ${target} ${typeMeta.unit} (${aggregationLabel})`;
};

export const useColumns = ({
  currentLanguage,
  resolveLocalizedText,
  openEditDrawer,
  openTranslationsDrawer,
  setChallengeToDelete,
}) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Musobaqa",
        meta: { cellClassName: "w-[34%]" },
        cell: (info) => {
          const challenge = info.row.original;
          const localizedTitle = resolveLocalizedText(
            challenge.translations,
            challenge.title,
            currentLanguage,
          );
          const localizedDescription = resolveLocalizedText(
            challenge.descriptionTranslations,
            challenge.description,
            currentLanguage,
          );
          const imageUrl = getChallengeImageUrl(challenge);

          return (
            <div className="flex min-w-0 items-start gap-3">
              <div className="size-12 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={localizedTitle || "Challenge"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImagePlusIcon className="size-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {localizedTitle || "Nomsiz"}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {localizedDescription || "Ta'rif kiritilmagan"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Turi",
        size: 120,
        cell: (info) => {
          const type = info.getValue();
          const meta = TYPE_META[type] || TYPE_META.GLOBAL;
          const Icon = meta.icon;

          return (
            <Badge variant="outline" className={meta.className}>
              <Icon className="mr-1 size-3" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Holati",
        size: 130,
        cell: (info) => {
          const status = info.getValue();
          const meta = STATUS_META[status] || STATUS_META.UPCOMING;
          const Icon = meta.icon;

          return (
            <Badge variant="outline" className={meta.className}>
              <Icon className="mr-1 size-3" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        id: "period",
        header: "Muddati",
        size: 180,
        cell: (info) => {
          const challenge = info.row.original;

          return (
            <div className="text-sm">
              <p className="font-medium">
                {format(new Date(challenge.startDate), "dd MMM yyyy, HH:mm", {
                  locale: uz,
                })}
              </p>
              <p className="text-muted-foreground">
                {format(new Date(challenge.endDate), "dd MMM yyyy, HH:mm", {
                  locale: uz,
                })}
              </p>
            </div>
          );
        },
      },
      {
        id: "stats",
        header: "Statistika",
        size: 170,
        cell: (info) => {
          const challenge = info.row.original;
          const rewardSummary = getRewardSummary(challenge);
          const metricSummary = getMetricSummary(challenge);

          return (
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-1 text-muted-foreground">
                <UsersIcon className="size-3.5" />
                {get(challenge, '_count.participants', 0)}
                {challenge.maxParticipants
                  ? ` / ${challenge.maxParticipants}`
                  : ""}
              </p>
              <p className="text-emerald-600 dark:text-emerald-400">
                {rewardSummary.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {rewardSummary.subtitle}
              </p>
              <p className="text-xs text-muted-foreground">{metricSummary}</p>
              <p className="text-slate-600 dark:text-slate-400">
                Kirish: {get(challenge, 'joinFeeXp', 0)} XP
              </p>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              challenge={info.row.original}
              onEdit={openEditDrawer}
              onDelete={setChallengeToDelete}
              onTranslations={openTranslationsDrawer}
            />
          </div>
        ),
      },
    ],
    [currentLanguage, resolveLocalizedText, openEditDrawer, openTranslationsDrawer, setChallengeToDelete],
  );
};
