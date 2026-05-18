import { get, join, map, sortBy, take, filter, isArray, toNumber, toUpper, split } from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useGetQuery } from "@/hooks/api";
import { usePostQuery } from "@/hooks/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ArrowRightIcon, TrophyIcon } from "lucide-react";
import { getApiResponseData } from "@/lib/api-response";
import { useAuthStore } from "@/store";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import {
  DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY,
  DASHBOARD_CHALLENGES_QUERY_KEY,
  challengeMetricLabels,
} from "./query-helpers.js";
import useReminderTrigger from "./use-reminder-trigger.js";

const REMINDER_INTERVAL_MS = 60 * 60 * 1000;
const STORAGE_PREFIX = "challenge-invitations-reminder:last-dismissed-at";

const formatShortDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
};

const getInvitationItems = (response) => {
  const payload = getApiResponseData(response, []);
  return isArray(payload) ? payload : get(payload, "items", []);
};

const getInvitationSignature = (invitations) =>
  join(sortBy(filter(map(invitations, (invitation) => invitation?.id), Boolean)), ":");

const getStorageKey = (userId, invitationSignature) =>
  `${STORAGE_PREFIX}:${userId || "guest"}:${invitationSignature || "none"}`;

const readLastDismissedAt = (key) => {
  if (!key || typeof window === "undefined") return 0;
  const value = toNumber(window.localStorage.getItem(key));
  return Number.isFinite(value) ? value : 0;
};

const getInitials = (name = "U") =>
  toUpper(join(
    take(
      map(split(String(name || "U"), " "), (part) => part[0]),
      2,
    ),
    "",
  ));

const getRewardPreview = (challenge) =>
  toNumber(challenge?.rewardDetails?.previewRewardXp ?? challenge?.rewardXp ?? 0);

const formatReward = (challenge) => {
  const rewardPreview = getRewardPreview(challenge);
  return rewardPreview > 0
    ? `${new Intl.NumberFormat("uz-UZ").format(rewardPreview)} XP`
    : "Belgilanmagan";
};

const formatMetric = (challenge) => {
  const metricType = challenge?.metricDetails?.type ?? challenge?.metricType;
  const metricTarget = challenge?.metricDetails?.target ?? challenge?.metricTarget;
  const label = challengeMetricLabels[metricType] || "Metrika";
  return metricTarget ? `${label} (${metricTarget})` : label;
};

const formatDateRange = (challenge) =>
  challenge?.startDate && challenge?.endDate
    ? `${formatShortDate(challenge.startDate)} - ${formatShortDate(challenge.endDate)}`
    : "Muddati ko'rsatilmagan";

const formatParticipants = (challenge) => {
  const participantCount =
    challenge?._count?.participants ?? challenge?.participants?.length ?? 0;
  return `${participantCount}${challenge?.maxParticipants ? ` / ${challenge.maxParticipants}` : ""}`;
};

