import React from "react";
import { filter, get, map, size, take } from "lodash";
import {
  ActivityIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const resolveInitials = (value) =>
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("") || "U";

const METRIC_LABELS = {
  STEPS: "qadam",
  WORKOUT_MINUTES: "daqiqa",
  BURNED_CALORIES: "kcal",
  SLEEP_HOURS: "soat",
};

const RANK_COLORS = [
  "text-amber-500",
  "text-slate-400",
  "text-orange-600",
];

const FriendActivityFeed = ({
  friends = [],
  challenges = [],
  currentUserId,
  onAddFriend,
  onOpenChallenges,
}) => {
  const friendIds = React.useMemo(
    () => new Set(friends.map((f) => f.id)),
    [friends],
  );

  const friendNameById = React.useMemo(
    () =>
      new Map(friends.map((f) => [f.id, f.name || "Do'st"])),
    [friends],
  );

  const friendAvatarById = React.useMemo(
    () => new Map(friends.map((f) => [f.id, f.avatarUrl || null])),
    [friends],
  );

  const activitiesFromChallenges = React.useMemo(() => {
    const activities = [];

    for (const challenge of challenges) {
      const participants = Array.isArray(challenge?.participants)
        ? challenge.participants
        : [];
      if (size(participants) === 0) continue;

      const sorted = [...participants].sort(
        (a, b) => Number(b.metricValue ?? 0) - Number(a.metricValue ?? 0),
      );

      const metricType =
        get(challenge, "metricDetails.type") ||
        get(challenge, "metricType") ||
        "STEPS";
      const metricUnit = METRIC_LABELS[metricType] || "birlik";

      for (let i = 0; i < sorted.length; i++) {
        const participant = sorted[i];
        const uid = get(participant, "userId");
        if (!uid || uid === currentUserId) continue;
        if (!friendIds.has(uid)) continue;

        const metricValue = Number(get(participant, "metricValue", 0));
        const progress = Math.min(100, Math.round(Number(get(participant, "progress", 0))));

        activities.push({
          key: `${challenge.id}-${uid}`,
          uid,
          name: friendNameById.get(uid) || "Do'st",
          avatarUrl: friendAvatarById.get(uid),
          challengeTitle: get(challenge, "title", "Challenge"),
          challengeId: challenge.id,
          rank: i + 1,
          metricValue,
          metricUnit,
          progress,
          status: get(challenge, "status", "ACTIVE"),
        });
      }
    }

    return take(
      activities.sort((a, b) => b.metricValue - a.metricValue),
      6,
    );
  }, [challenges, currentUserId, friendIds, friendNameById, friendAvatarById]);

  const friendsWithNoChallenge = React.useMemo(() => {
    const activeInChallenges = new Set(activitiesFromChallenges.map((a) => a.uid));
    return filter(friends, (f) => !activeInChallenges.has(f.id)).slice(0, 3);
  }, [friends, activitiesFromChallenges]);

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.08] via-card to-card px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5">
      <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-violet-500/8 blur-3xl transition-opacity group-hover:opacity-90" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-600/70">
              Community
            </p>
            <h3 className="mt-1 inline-flex items-center gap-2 text-lg font-black tracking-tight">
              <ActivityIcon className="size-4 text-violet-500" />
              Do&apos;stlar faoliyati
            </h3>
          </div>
          {onAddFriend ? (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-violet-500/20 bg-violet-500/5 text-violet-700 hover:bg-violet-500/10"
              onClick={onAddFriend}
            >
              <UserPlusIcon className="mr-1.5 size-3.5" />
              Qo&apos;shish
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex-1 space-y-2">
          {size(friends) === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Hali do&apos;stlaringiz yo&apos;q</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Do&apos;stlarni taklif qilib, birga motivatsiya toping
                </p>
              </div>
              {onAddFriend ? (
                <Button size="sm" onClick={onAddFriend} className="mt-1">
                  <UserPlusIcon className="mr-1.5 size-3.5" />
                  Do&apos;st qo&apos;shish
                </Button>
              ) : null}
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
                    <AvatarFallback className="bg-violet-500/10 text-xs font-bold text-violet-600">
                      {resolveInitials(friend.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">Challenge yo&apos;q</p>
                  </div>
                </div>
              ))}
              {onOpenChallenges ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full rounded-xl"
                  onClick={onOpenChallenges}
                >
                  <TrophyIcon className="mr-1.5 size-3.5" />
                  Challengega qo&apos;shilish
                </Button>
              ) : null}
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
                      <AvatarFallback className="bg-violet-500/10 text-xs font-bold text-violet-600">
                        {resolveInitials(activity.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-card">
                      <ZapIcon className="size-2.5 text-amber-500" />
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
                  {map(friendsWithNoChallenge, (f) => (
                    <Avatar key={f.id} className="size-7 border border-border/40">
                      <AvatarImage src={f.avatarUrl || undefined} />
                      <AvatarFallback className="text-[9px] font-bold text-muted-foreground">
                        {resolveInitials(f.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {size(friendsWithNoChallenge) > 0 ? (
                    <p className="ml-1 text-[10px] text-muted-foreground">
                      va yana{" "}
                      {friendsWithNoChallenge.length === 1
                        ? friendsWithNoChallenge[0].name
                        : `${friendsWithNoChallenge.length} do'st`}{" "}
                      faol emas
                    </p>
                  ) : null}
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
