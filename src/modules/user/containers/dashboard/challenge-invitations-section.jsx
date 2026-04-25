import { get, join, map, take } from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import useGetQuery from "@/hooks/api/use-get-query";
import usePatchQuery from "@/hooks/api/use-patch-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TrophyIcon } from "lucide-react";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import {
  DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY,
  DASHBOARD_CHALLENGES_QUERY_KEY,
} from "./query-helpers.js";

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

export default function ChallengeInvitationsSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [respondingById, setRespondingById] = React.useState({});
  const { data } = useGetQuery({
    url: "/challenges/invitations/me",
    params: { status: "PENDING" },
    queryProps: {
      queryKey: [...DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY, "PENDING"],
    },
  });
  const invitationsPayload = get(data, "data.data", get(data, "data", []));
  const invitations = Array.isArray(invitationsPayload)
    ? invitationsPayload
    : get(invitationsPayload, "items", []);
  const respondMutation = usePatchQuery({
    mutationProps: {
      onSuccess: async (_response, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: DASHBOARD_CHALLENGES_QUERY_KEY,
          }),
          ...(String(variables?.attributes?.status || "").startsWith("ACCEPT")
            ? [invalidateGamificationQueries(queryClient)]
            : []),
        ]);
      },
    },
  });

  const handleRespond = async (invitationId, action) => {
    if (!invitationId || respondingById[invitationId]) {
      return;
    }

    setRespondingById((current) => ({
      ...current,
      [invitationId]: true,
    }));
    try {
      await respondMutation.mutateAsync({
        url: `/challenges/invitations/${invitationId}/respond`,
        attributes: { status: action },
      });
      toast.success(
        String(action).startsWith("ACCEPT")
          ? "Taklif qabul qilindi"
          : "Taklif rad etildi",
      );
    } catch {
      toast.error("Challenge taklifiga javob berib bo'lmadi");
    } finally {
      setRespondingById((current) => {
        const next = { ...current };
        delete next[invitationId];
        return next;
      });
    }
  };

  if (!invitations.length) return null;

  return (
    <div className="rounded-2xl border px-4 py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
            <TrophyIcon className="size-5 text-[rgb(var(--accent-rgb))]" />
            Challenge takliflari
          </h2>
          <p className="text-sm text-muted-foreground">
            Do&apos;stlaringiz sizni challenge&apos;larga taklif qildi.
          </p>
        </div>
        <div className="inline-flex w-fit items-center rounded-full border border-[rgb(var(--accent-rgb)/0.30)] bg-[rgb(var(--accent-rgb)/0.10)] px-3 py-1 text-xs font-medium text-[rgb(var(--accent-strong-rgb))]">
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
              className="rounded-2xl border border-[rgb(var(--accent-rgb)/0.20)] bg-gradient-to-br from-[rgb(var(--accent-rgb)/0.08)] to-background p-4"
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
                    onClick={() => handleRespond(invitation.id, "DECLINE")}
                    disabled={isBusy}
                  >
                    {isBusy ? "Kutilmoqda..." : "Rad etish"}
                  </Button>
                  <Button
                    onClick={() => handleRespond(invitation.id, "ACCEPT")}
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
