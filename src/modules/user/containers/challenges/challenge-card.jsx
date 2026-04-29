import React from "react";
import { get, includes, some } from "lodash";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  Clock3Icon,
  EyeIcon,
  MailPlusIcon,
  TrophyIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  CHALLENGE_STATUS_META,
  formatChallengeDateRange,
  formatRewardText,
  getMetricMeta,
  getMyProgress,
  getMyRankText,
  getParticipantCount,
  getPresetCover,
} from "./challenge-utils.js";

const ChallengeCard = ({
  challenge,
  userId,
  isBusy,
  onJoin,
  onInvite,
  onViewDetail,
  showProgress = false,
}) => {
  const statusMeta = get(
    CHALLENGE_STATUS_META,
    challenge.status,
    CHALLENGE_STATUS_META.UPCOMING,
  );
  const StatusIcon = statusMeta.icon;
  const participantCount = getParticipantCount(challenge);
  const isParticipant = Boolean(
    challenge.isJoined ||
      some(
        challenge.participants,
        (participant) => participant.userId === userId,
      ),
  );
  const maxParticipants = Number(get(challenge, "maxParticipants", 0)) || null;
  const isFull = Boolean(maxParticipants && participantCount >= maxParticipants);
  const isJoinClosed = includes(["COMPLETED", "CANCELLED"], challenge.status);
  const joinFeeXp = Number(get(challenge, "joinFeeXp", 0));
  const metricType =
    get(challenge, "metricDetails.type") || challenge.metricType || "STEPS";
  const metricTarget = Number(
    get(challenge, "metricDetails.target") ?? challenge.metricTarget ?? 0,
  );
  const metricMeta = getMetricMeta(metricType);
  const progress = getMyProgress(challenge);
  const preset = getPresetCover(challenge.coverPreset || "run");

  const buttonLabel = isParticipant
    ? "Ko'rish"
    : isFull
      ? "Joy qolmagan"
      : isJoinClosed
        ? "Yopilgan"
        : isBusy
          ? "Kutilmoqda..."
          : joinFeeXp > 0
            ? `Qo'shilish (${joinFeeXp} XP)`
            : "Qo'shilish";

  const handlePrimaryClick = () => {
    if (isParticipant || isJoinClosed) {
      onViewDetail?.(challenge.id);
      return;
    }
    onJoin?.(challenge.id);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/80 shadow-sm backdrop-blur-md transition-shadow hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="relative aspect-video overflow-hidden">
        {challenge?.image?.url ? (
          <img
            loading="lazy"
            src={challenge.image.url}
            alt={challenge.title}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "flex size-full items-center justify-center bg-gradient-to-br text-5xl",
              preset.from,
              preset.to,
            )}
          >
            {preset.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge
            variant="outline"
            className={cn(
              "border-white/20 bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md",
              statusMeta.className,
            )}
          >
            <StatusIcon className="mr-1.5 size-3" />
            {statusMeta.label}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-amber-950 shadow-lg shadow-amber-400/20">
            <TrophyIcon className="size-3.5" />
            {formatRewardText(challenge)}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 text-lg font-black tracking-tight text-white drop-shadow-md">
            {challenge.title}
          </h3>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-4">
        <p className="mb-4 line-clamp-2 min-h-10 text-sm font-medium leading-relaxed text-muted-foreground">
          {challenge.description || "Ta'rif kiritilmagan"}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-muted/35 p-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Clock3Icon className="size-3.5 text-primary" />
              Muddat
            </div>
            <p className="text-xs font-bold">
              {formatChallengeDateRange(challenge.startDate, challenge.endDate)}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/35 p-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <UsersIcon className="size-3.5 text-orange-500" />
              A'zolar
            </div>
            <p className="text-xs font-bold">
              {participantCount}
              {maxParticipants ? ` / ${maxParticipants}` : " (Cheksiz)"}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
              <ZapIcon className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                {metricMeta.label}
              </p>
              <p className="text-sm font-black">
                {metricTarget.toLocaleString()} {metricMeta.shortUnit}
              </p>
            </div>
          </div>
          {isParticipant ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
              Qatnashyapsiz
            </Badge>
          ) : null}
        </div>

        {showProgress || isParticipant ? (
          <div className="mb-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {Math.round(progress)}% bajarildi
              </span>
              <span className="text-muted-foreground">{getMyRankText(challenge)}</span>
            </div>
            <Progress value={progress} className="h-2 bg-emerald-500/10" />
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-2.5">
          <Button
            size="lg"
            className={cn(
              "h-11 flex-1 rounded-2xl font-bold shadow-lg transition-all active:scale-95",
              isParticipant
                ? "border border-border/50 bg-muted text-foreground shadow-none hover:bg-muted/80"
                : "bg-primary text-white shadow-primary/20 hover:bg-primary/90",
            )}
            onClick={handlePrimaryClick}
            disabled={!isParticipant && (isFull || isJoinClosed || isBusy)}
          >
            {isParticipant ? <EyeIcon className="mr-2 size-4" /> : null}
            {buttonLabel}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-2xl"
            onClick={() => onViewDetail?.(challenge.id)}
            title="Batafsil ko'rish"
          >
            <ArrowRightIcon className="size-5 text-muted-foreground" />
          </Button>
          {isParticipant && !isJoinClosed && onInvite ? (
            <Button
              variant="outline"
              size="icon"
              className="size-11 rounded-2xl"
              onClick={() => onInvite(challenge)}
              title="Taklif qilish"
            >
              <MailPlusIcon className="size-5 text-primary" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </motion.div>
  );
};

export default ChallengeCard;
