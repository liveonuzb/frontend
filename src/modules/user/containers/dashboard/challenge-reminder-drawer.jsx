import React from "react";
import { get } from "lodash";
import { ArrowRightIcon, TargetIcon, TrophyIcon } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import useGetQuery from "@/hooks/api/use-get-query";
import { getApiResponseData } from "@/lib/api-response";
import { useAuthStore } from "@/store";
import {
  challengeMetricLabels,
  challengeMetricUnits,
  DASHBOARD_CHALLENGES_QUERY_KEY,
  normalizeDateKey,
} from "./query-helpers.js";
import useReminderTrigger from "./use-reminder-trigger.js";

const STORAGE_PREFIX = "challenge-reminder:dismissed-on";

const storageKey = (userId, challengeId) =>
  `${STORAGE_PREFIX}:${userId}:${challengeId}`;

const getChallengeItems = (response) => {
  const payload = getApiResponseData(response, []);
  return Array.isArray(payload) ? payload : get(payload, "items", []);
};

const isJoinedChallenge = (challenge, userId) =>
  Boolean(challenge?.isJoined) ||
  (Array.isArray(challenge?.participants) &&
    challenge.participants.some((participant) => participant.userId === userId));

const getMetricType = (challenge) =>
  get(challenge, "metricDetails.type") || get(challenge, "metricType") || "STEPS";

const getMetricTarget = (challenge) =>
  Number(get(challenge, "metricDetails.target") ?? get(challenge, "metricTarget") ?? 0);

const getTodayMetricValue = (challenge, today) => {
  const source =
    get(challenge, "dailyProgress") ||
    get(challenge, "myDailyProgress") ||
    get(challenge, "progressHistory") ||
    get(challenge, "myProgress.history") ||
    [];
  const entries = Array.isArray(source) ? source : [];
  const todayEntry = entries.find((item) => {
    const rawDate = get(item, "date") || get(item, "day") || get(item, "loggedAt");
    if (!rawDate) return false;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;
    return normalizeDateKey(date) === today;
  });

  if (todayEntry) {
    return Number(
      get(todayEntry, "metricValue") ??
        get(todayEntry, "value") ??
        get(todayEntry, "amount") ??
        0,
    );
  }

  return Number(get(challenge, "myMetricValue") ?? 0);
};

const getProgress = (challenge) =>
  Math.max(0, Math.min(100, Number(get(challenge, "myProgress") ?? 0)));

const findReminderChallenge = (challenges, userId, today) =>
  challenges
    .filter(
      (challenge) =>
        challenge?.status === "ACTIVE" &&
        isJoinedChallenge(challenge, userId) &&
        getProgress(challenge) < 100,
    )
    .sort((left, right) => new Date(left.endDate).getTime() - new Date(right.endDate).getTime())
    .find((challenge) => {
      if (typeof window === "undefined") return true;
      return window.localStorage.getItem(storageKey(userId, challenge.id)) !== today;
    }) || null;

export default function ChallengeReminderDrawer() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const today = normalizeDateKey(new Date());
  const [open, setOpen] = React.useState(false);

  const { data: challengesData } = useGetQuery({
    url: "/challenges",
    queryProps: {
      queryKey: DASHBOARD_CHALLENGES_QUERY_KEY,
      enabled: Boolean(userId),
    },
  });

  const challenges = React.useMemo(
    () => getChallengeItems(challengesData),
    [challengesData],
  );
  const reminderChallenge = React.useMemo(
    () => findReminderChallenge(challenges, userId, today),
    [challenges, today, userId],
  );

  const metricType = getMetricType(reminderChallenge);
  const metricTarget = getMetricTarget(reminderChallenge);
  const metricUnit = challengeMetricUnits[metricType] || "birlik";
  const metricLabel = challengeMetricLabels[metricType] || "Progress";
  const metricValue = getTodayMetricValue(reminderChallenge, today);
  const progress =
    metricTarget > 0
      ? Math.max(0, Math.min(100, Math.round((metricValue / metricTarget) * 100)))
      : getProgress(reminderChallenge);

  useReminderTrigger({
    enabled: Boolean(userId && reminderChallenge?.id),
    excludeSelector: '[data-challenge-reminder-drawer="true"]',
    thresholdMs: 45000,
    onTrigger: () => setOpen(true),
  });

  const dismiss = React.useCallback(() => {
    if (userId && reminderChallenge?.id && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId, reminderChallenge.id), today);
    }
    setOpen(false);
  }, [reminderChallenge?.id, today, userId]);

  const openChallenge = () => {
    if (!reminderChallenge?.id) return;
    dismiss();
    navigate(`/user/challenges/${reminderChallenge.id}`);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      direction="bottom"
    >
      <DrawerContent data-challenge-reminder-drawer="true">
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <TrophyIcon className="size-7 text-amber-500" />
          </div>
          <DrawerTitle>Challenge davom etmoqda</DrawerTitle>
          <DrawerDescription>
            {reminderChallenge?.title || "Challenge"} bo'yicha bugungi holatingiz.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-5 pb-6">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-background">
                <TargetIcon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{metricLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {metricValue.toLocaleString("uz-UZ")} /{" "}
                  {metricTarget.toLocaleString("uz-UZ")} {metricUnit}
                </p>
              </div>
            </div>
            <Progress
              value={progress}
              className="h-2.5 bg-emerald-500/10 [&>div]:bg-emerald-500"
            />
            <p className="mt-2 text-right text-xs font-semibold text-emerald-600">
              {progress}%
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={dismiss}>
              Keyinroq
            </Button>
            <Button type="button" onClick={openChallenge}>
              Challenge'ni ochish
              <ArrowRightIcon className="ml-2 size-4" />
            </Button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
