import React from "react";
import {
  filter,
  keyBy,
  map,
  size,
  isArray,
  toUpper,
  split,
  trim,
  take,
} from "lodash";
import { useNavigate } from "react-router";
import { UserPlusIcon, UsersIcon } from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { getFriendItems } from "@/modules/user/lib/friends-response";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  buildFriendActivities,
  DASHBOARD_CHALLENGES_QUERY_KEY,
  DASHBOARD_FRIENDS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  getUserFromResponse,
} from "./query-helpers.js";

const resolveInitials = (value) =>
  map(
    take(filter(split(trim(String(value ?? "")), /\s+/), Boolean), 2),
    (part) => toUpper(part[0] ?? ""),
  ).join("") || "U";

const FRIEND_STATUS_FALLBACKS = ["Bugun", "Online", "2 soat oldin", "Kecha"];

const getChallengeItems = (response) => {
  const payload = getApiResponseData(response, []);
  return isArray(payload) ? payload : (payload?.items ?? []);
};

const FriendActivityFeed = ({
  friends: friendsOverride,
  challenges: challengesOverride,
  currentUserId,
  onAddFriend,
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
  const activitiesByUserId = React.useMemo(
    () => keyBy(activitiesFromChallenges, "uid"),
    [activitiesFromChallenges],
  );
  const friendPreview = React.useMemo(() => take(friends, 4), [friends]);
  const handleAddFriend = React.useCallback(() => {
    if (onAddFriend) {
      onAddFriend();
      return;
    }
    navigate("/user/friends");
  }, [navigate, onAddFriend]);
  const handleOpenFriends = React.useCallback(() => {
    navigate("/user/friends");
  }, [navigate]);
  const resolveStatus = React.useCallback(
    (friend, index) => {
      if (friend.statusLabel) return friend.statusLabel;
      if (friend.status) return friend.status;
      if (friend.isOnline || friend.online) return "Online";
      if (activitiesByUserId[friend.id]) return "Bugun";

      return FRIEND_STATUS_FALLBACKS[index] || "Faol";
    },
    [activitiesByUserId],
  );

  return (
    <Card className="group/card relative h-full overflow-hidden py-4 transition-all hover:-translate-y-0.5 hover:ring-primary/25 hover:shadow-lg">
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/10 blur-[24px] transition-colors group-hover/card:bg-primary/20" />
      <CardHeader className="relative z-10 px-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
            <span className="rounded bg-primary/10 p-1 text-primary">
              <UsersIcon className="size-3" />
            </span>
            <span className="truncate">Do&apos;stlar</span>
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            className="h-7 shrink-0 rounded-full px-2 text-xs font-bold text-primary hover:bg-primary/10"
            onClick={handleOpenFriends}
          >
            Barchasi
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-1 flex-col px-4 pb-4">
        <div className="flex items-start gap-3 overflow-hidden">
          {size(friends) === 0 ? (
            <div className="flex min-h-16 flex-1 items-center justify-between gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-3 py-2">
              <p className="min-w-0 text-xs font-medium text-muted-foreground">
                Hali do&apos;stlaringiz yo&apos;q
              </p>
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0 rounded-full text-xs"
                onClick={handleAddFriend}
              >
                <UserPlusIcon className="size-3.5" />
                Qo&apos;shish
              </Button>
            </div>
          ) : (
            map(friendPreview, (friend, index) => {
              const status = resolveStatus(friend, index);
              const isOnline =
                status === "Online" || friend.isOnline || friend.online;

              return (
                <div
                  key={friend.id}
                  className="min-w-0 shrink-0 text-center"
                  title={friend.name}
                >
                  <div className="relative mx-auto w-fit">
                    <Avatar
                      className={cn(
                        "size-12 border-2 border-border/50 shadow-sm",
                        isOnline && "border-emerald-400",
                      )}
                    >
                      <AvatarImage src={friend.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                        {resolveInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline ? (
                      <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-card bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-2 max-w-14 truncate text-xs font-bold leading-none">
                    {friend.name}
                  </p>
                  <p
                    className={cn(
                      "mt-1 max-w-14 truncate text-[10px] font-medium text-muted-foreground",
                      isOnline && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {status}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendActivityFeed;
