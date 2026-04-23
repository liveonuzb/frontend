import React from "react";
import { get } from "lodash";
import { useNavigate } from "react-router";
import { ArrowRightIcon, TrophyIcon } from "lucide-react";
import useGetQuery from "@/hooks/api/use-get-query";
import { getApiResponseData } from "@/lib/api-response";
import { getFriendItems } from "@/modules/user/lib/friends-response";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  buildCommunityChallenge,
  DASHBOARD_CHALLENGES_QUERY_KEY,
  DASHBOARD_FRIENDS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
} from "./query-helpers.js";

const getChallengeItems = (response) => {
  const payload = getApiResponseData(response, []);
  return Array.isArray(payload) ? payload : get(payload, "items", []);
};

export default function CurrentChallengeWidget({
  currentChallenge: currentChallengeOverride,
  onOpenChallenge,
}) {
  const navigate = useNavigate();
  const shouldFetch = currentChallengeOverride === undefined;
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: shouldFetch,
    },
  });
  const { data: friendsData } = useGetQuery({
    url: "/users/me/friends",
    queryProps: {
      queryKey: DASHBOARD_FRIENDS_QUERY_KEY,
      enabled: shouldFetch,
    },
  });
  const { data: challengesData } = useGetQuery({
    url: "/challenges",
    queryProps: {
      queryKey: DASHBOARD_CHALLENGES_QUERY_KEY,
      enabled: shouldFetch,
    },
  });
  const user = React.useMemo(() => getUserFromResponse(userData), [userData]);
  const friends = React.useMemo(() => getFriendItems(friendsData), [friendsData]);
  const challenges = React.useMemo(
    () => getChallengeItems(challengesData),
    [challengesData],
  );
  const currentChallenge = React.useMemo(
    () =>
      currentChallengeOverride ??
      buildCommunityChallenge({
        challenges,
        friends,
        userId: user?.id,
      }),
    [challenges, currentChallengeOverride, friends, user?.id],
  );
  const handleOpenChallenge = React.useCallback(
    (challengeId) => {
      if (onOpenChallenge) {
        onOpenChallenge(challengeId);
        return;
      }
      navigate(challengeId ? `/user/challenges/${challengeId}` : "/user/challenges");
    },
    [navigate, onOpenChallenge],
  );

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.10] via-card to-card px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-500/35 hover:shadow-xl hover:shadow-amber-500/5">
      <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-amber-500/10 blur-3xl transition-opacity group-hover:opacity-90" />
      <div className="relative flex h-full flex-col">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-600/80 dark:text-amber-300/80">
            Challenge
          </p>
          <h3 className="mt-1 inline-flex items-center gap-2 text-lg font-black tracking-tight">
            <TrophyIcon className="size-4 text-amber-500" />
            Joriy challenge
          </h3>
        </div>

        {currentChallenge ? (
          <button
            type="button"
            onClick={() => handleOpenChallenge(currentChallenge.id)}
            className="mt-4 flex w-full flex-1 flex-col gap-4 rounded-[22px] border border-amber-500/15 bg-background/85 p-4 text-left transition-colors hover:border-amber-500/30 hover:bg-background"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-base font-bold tracking-tight">
                  {currentChallenge.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentChallenge.dayLabel}
                </p>
              </div>
              {currentChallenge.rankLabel ? (
                <div className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {currentChallenge.rankLabel}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentChallenge.metricSummary}</span>
                <span>{currentChallenge.progress}%</span>
              </div>
              <Progress value={currentChallenge.progress} className="h-2.5 bg-amber-500/15" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {currentChallenge.contextLabel}
              </p>
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-300">
                <span>View</span>
                <ArrowRightIcon className="size-4" />
              </div>
            </div>
          </button>
        ) : (
          <div className="mt-4 flex flex-1 flex-col rounded-[22px] border border-dashed bg-background/85 p-4">
            <p className="text-sm font-medium">Hali faol challenge topilmadi.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Challenge&apos;ga qo&apos;shilib, do&apos;stlaringiz bilan progressni solishtiring.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-auto"
              onClick={() => handleOpenChallenge()}
            >
              Challenge&apos;larni ko&apos;rish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
