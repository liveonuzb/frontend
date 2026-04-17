import { compact } from "lodash";
import React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeftIcon,
  BellOffIcon,
  BellIcon,
  GiftIcon,
  LockIcon,
  MessageSquareIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
  UserPlusIcon,
  UserCheckIcon,
  UserXIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";
import PageTransition from "@/components/page-transition";
import GiftPremiumDrawer from "@/modules/user/components/gift-premium-drawer.jsx";

const MutualFriends = ({ profileId }) => {
  const { data } = useGetQuery({
    url: `/users/me/friends/mutual/${profileId}`,
    queryProps: {
      queryKey: ["users", "mutual-friends", profileId],
      enabled: Boolean(profileId),
    },
  });

  const items = data?.data?.items ?? [];
  const count = data?.data?.count ?? 0;

  if (count === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <UsersIcon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {count} ta umumiy do&apos;st
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {items.slice(0, 5).map((f) => {
          const initials = compact([f.name?.[0]])
            .join("")
            .toUpperCase() || "?";
          return (
            <Avatar key={f.id} className="size-7 border border-border">
              <AvatarImage src={f.avatarUrl || undefined} />
              <AvatarFallback className="text-[9px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          );
        })}
        {count > 5 ? (
          <span className="ml-1 text-xs text-muted-foreground">
            +{count - 5} ta
          </span>
        ) : null}
      </div>
    </div>
  );
};

const PublicProfileContainer = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useGetQuery({
    url: `/users/profile/${encodeURIComponent(identifier)}`,
    queryProps: {
      queryKey: ["users", "profile", identifier],
      enabled: Boolean(identifier),
    },
  });

  const sendFriendRequest = usePostQuery({
    queryKey: ["users", "profile", identifier],
    listKey: ["me", "friends"],
  });

  const { request } = useApi();
  const queryClient = useQueryClient();
  const profile = data?.data;
  const [giftDrawerOpen, setGiftDrawerOpen] = React.useState(false);
  const [isBlocking, setIsBlocking] = React.useState(false);
  const [isMuting, setIsMuting] = React.useState(false);

  const { data: muteStatusData } = useGetQuery({
    url: profile ? `/users/me/muted/${profile?.id}/status` : null,
    queryProps: {
      queryKey: ["users", "mute-status", profile?.id],
      enabled: Boolean(profile?.id),
    },
  });
  const isMutedByMe = muteStatusData?.data?.muted ?? false;

  const handleSendFriendRequest = React.useCallback(() => {
    if (!profile) return;
    sendFriendRequest.mutate({
      url: "/users/me/friends/requests",
      attributes: { recipientId: profile.id },
    });
  }, [profile, sendFriendRequest]);

  const handleBlock = React.useCallback(async () => {
    if (!profile) return;
    setIsBlocking(true);
    try {
      await request.post(`/users/me/blocked/${profile.id}`);
      queryClient.invalidateQueries({ queryKey: ["users", "profile", identifier] });
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsBlocking(false);
    }
  }, [profile, request, queryClient, identifier]);

  const handleUnblock = React.useCallback(async () => {
    if (!profile) return;
    setIsBlocking(true);
    try {
      await request.delete(`/users/me/blocked/${profile.id}`);
      queryClient.invalidateQueries({ queryKey: ["users", "profile", identifier] });
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsBlocking(false);
    }
  }, [profile, request, queryClient, identifier]);

  const handleMute = React.useCallback(async () => {
    if (!profile) return;
    setIsMuting(true);
    try {
      await request.post(`/users/me/muted/${profile.id}`);
      queryClient.invalidateQueries({ queryKey: ["users", "mute-status", profile.id] });
      toast.success("Foydalanuvchi ovozi o'chirildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsMuting(false);
    }
  }, [profile, request, queryClient]);

  const handleUnmute = React.useCallback(async () => {
    if (!profile) return;
    setIsMuting(true);
    try {
      await request.delete(`/users/me/muted/${profile.id}`);
      queryClient.invalidateQueries({ queryKey: ["users", "mute-status", profile.id] });
      toast.success("Foydalanuvchi ovozi yoqildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsMuting(false);
    }
  }, [profile, request, queryClient]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <UsersIcon className="size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Foydalanuvchi topilmadi
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="mr-1.5 size-3.5" />
            Orqaga
          </Button>
        </div>
      </PageTransition>
    );
  }

  const fullName = compact([profile.firstName, profile.lastName]).join(" ");
  const initials = compact([profile.firstName?.[0], profile.lastName?.[0]])
    .join("")
    .toUpperCase();

  // Private profile
  if (profile.isPrivate) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="mr-1.5 size-3.5" />
            Orqaga
          </Button>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
            <Avatar className="size-20">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-lg">{initials || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{fullName || "Foydalanuvchi"}</h2>
              {profile.username ? (
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <LockIcon className="size-4" />
              <span className="text-sm">Bu profil yopiq</span>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Public profile
  return (
    <PageTransition>
      <div className="mx-auto max-w-lg px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="mr-1.5 size-3.5" />
          Orqaga
        </Button>

        <div className="space-y-6">
          {/* Profile header */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
            <Avatar className="size-24">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback className="text-xl">{initials || "?"}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-bold">{fullName || "Foydalanuvchi"}</h2>
              {profile.username ? (
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              ) : null}
              {profile.bio ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.bio}
                </p>
              ) : null}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-lg font-bold">{profile.level ?? 1}</p>
                <p className="text-[11px] text-muted-foreground">Daraja</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold">{profile.friendCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground">Do&apos;stlar</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold">
                  {profile.completedChallenges ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">Challenge</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {profile.xp > 0 ? (
                <Badge variant="secondary" className="gap-1">
                  <StarIcon className="size-3" />
                  {profile.xp} XP
                </Badge>
              ) : null}
              {profile.goal ? (
                <Badge variant="outline" className="gap-1 capitalize">
                  <TrophyIcon className="size-3" />
                  {profile.goal.replace(/_/g, " ")}
                </Badge>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {profile.friendshipStatus === "friends" ? (
                <Button variant="outline" size="sm" disabled>
                  <UserCheckIcon className="mr-1.5 size-3.5" />
                  Do&apos;stlar
                </Button>
              ) : profile.friendshipStatus === "request_sent" ? (
                <Button variant="outline" size="sm" disabled>
                  <ClockIcon className="mr-1.5 size-3.5" />
                  So&apos;rov yuborilgan
                </Button>
              ) : profile.friendshipStatus === "request_received" ? (
                <Button variant="outline" size="sm">
                  <UserPlusIcon className="mr-1.5 size-3.5" />
                  Qabul qilish
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSendFriendRequest}
                  disabled={sendFriendRequest.isPending}
                >
                  <UserPlusIcon className="mr-1.5 size-3.5" />
                  Do&apos;st bo&apos;lish
                </Button>
              )}

              {profile.allowMessages ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/user/chat?userId=${profile.id}`)}
                >
                  <MessageSquareIcon className="mr-1.5 size-3.5" />
                  Xabar
                </Button>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setGiftDrawerOpen(true)}
              >
                <GiftIcon className="mr-1.5 size-3.5" />
                Premium sovg&apos;a
              </Button>

              {isMutedByMe ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isMuting}
                  onClick={handleUnmute}
                >
                  <BellIcon className="mr-1.5 size-3.5" />
                  Ovozni yoqish
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isMuting}
                  onClick={handleMute}
                >
                  <BellOffIcon className="mr-1.5 size-3.5" />
                  Ovozni o&apos;chirish
                </Button>
              )}

              {profile.isBlockedByMe ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBlocking}
                  onClick={handleUnblock}
                >
                  <UserXIcon className="mr-1.5 size-3.5" />
                  Blokdan chiqarish
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isBlocking}
                  onClick={handleBlock}
                >
                  <ShieldIcon className="mr-1.5 size-3.5" />
                  Bloklash
                </Button>
              )}
            </div>
          </div>

          {/* Mutual friends */}
          <MutualFriends profileId={profile.id} />

          {/* Member since */}
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldIcon className="size-3.5" />
              <span>
                A&apos;zo bo&apos;lgan sana:{" "}
                {new Date(profile.createdAt).toLocaleDateString("uz-UZ", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <GiftPremiumDrawer
          open={giftDrawerOpen}
          onOpenChange={setGiftDrawerOpen}
          recipientUser={profile}
        />
      </div>
    </PageTransition>
  );
};

export default PublicProfileContainer;
