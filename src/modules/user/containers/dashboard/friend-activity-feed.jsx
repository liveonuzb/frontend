import React from "react";
import { filter, map, size } from "lodash";
import { useNavigate } from "react-router";
import {
  ActivityIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import useGetQuery from "@/hooks/api/use-get-query";
import { getApiResponseData } from "@/lib/api-response";
import { getFriendItems } from "@/modules/user/lib/friends-response";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildFriendActivities,
  DASHBOARD_CHALLENGES_QUERY_KEY,
  DASHBOARD_FRIENDS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
} from "./query-helpers.js";

const resolveInitials = (value) =>
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => (part[0] ?? "").toUpperCase())
    .join("") || "U";

const RANK_COLORS = [
  "text-amber-500",
  "text-slate-400",
  "text-orange-600",
];

const getChallengeItems = (response) => {
  const payload = getApiResponseData(response, []);
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

const FriendActivityFeed = ({
  friends: friendsOverride,
  challenges: challengesOverride,
  currentUserId,
  onAddFriend,
  onOpenChallenges,
}) => {
  const navigate = useNavigate();
  const shouldFetchFriends = friendsOverride === undefined;
  const shouldFetchChallenges = challengesOverride === undefined;
  const shouldFetchUser = currentUserId === undefined;
  const { data: userData } = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
      enabled: shouldFetchUser,
    },
  });
  const { data: friendsData } = useGetQuery({
    url: "/users/me/friends",
    queryProps: {
      queryKey: DASHBOARD_FRIENDS_QUERY_KEY,
      enabled: shouldFetchFriends,
    },
  });
  const { data: challengesData } = useGetQuery({
    url: "/challenges",
    queryProps: {
      queryKey: DASHBOARD_CHALLENGES_QUERY_KEY,
      enabled: shouldFetchChallenges,
    },
  });
  const user = React.useMemo(() => getUserFromResponse(userData), [userData]);
  const friends = React.useMemo(
    () => friendsOverride ?? getFriendItems(friendsData),
    [friendsData, friendsOverride],
  );
  const challenges = React.useMemo(
    () => challengesOverride ?? getChallengeItems(challengesData),
    [challengesData, challengesOverride],
  );
  const resolvedCurrentUserId = currentUserId ?? user?.id;
  const activitiesFromChallenges = React.useMemo(
    () =>
      buildFriendActivities({
        friends,
        challenges,
        currentUserId: resolvedCurrentUserId,
      }),
    [challenges, friends, resolvedCurrentUserId],
  );
  const friendsWithNoChallenge = React.useMemo(() => {
    const activeInChallenges = new Set(
      activitiesFromChallenges.map((activity) => activity.uid),
    );
    return filter(friends, (friend) => !activeInChallenges.has(friend.id)).slice(0, 3);
  }, [activitiesFromChallenges, friends]);
  const handleAddFriend = React.useCallback(() => {
    if (onAddFriend) {
      onAddFriend();
      return;
    }
    navigate("/user/friends");
  }, [navigate, onAddFriend]);
  const handleOpenChallenges = React.useCallback(() => {
    if (onOpenChallenges) {
      onOpenChallenges();
      return;
    }
    navigate("/user/challenges");
  }, [navigate, onOpenChallenges]);

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-[rgb(var(--accent-rgb)/0.15)] bg-gradient-to-br from-[rgb(var(--accent-rgb)/0.08)] via-card to-card px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb)/0.30)] hover:shadow-xl hover:shadow-[rgb(var(--accent-rgb)/0.05)]">
      <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-[rgb(var(--accent-rgb)/0.08)] blur-3xl transition-opacity group-hover:opacity-90" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--accent-strong-rgb)/0.70)]">
              Community
            </p>
            <h3 className="mt-1 inline-flex items-center gap-2 text-lg font-black tracking-tight">
              <ActivityIcon className="size-4 text-[rgb(var(--accent-rgb))]" />
              Do&apos;stlar faoliyati
            </h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-[rgb(var(--accent-rgb)/0.20)] bg-[rgb(var(--accent-rgb)/0.05)] text-[rgb(var(--accent-strong-rgb))] hover:bg-[rgb(var(--accent-rgb)/0.10)]"
            onClick={handleAddFriend}
          >
            <UserPlusIcon className="mr-1.5 size-3.5" />
            Qo&apos;shish
          </Button>
        </div>

        <div className="mt-4 flex-1 space-y-2">
          {size(friends) === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[rgb(var(--accent-rgb)/0.10)] text-[rgb(var(--accent-rgb))]">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Hali do&apos;stlaringiz yo&apos;q</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Do&apos;stlarni taklif qilib, birga motivatsiya toping
                </p>
              </div>
              <Button size="sm" onClick={handleAddFriend} className="mt-1">
                <UserPlusIcon className="mr-1.5 size-3.5" />
                Do&apos;st qo&apos;shish
              </Button>
            </div>
          ) : size(activitiesFromChallenges) === 0 ? (
            <div className="space-y-2">
              {map(friends.slice(0, 4), (friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-xl px-1 py-1.5"
                >
                  <Avatar className="size-9 border border-border/40">
                    <AvatarImage src={friend.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[rgb(var(--accent-rgb)/0.10)] text-xs font-bold text-[rgb(var(--accent-strong-rgb))]">
                      {resolveInitials(friend.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">Challenge yo&apos;q</p>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full rounded-xl"
                onClick={handleOpenChallenges}
              >
                <TrophyIcon className="mr-1.5 size-3.5" />
                Challengega qo&apos;shilish
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {map(activitiesFromChallenges, (activity) => (
                <div
                  key={activity.key}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-3 py-2 transition-colors hover:bg-muted/20"
                >
                  <div className="relative">
                    <Avatar className="size-9 border border-border/40">
                      <AvatarImage src={activity.avatarUrl || undefined} />
                      <AvatarFallback className="bg-[rgb(var(--accent-rgb)/0.10)] text-xs font-bold text-[rgb(var(--accent-strong-rgb))]">
                        {resolveInitials(activity.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-card">
                      <ZapIcon className="size-2.5 text-[rgb(var(--accent-rgb))]" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold">{activity.name}</p>
                      <span
                        className={cn(
                          "shrink-0 text-[10px] font-black",
                          RANK_COLORS[activity.rank - 1] || "text-muted-foreground",
                        )}
                      >
                        #{activity.rank}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {new Intl.NumberFormat("uz-UZ").format(activity.metricValue)}
                      </span>{" "}
                      {activity.metricUnit} — {activity.challengeTitle}
                    </p>
                  </div>
                </div>
              ))}

              {size(friendsWithNoChallenge) > 0 ? (
                <div className="flex items-center gap-1.5 pt-1">
                  {map(friendsWithNoChallenge, (friend) => (
                    <Avatar key={friend.id} className="size-7 border border-border/40">
                      <AvatarImage src={friend.avatarUrl || undefined} />
                      <AvatarFallback className="text-[9px] font-bold text-muted-foreground">
                        {resolveInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  <p className="ml-1 text-[10px] text-muted-foreground">
                    va yana{" "}
                    {friendsWithNoChallenge.length === 1
                      ? friendsWithNoChallenge[0].name
                      : `${friendsWithNoChallenge.length} do'st`}{" "}
                    faol emas
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendActivityFeed;
