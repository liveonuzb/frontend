import React from "react";
import get from "lodash/get";
import includes from "lodash/includes";
import some from "lodash/some";
import toNumber from "lodash/toNumber";
import {
  Clock3Icon,
  EyeIcon,
  MailPlusIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CHALLENGE_STATUS_META,
  formatChallengeDateRange,
  formatRewardText,
  getMetricMeta,
  getMyProgress,
  getMyRankText,
  getParticipantCount,
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
  const maxParticipants = toNumber(get(challenge, "maxParticipants", 0)) || null;
  const isFull = Boolean(maxParticipants && participantCount >= maxParticipants);
  const isJoinClosed = includes(["COMPLETED", "CANCELLED"], challenge.status);
  const joinFeeXp = toNumber(get(challenge, "joinFeeXp", 0));
  const metricType =
    get(challenge, "metricDetails.type") || challenge.metricType || "STEPS";
  const metricTarget = toNumber(get(challenge, "metricDetails.target") ?? challenge.metricTarget ?? 0);
  const metricMeta = getMetricMeta(metricType);
  const progress = getMyProgress(challenge);

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
    if (isParticipant || isJoinClosed || isFull) {
      onViewDetail?.(challenge.id);
      return;
    }
    onJoin?.(challenge.id);
  };

  return (
    <Card size="sm" className="h-full">
      {challenge?.image?.url ? (
        <img
          loading="lazy"
          src={challenge.image.url}
          alt={challenge.title}
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-4xl">
          <span aria-hidden="true">{metricMeta.emoji}</span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {challenge.description || "Ta'rif kiritilmagan"}
        </CardDescription>
        <CardAction>
          <Badge variant="outline">
            <StatusIcon />
            {statusMeta.label}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <TrophyIcon />
            {formatRewardText(challenge)}
          </Badge>
          {isParticipant ? <Badge variant="secondary">Qatnashyapsiz</Badge> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock3Icon />
              Muddat
            </div>
            <p className="mt-1 text-sm font-medium">
              {formatChallengeDateRange(challenge.startDate, challenge.endDate)}
            </p>
          </div>
          <div className="rounded-xl border p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <UsersIcon />
              Ishtirokchilar
            </div>
            <p className="mt-1 text-sm font-medium">
              {participantCount}
              {maxParticipants ? ` / ${maxParticipants}` : " (Cheksiz)"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {metricMeta.label}
          </p>
          <p className="mt-1 text-xl font-semibold">
            {metricTarget.toLocaleString()} {metricMeta.shortUnit}
          </p>
        </div>

        {showProgress || isParticipant ? (
          <div className="mt-auto flex flex-col gap-2 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium">{Math.round(progress)}% bajarildi</span>
              <span className="text-muted-foreground">{getMyRankText(challenge)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          size="sm"
          className="flex-1"
          variant={isParticipant || isFull || isJoinClosed ? "outline" : "default"}
          onClick={handlePrimaryClick}
          disabled={!isParticipant && !isFull && !isJoinClosed && isBusy}
        >
          {isParticipant ? <EyeIcon data-icon="inline-start" /> : null}
          {buttonLabel}
        </Button>
        {isParticipant && !isJoinClosed && onInvite ? (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onInvite(challenge)}
            title="Taklif qilish"
          >
            <MailPlusIcon />
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};

export default ChallengeCard;