export default function ChallengeInvitationsSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [open, setOpen] = React.useState(false);
  const [respondingById, setRespondingById] = React.useState({});
  const [now, setNow] = React.useState(() => Date.now());
  const [lastDismissedAt, setLastDismissedAt] = React.useState(0);

  const { data } = useGetQuery({
    url: "/challenges/invitations/me",
    params: { status: "PENDING" },
    queryProps: {
      queryKey: [...DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY, "PENDING"],
      enabled: Boolean(userId),
    },
  });

  const invitations = React.useMemo(() => getInvitationItems(data), [data]);
  const invitationSignature = React.useMemo(
    () => getInvitationSignature(invitations),
    [invitations],
  );
  const invitationStorageKey = React.useMemo(
    () => getStorageKey(userId, invitationSignature),
    [invitationSignature, userId],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setLastDismissedAt(readLastDismissedAt(invitationStorageKey));
    setNow(Date.now());
  }, [invitationStorageKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (!lastDismissedAt) return undefined;
    if (typeof window === "undefined") return undefined;
    const remainingMs = REMINDER_INTERVAL_MS - (now - lastDismissedAt);
    if (remainingMs <= 0) return undefined;
    const timeoutId = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(remainingMs + 250, REMINDER_INTERVAL_MS),
    );
    return () => window.clearTimeout(timeoutId);
  }, [lastDismissedAt, now]);

  const shouldRemind =
    invitations.length > 0 &&
    !open &&
    (!lastDismissedAt || now - lastDismissedAt >= REMINDER_INTERVAL_MS);

  const respondMutation = usePostQuery({
    mutationProps: {
      onSuccess: async (_response, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: DASHBOARD_CHALLENGE_INVITATIONS_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: DASHBOARD_CHALLENGES_QUERY_KEY,
          }),
          ...(variables?.attributes?.action === "ACCEPT"
            ? [invalidateGamificationQueries(queryClient)]
            : []),
        ]);
      },
    },
  });

  useReminderTrigger({
    enabled: Boolean(userId && shouldRemind),
    excludeSelector: '[data-challenge-invitations-drawer="true"]',
    thresholdMs: 5000,
    onTrigger: () => setOpen(true),
  });

  const dismiss = React.useCallback(() => {
    const timestamp = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(invitationStorageKey, String(timestamp));
    }
    setLastDismissedAt(timestamp);
    setNow(timestamp);
    setOpen(false);
  }, [invitationStorageKey]);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setOpen(true);
      return;
    }
    dismiss();
  };

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
        attributes: { action },
      });
      toast.success(
        action === "ACCEPT" ? "Taklif qabul qilindi" : "Taklif rad etildi",
      );
      if (invitations.length <= 1) {
        setOpen(false);
      }
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

  const openChallenge = (challengeId) => {
    if (!challengeId) return;
    setOpen(false);
    navigate(`/user/challenges/${challengeId}`);
  };

  if (!invitations.length) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full justify-between py-3"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <TrophyIcon data-icon="inline-start" />
          <span className="truncate">Challenge takliflari</span>
        </span>
        <Badge variant="secondary">{invitations.length} ta</Badge>
      </Button>

      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerContent data-challenge-invitations-drawer="true">
          <DrawerHeader>
            <DrawerTitle>Challenge takliflari</DrawerTitle>
            <DrawerDescription>
              Do'stlaringiz yuborgan pending challenge takliflari.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="flex flex-col gap-3 pb-4">
            {map(invitations, (invitation) => {
              const challenge = invitation.challenge;
              const isBusy = Boolean(respondingById[invitation.id]);

              return (
                <Card key={invitation.id} size="sm">
                  <CardHeader>
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="size-10 border">
                        <AvatarImage src={invitation.inviter?.avatarUrl} />
                        <AvatarFallback>
                          {getInitials(invitation.inviter?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {challenge?.title || "Challenge"}
                        </CardTitle>
                        <CardDescription className="truncate">
                          Taklif yubordi:{" "}
                          {invitation.inviter?.name || "Foydalanuvchi"}
                        </CardDescription>
                      </div>
                    </div>
                    <CardAction>
                      <Badge variant="outline">{formatReward(challenge)}</Badge>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    {invitation.message ? (
                      <p className="text-sm text-muted-foreground">
                        {invitation.message}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{formatDateRange(challenge)}</Badge>
                      <Badge variant="secondary">
                        Ishtirokchi: {formatParticipants(challenge)}
                      </Badge>
                      <Badge variant="secondary">
                        Metrika: {formatMetric(challenge)}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-wrap gap-2">
                    {challenge?.id ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openChallenge(challenge.id)}
                      >
                        Batafsil
                        <ArrowRightIcon data-icon="inline-end" />
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespond(invitation.id, "DECLINE")}
                      disabled={isBusy}
                    >
                      {isBusy ? "Kutilmoqda..." : "Rad etish"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleRespond(invitation.id, "ACCEPT")}
                      disabled={isBusy}
                    >
                      {isBusy ? "Kutilmoqda..." : "Qabul qilish"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </DrawerBody>

          <DrawerFooter>
            <Button type="button" variant="outline" onClick={dismiss}>
              Keyinroq
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
