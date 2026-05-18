import React from "react";
import { get, find, isArray, map, orderBy, some, toNumber, filter } from "lodash";
import { ArrowRightIcon, MedalIcon, PartyPopperIcon, TrophyIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { useAuthStore } from "@/store";
import { DASHBOARD_CHALLENGES_QUERY_KEY } from "./query-helpers.js";

const STORAGE_PREFIX = "challenge-completion:shown";
const OPEN_DELAY_MS = 3500;
const RETRY_AFTER_BLOCKING_MS = 5000;

const storageKey = (userId, challengeId) =>
  `${STORAGE_PREFIX}:${userId}:${challengeId}`;

const getChallengeItems = (response) => {
  const payload = getApiResponseData(response, []);
  return isArray(payload) ? payload : get(payload, "items", []);
};

const isJoinedChallenge = (challenge, userId) =>
  Boolean(challenge?.isJoined) ||
  (isArray(challenge?.participants) &&
    some(challenge.participants, (participant) => participant.userId === userId));

const resolveRank = (challenge, userId) => {
  const directRank = get(challenge, "myRank") || get(challenge, "myProgress.rank");
  if (directRank) return toNumber(directRank);

  const participants = isArray(challenge?.participants)
    ? [...challenge.participants]
    : [];
  const ranking = map(
    orderBy(
      participants,
      [
        (participant) => toNumber(participant?.metricValue ?? 0),
        (participant) => toNumber(participant?.progress ?? 0),
      ],
      ["desc", "desc"],
    ),
    (participant, index) => ({ ...participant, rank: index + 1 }),
  );

  return find(ranking, (participant) => participant.userId === userId)?.rank ?? null;
};

const resolveReward = (challenge) => {
  const details = challenge?.rewardDetails || {};
  const rewardXp = toNumber(details.previewRewardXp ?? challenge?.rewardXp ?? 0);
  if (rewardXp > 0) return `${rewardXp.toLocaleString("uz-UZ")} XP`;
  if (details.mode === "PERCENT_OF_POOL") return `${details.percent || 0}% pool`;
  if (details.mode === "PLACE_XP") return "Top o'rin mukofoti";
  return "Mukofot hisoblanadi";
};

const findCompletedChallenge = (challenges, userId) =>
  find(orderBy(filter(
    challenges,
    (challenge) => challenge?.status === "COMPLETED" && isJoinedChallenge(challenge, userId),
  ), [(challenge) => new Date(challenge.endDate).getTime()], ["desc"]), (challenge) => {
      if (typeof window === "undefined") return true;
      return window.localStorage.getItem(storageKey(userId, challenge.id)) !== "1";
    }) || null;

export default function ChallengeCompletionDrawer() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const [open, setOpen] = React.useState(false);
  const shownRef = React.useRef(false);

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
  const completedChallenge = React.useMemo(
    () => findCompletedChallenge(challenges, userId),
    [challenges, userId],
  );
  const rank = resolveRank(completedChallenge, userId);

  React.useEffect(() => {
    if (!userId || !completedChallenge?.id || shownRef.current) return undefined;
    if (typeof window === "undefined") return undefined;

    const state = { cancelled: false, retryId: null };

    const tryOpen = () => {
      if (state.cancelled || shownRef.current) return;
      const blocking = document.querySelector(
        '[data-vaul-drawer-direction="bottom"]:not([data-challenge-completion-drawer="true"])',
      );
      if (blocking) {
        state.retryId = window.setTimeout(tryOpen, RETRY_AFTER_BLOCKING_MS);
        return;
      }

      shownRef.current = true;
      window.localStorage.setItem(storageKey(userId, completedChallenge.id), "1");
      setOpen(true);
    };

    const openId = window.setTimeout(tryOpen, OPEN_DELAY_MS);

    return () => {
      state.cancelled = true;
      window.clearTimeout(openId);
      if (state.retryId) window.clearTimeout(state.retryId);
    };
  }, [completedChallenge?.id, userId]);

  const close = () => setOpen(false);
  const openChallenge = () => {
    if (!completedChallenge?.id) return;
    setOpen(false);
    navigate(`/user/challenges/${completedChallenge.id}`);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      direction="bottom"
    >
      <DrawerContent data-challenge-completion-drawer="true">
        <DrawerHeader className="text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-3xl bg-emerald-500/10">
            <PartyPopperIcon className="size-8 text-emerald-500" />
          </div>
          <DrawerTitle>Challenge yakunlandi</DrawerTitle>
          <DrawerDescription>
            {completedChallenge?.title || "Challenge"} natijalari tayyor.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-5 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-center">
              <MedalIcon className="mx-auto mb-2 size-5 text-amber-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                O'rin
              </p>
              <p className="mt-1 text-2xl font-black">
                {rank ? `${rank}` : "—"}
                {rank ? <span className="ml-1 text-xs text-muted-foreground">o'rin</span> : null}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-center">
              <TrophyIcon className="mx-auto mb-2 size-5 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mukofot
              </p>
              <p className="mt-1 text-lg font-black">{resolveReward(completedChallenge)}</p>
            </div>
          </div>

          <Badge variant="secondary" className="mx-auto flex w-fit rounded-lg">
            Natijalar leaderboardda ko'rinadi
          </Badge>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={close}>
              Yopish
            </Button>
            <Button type="button" onClick={openChallenge}>
              Natijani ko'rish
              <ArrowRightIcon className="ml-2 size-4" />
            </Button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
