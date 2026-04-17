import { join, map, take } from "lodash";
import React from "react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrophyIcon } from "lucide-react";

const challengeMetricLabels = {
  STEPS: "Qadam",
  WORKOUT_MINUTES: "Mashq vaqti",
  BURNED_CALORIES: "Kaloriya",
  SLEEP_HOURS: "Uyqu",
};

const formatShortDate = (value) => {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u2014";
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
};

export default function ChallengeInvitationsSection({
  invitations,
  respondingById,
  onRespond,
}) {
  const navigate = useNavigate();

  if (!invitations.length) return null;

  return (
    <div className="rounded-2xl border px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <TrophyIcon className="size-5 text-amber-500" />
            Challenge takliflari
          </h2>
          <p className="text-sm text-muted-foreground">
            Do&apos;stlaringiz sizni challenge&apos;larga taklif qildi.
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
          {invitations.length} ta taklif
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {map(invitations, (invitation) => {
          const challenge = invitation.challenge;
          const participantCount =
            challenge?._count?.participants ??
            challenge?.participants?.length ??
            0;
          const isBusy = Boolean(respondingById[invitation.id]);
          const rewardPreview = Number(
            challenge?.rewardDetails?.previewRewardXp ??
              challenge?.rewardXp ??
              0,
          );
          const metricType =
            challenge?.metricDetails?.type ?? challenge?.metricType;
          const metricTarget =
            challenge?.metricDetails?.target ?? challenge?.metricTarget;
          const dateRange =
            challenge?.startDate && challenge?.endDate
              ? `${formatShortDate(challenge.startDate)} - ${formatShortDate(challenge.endDate)}`
              : "Muddati ko\u2018rsatilmagan";

          return (
            <div
              key={invitation.id}
              className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] to-background p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="size-11 border">
                    <AvatarImage src={invitation.inviter?.avatarUrl} />
                    <AvatarFallback>
                      {join(take(map(String(invitation.inviter?.name || "U").split(" "), (part) => part[0]), 2), "").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1.5">
                    <div className="font-semibold">
                      {challenge?.title || "Challenge"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Taklif yubordi:{" "}
                      <span className="font-medium text-foreground">
                        {invitation.inviter?.name || "Foydalanuvchi"}
                      </span>
                    </div>
                    {invitation.message ? (
                      <p className="text-sm text-muted-foreground">
                        {invitation.message}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border bg-background px-2.5 py-1">
                        {dateRange}
                      </span>
                      <span className="rounded-full border bg-background px-2.5 py-1">
                        Ishtirokchi: {participantCount}
                        {challenge?.maxParticipants
                          ? ` / ${challenge.maxParticipants}`
                          : ""}
                      </span>
                      <span className="rounded-full border bg-background px-2.5 py-1">
                        Metrika:{" "}
                        {challengeMetricLabels[metricType] || "Metrika"}
                        {metricTarget ? ` (${metricTarget})` : ""}
                      </span>
                      <span className="rounded-full border bg-background px-2.5 py-1">
                        Mukofot:{" "}
                        {rewardPreview > 0
                          ? `${new Intl.NumberFormat("uz-UZ").format(rewardPreview)} XP`
                          : "Belgilanmagan"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {challenge?.id ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/user/challenges/${challenge.id}`)
                      }
                    >
                      Batafsil
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => onRespond(invitation.id, "DECLINE")}
                    disabled={isBusy}
                  >
                    {isBusy ? "Kutilmoqda..." : "Rad etish"}
                  </Button>
                  <Button
                    onClick={() => onRespond(invitation.id, "ACCEPT")}
                    disabled={isBusy}
                  >
                    {isBusy ? "Kutilmoqda..." : "Qabul qilish"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
