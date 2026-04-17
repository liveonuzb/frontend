import React from "react";
import { compact, join, map, take } from "lodash";
import { UserPlusIcon, UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const resolveInitials = (value) => {
  const parts = take(compact(String(value ?? "").trim().split(/\s+/)), 2);
  if (!parts.length) return "U";
  return join(map(parts, (part) => part[0]?.toUpperCase() ?? ""), "");
};

export default function FriendsWidget({
  friends = [],
  friendActivity,
  onAddFriend,
  onOpenFriend,
}) {
  const visibleFriends = take(friends, 4);
  const extraFriendsCount = Math.max(0, friends.length - visibleFriends.length);

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
      <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-primary/8 blur-3xl transition-opacity group-hover:opacity-90" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/70">
              Community
            </p>
            <h3 className="mt-1 inline-flex items-center gap-2 text-lg font-black tracking-tight">
              <UsersIcon className="size-4 text-primary" />
              Do&apos;stlar
            </h3>
          </div>

          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={onAddFriend}
          >
            <UserPlusIcon className="mr-1.5 size-4" />
            Add friend
          </Button>
        </div>

        <div className="pt-4">
          {visibleFriends.length > 0 ? (
            <TooltipProvider>
              <div className="flex items-center">
                {visibleFriends.map((friend, index) => (
                  <Tooltip key={friend.id || friend.name || index}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onOpenFriend?.(friend)}
                        className="-ml-2 first:ml-0 rounded-full transition-transform hover:z-10 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Avatar className="size-12 border-2 border-background shadow-sm">
                          <AvatarImage
                            src={friend?.avatarUrl || undefined}
                            alt={friend?.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {resolveInitials(friend?.name)}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8}>
                      {friend?.name || "Foydalanuvchi"}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {extraFriendsCount > 0 ? (
                  <div className="-ml-2 flex size-12 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground shadow-sm">
                    +{extraFriendsCount}
                  </div>
                ) : null}
              </div>
            </TooltipProvider>
          ) : (
            <div className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
              Hali do&apos;stlaringiz yo&apos;q. Motivatsiyani birga ushlash uchun community yig&apos;ing.
            </div>
          )}
        </div>

        <div className="mt-auto space-y-1 pt-4">
          <p className="text-sm font-medium leading-6">
            {friendActivity?.primary ||
              "Do&apos;stlaringiz bilan challenge va chat orqali faol bo&apos;ling."}
          </p>
          {friendActivity?.secondary ? (
            <p className="text-xs text-muted-foreground">
              {friendActivity.secondary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
