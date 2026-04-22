import React from "react";
import { get } from "lodash";
import {
  ChevronDownIcon,
  CheckIcon,
  Clock3Icon,
  Loader2Icon,
  MessageCircleIcon,
  MessageSquareIcon,
  PhoneIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/page-transition";
import { api } from "@/hooks/api/use-api";
import useGetQuery from "@/hooks/api/use-get-query";
import usePostQuery from "@/hooks/api/use-post-query";
import useDeleteQuery from "@/hooks/api/use-delete-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumbStore } from "@/store";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import {
  getFriendItems,
  getFriendRequests,
} from "@/modules/user/lib/friends-response";
import PersonRow from "./components/person-row.jsx";
import SectionCard from "./components/section-card.jsx";

const FRIENDS_QUERY_KEY = ["friends"];
const FRIEND_REQUESTS_QUERY_KEY = ["friend-requests"];

const resolveApiErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(", ");
  }
  return message || fallback;
};

const getRequestDescription = (request) => {
  if (request?.message) {
    return request.message;
  }

  if (request?.requester?.username) {
    return `@${request.requester.username}`;
  }

  return request?.requester?.email || request?.requester?.phone || "Do'stlik so'rovi";
};

const getFriendSubtitle = (friend) =>
  friend?.username
    ? `@${friend.username}`
    : friend?.email || friend?.phone || "Kontakt ma'lumoti yo'q";

const formatRequestDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("uz-UZ", {
    month: "short",
    day: "numeric",
  });
};



const SearchField = ({ value, onChange, placeholder }) => (
  <div className="relative mb-2">
    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="h-12 w-full rounded-2xl border-border/50 bg-muted/20 pl-10 text-sm shadow-none focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/30 transition-all font-medium"
    />
  </div>
);

const LoadingRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background p-3"
      >
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2 py-1">
          <Skeleton className="h-4 w-1/3 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
        <Skeleton className="h-9 w-20 shrink-0 rounded-xl" />
      </div>
    ))}
  </div>
);

const useInfiniteSlice = (items, batchSize) => {
  const [visibleCount, setVisibleCount] = React.useState(batchSize);

  React.useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, items]);

  const visibleItems = React.useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  const canLoadMore = visibleCount < items.length;
  const loadMore = React.useCallback(() => {
    setVisibleCount((current) => Math.min(items.length, current + batchSize));
  }, [batchSize, items.length]);

  const handleScroll = React.useCallback(
    (event) => {
      const element = event.currentTarget;
      if (
        canLoadMore &&
        element.scrollTop + element.clientHeight >= element.scrollHeight - 96
      ) {
        loadMore();
      }
    },
    [canLoadMore, loadMore],
  );

  return {
    visibleItems,
    canLoadMore,
    loadMore,
    handleScroll,
  };
};

const LoadMoreFooter = ({ canLoadMore, onLoadMore }) =>
  canLoadMore ? (
    <div className="flex justify-center py-2">
      <Button type="button" variant="outline" className="rounded-xl" onClick={onLoadMore}>
        <ChevronDownIcon className="mr-2 size-4" />
        Yana ko&apos;rsatish
      </Button>
    </div>
  ) : null;

const INVITE_METHOD_OPTIONS = [
  {
    value: "username",
    label: "Username orqali",
    description: "Foydalanuvchining @username nomi bilan taklif yuboriladi.",
    icon: MessageCircleIcon,
    placeholder: "@username",
  },
  {
    value: "phone",
    label: "Telefon orqali",
    description: "Do'stingizning telefon raqami bilan taklif yuboriladi.",
    icon: PhoneIcon,
    placeholder: "+998 90 123 45 67",
  },
];

const INITIAL_INVITE_FORM = {
  step: "method", // method, identifier, message
  method: "username",
  identifier: "",
  message: "",
};

const FRIENDS_TABS = new Set(["friends", "requests", "suggestions"]);
const FRIENDS_BATCH_SIZE = 12;
const REQUESTS_BATCH_SIZE = 10;

const resolveFriendsTab = (value) =>
  FRIENDS_TABS.has(value) ? value : "friends";

export default function FriendsContainer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState(() =>
    resolveFriendsTab(searchParams.get("tab")),
  );
  const [friendSearch, setFriendSearch] = React.useState("");
  const [inviteDrawerOpen, setInviteDrawerOpen] = React.useState(false);
  const [inviteForm, setInviteForm] = React.useState(INITIAL_INVITE_FORM);
  const [isFiltering, startFiltering] = React.useTransition();
  const deferredFriendSearch = React.useDeferredValue(friendSearch);
  const [respondingById, setRespondingById] = React.useState({});
  const [removingById, setRemovingById] = React.useState({});
  const [addingById, setAddingById] = React.useState({});
  const [isInviting, setIsInviting] = React.useState(false);

  // --- Data fetching via API hooks ---
  const { data: friendsData, isLoading: isFriendsLoading } = useGetQuery({
    url: "/users/me/friends",
    params: { q: deferredFriendSearch || undefined },
    queryProps: {
      queryKey: [...FRIENDS_QUERY_KEY, deferredFriendSearch],
    },
  });
  const friends = getFriendItems(friendsData);

  const { data: requestsData, isLoading: isRequestsLoading } = useGetQuery({
    url: "/users/me/friends/requests",
    queryProps: {
      queryKey: FRIEND_REQUESTS_QUERY_KEY,
    },
  });
  const {
    incoming: incomingRequests,
    outgoing: outgoingRequests,
  } = getFriendRequests(requestsData);

  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useGetQuery({
    url: "/users/me/friends/suggestions",
    queryProps: {
      queryKey: ["me", "friend-suggestions"],
    },
  });
  const suggestions = getFriendItems(suggestionsData);

  // --- Mutations ---
  const invalidateAll = React.useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const { mutateAsync: sendFriendRequestMutation } = usePostQuery({
    queryKey: FRIENDS_QUERY_KEY,
    listKey: FRIEND_REQUESTS_QUERY_KEY,
  });

  const { mutateAsync: respondToFriendRequestMutation } = usePostQuery({
    queryKey: FRIENDS_QUERY_KEY,
    listKey: FRIEND_REQUESTS_QUERY_KEY,
  });

  const { mutateAsync: removeFriendMutation } = useDeleteQuery({
    queryKey: FRIENDS_QUERY_KEY,
    listKey: FRIEND_REQUESTS_QUERY_KEY,
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/friends", title: "Do'stlar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const urlTab = resolveFriendsTab(tabFromUrl);
    setActiveTab((current) => (current === urlTab ? current : urlTab));
  }, [tabFromUrl]);

  const summary = React.useMemo(
    () => ({
      friends: friends.length,
      incoming: incomingRequests.length,
      outgoing: outgoingRequests.length,
    }),
    [friends.length, incomingRequests.length, outgoingRequests.length],
  );
  const friendsList = useInfiniteSlice(friends, FRIENDS_BATCH_SIZE);
  const resetInviteFlow = React.useCallback(() => {
    setInviteForm(INITIAL_INVITE_FORM);
    setInviteDrawerOpen(false);
  }, []);

  const updateInviteForm = React.useCallback((updates) => {
    setInviteForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const incomingList = useInfiniteSlice(incomingRequests, REQUESTS_BATCH_SIZE);

  const handleInviteFriend = React.useCallback(async () => {
    const identifier = inviteForm.identifier.trim();
    if (!identifier) {
      toast.error("Iltimos, ma'lumotni kiriting.");
      return;
    }

    setIsInviting(true);
    try {
      const response = await api.get("/users/me/friends/candidates", {
        params: { q: identifier },
      });
      const candidateItems = getFriendItems(response);
      if (!candidateItems || candidateItems.length === 0) {
        toast.error("Foydalanuvchi topilmadi.");
        return;
      }

      const targetUser =
        candidateItems.find(
          (c) =>
            c.username?.toLowerCase() ===
              identifier.toLowerCase().replace("@", "") ||
            c.phone?.replace(/\D/g, "").includes(identifier.replace(/\D/g, "")),
        ) || candidateItems[0];

      const result = await sendFriendRequestMutation({
        url: "/users/me/friends/requests",
        attributes: {
          targetUserId: targetUser.id,
          message: inviteForm.message.trim() || undefined,
        },
      });

      if (result?.data?.autoAccepted) {
        toast.success("Do'stlik so'rovi avtomatik qabul qilindi.");
        await invalidateGamificationQueries(queryClient);
      } else if (result?.data?.alreadyFriends) {
        toast.message("Bu foydalanuvchi allaqachon do'stingiz.");
      } else if (result?.data?.alreadyPending) {
        toast.message("Bu foydalanuvchiga allaqachon so'rov yuborilgansiz.");
      } else {
        toast.success("Do'stlik so'rovi yuborildi.");
      }
      await invalidateAll();
      resetInviteFlow();
    } catch (error) {
      toast.error(resolveApiErrorMessage(error, "So'rov yuborib bo'lmadi"));
    } finally {
      setIsInviting(false);
    }
  }, [inviteForm, invalidateAll, queryClient, resetInviteFlow, sendFriendRequestMutation]);

  const handleRemoveFriend = React.useCallback(
    async (friendId) => {
      if (removingById[friendId]) {
        return;
      }
      setRemovingById((prev) => ({ ...prev, [friendId]: true }));
      try {
        const response = await removeFriendMutation({
          url: `/users/me/friends/${friendId}`,
        });
        if (response?.data?.removed) {
          toast.success("Do'st ro'yxatdan chiqarildi.");
        } else {
          toast.message("Do'stlik holati allaqachon o'zgargan.");
        }
        await invalidateAll();
      } catch (error) {
        toast.error(resolveApiErrorMessage(error, "Do'stni o'chirib bo'lmadi"));
      } finally {
        setRemovingById((prev) => {
          const next = { ...prev };
          delete next[friendId];
          return next;
        });
      }
    },
    [removeFriendMutation, removingById, invalidateAll],
  );

  const handleAddFromSuggestion = React.useCallback(
    async (userId) => {
      if (addingById[userId]) return;
      setAddingById((prev) => ({ ...prev, [userId]: true }));
      try {
        await sendFriendRequestMutation({
          url: "/users/me/friends/requests",
          attributes: { recipientId: userId },
        });
        toast.success("Do'stlik so'rovi yuborildi.");
        queryClient.invalidateQueries({ queryKey: ["me", "friend-suggestions"] });
      } catch (error) {
        toast.error(resolveApiErrorMessage(error, "So'rov yuborib bo'lmadi"));
      } finally {
        setAddingById((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    },
    [addingById, sendFriendRequestMutation, queryClient],
  );

  const handleRespond = React.useCallback(
    async (requestId, action) => {
      if (respondingById[requestId]) {
        return;
      }
      setRespondingById((prev) => ({ ...prev, [requestId]: true }));
      try {
        await respondToFriendRequestMutation({
          url: `/users/me/friends/requests/${requestId}/respond`,
          attributes: { action },
        });
        if (action === "ACCEPT") {
          await invalidateGamificationQueries(queryClient);
        }
        toast.success(
          action === "ACCEPT"
            ? "Do'stlik so'rovi qabul qilindi."
            : "Do'stlik so'rovi rad etildi.",
        );
        await invalidateAll();
      } catch (error) {
        toast.error(resolveApiErrorMessage(error, "So'rovga javob berilmadi"));
      } finally {
        setRespondingById((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      }
    },
    [invalidateAll, queryClient, respondToFriendRequestMutation, respondingById],
  );

  const selectedMethod = React.useMemo(
    () =>
      INVITE_METHOD_OPTIONS.find((m) => m.value === inviteForm.method) ||
      INVITE_METHOD_OPTIONS[0],
    [inviteForm.method],
  );

  const onFriendSearchChange = React.useCallback(
    (event) => {
      const value = event.target.value;
      startFiltering(() => setFriendSearch(value));
    },
    [startFiltering],
  );

  const handleTabChange = React.useCallback(
    (value) => {
      const nextTab = resolveFriendsTab(value);
      setActiveTab(nextTab);

      const nextParams = new URLSearchParams(searchParams);
      if (nextTab === "friends") {
        nextParams.delete("tab");
      } else {
        nextParams.set("tab", nextTab);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleOpenFriendChat = React.useCallback(
    (friendId) => {
      navigate(`/user/chat?userId=${friendId}`);
    },
    [navigate],
  );

  const incomingEmpty = incomingRequests.length === 0;
  const friendsEmpty = friends.length === 0;

  return (
    <PageTransition className="space-y-6">
      <Card className="relative overflow-hidden rounded-3xl border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <CardContent className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary/80">
              <SparklesIcon className="size-3.5" />
              Community
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Do&apos;stlar tarmog&apos;ingiz
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Challenge, leaderboard va kundalik motivatsiya uchun do&apos;stlar
              qo&apos;shing. Faqat do&apos;stlaringizni challenge&apos;larga taklif
              qila olasiz.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="rounded-full border-primary/20 bg-primary/10 text-primary">
                {summary.friends} ta do&apos;st
              </Badge>
              <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {summary.incoming} ta kelgan so&apos;rov
              </Badge>
              <Badge className="rounded-full border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {summary.outgoing} ta yuborilgan so&apos;rov
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => setInviteDrawerOpen(true)}
            >
              <UserPlusIcon className="mr-2 size-4" />
              Do&apos;st taklif qilish
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => handleTabChange("requests")}
            >
              <Clock3Icon className="mr-2 size-4" />
              So&apos;rovlar
            </Button>
          </div>
        </CardContent>
      </Card>



      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex justify-start">
          <TabsList className="inline-flex h-auto items-center justify-start rounded-2xl bg-muted/60 p-1.5 shadow-sm">
            <TabsTrigger value="friends" className="rounded-xl px-5 py-2.5 font-medium transition-all data-[state=active]:shadow-sm">
              Do&apos;stlar
              <span className="ml-2.5 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground/80 ring-1 ring-border/50">
                {summary.friends}
              </span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative rounded-xl px-5 py-2.5 font-medium transition-all data-[state=active]:shadow-sm">
              So&apos;rovlar
              {summary.incoming > 0 && (
                <span className="absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                  {summary.incoming}
                </span>
              )}
              <span className={`ml-2.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${activeTab === 'requests' ? 'bg-background/80 text-foreground/80 ring-border/50' : 'bg-muted-foreground/10 text-muted-foreground ring-transparent'}`}>
                {summary.incoming}
              </span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="rounded-xl px-5 py-2.5 font-medium transition-all data-[state=active]:shadow-sm">
              Tavsiyalar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="friends" className="mt-0">
          <SectionCard
            title="Do'stlar ro'yxati"
            subtitle="Challenge va boshqa faoliyatlarga shu do'stlarni taklif qilasiz"
            right={<Badge variant="secondary">{friends.length} ta</Badge>}
          >
            <SearchField
              value={friendSearch}
              onChange={onFriendSearchChange}
              placeholder="Do'stlarni qidirish"
            />
            {isFiltering ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                Qidiruv yangilanmoqda...
              </p>
            ) : null}
            {isFriendsLoading && friendsEmpty ? (
              <LoadingRows />
            ) : friendsEmpty ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Hali do&apos;stlar yo&apos;q.
                </CardContent>
              </Card>
            ) : (
              <div
                className="max-h-[430px] space-y-2 overflow-y-auto pr-2"
                onScroll={friendsList.handleScroll}
              >
                {friendsList.visibleItems.map((friend) => {
                  const isRemoving = Boolean(removingById[friend.id]);
                  return (
                    <PersonRow
                      key={friend.id}
                      person={friend}
                      description={getFriendSubtitle(friend)}
                      right={
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="relative z-10 h-9 rounded-xl px-3 sm:px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => handleOpenFriendChat(friend.id)}
                          >
                            <MessageSquareIcon className="mr-1.5 size-4" />
                            Chat
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="relative z-10 h-9 rounded-xl px-2 sm:px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                disabled={isRemoving}
                                title="Do'stlar ro'yxatidan o'chirish"
                              >
                                {isRemoving ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                  <Trash2Icon className="size-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl sm:max-w-[400px]">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rostdan ham do&apos;stlar ro&apos;yxatidan o&apos;chirmoqchimisiz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {friend.name || "Bu foydalanuvchi"} endi sizning do&apos;stlaringiz ro&apos;yxatida bo&apos;lmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-semibold">Bekor qilish</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-xl font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleRemoveFriend(friend.id)}
                                >
                                  O&apos;chirish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      }
                    />
                  );
                })}
                <LoadMoreFooter
                  canLoadMore={friendsList.canLoadMore}
                  onLoadMore={friendsList.loadMore}
                />
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <SectionCard
            title="Kelgan so'rovlar"
            subtitle="Qabul qiling yoki rad eting"
            right={<Badge variant="secondary">{incomingRequests.length} ta</Badge>}
          >
            {isRequestsLoading && incomingEmpty ? (
              <LoadingRows />
            ) : incomingEmpty ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Yangi so&apos;rovlar yo&apos;q.
                </CardContent>
              </Card>
            ) : (
              <div
                className="max-h-[390px] space-y-2 overflow-y-auto pr-2"
                onScroll={incomingList.handleScroll}
              >
                {incomingList.visibleItems.map((request) => {
                  const isResponding = Boolean(respondingById[request.id]);
                  return (
                    <PersonRow
                      key={request.id}
                      person={request.requester}
                      description={
                        getRequestDescription(request) +
                        (request?.createdAt
                          ? ` • ${formatRequestDate(request.createdAt)}`
                          : "")
                      }
                      right={
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="relative z-10 h-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRespond(request.id, "DECLINE")}
                            disabled={isResponding}
                            title="Rad etish"
                          >
                            {isResponding ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <XIcon className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="relative z-10 h-9 rounded-xl px-4 font-semibold shadow-sm hover:shadow-md transition-shadow"
                            onClick={() => handleRespond(request.id, "ACCEPT")}
                            disabled={isResponding}
                          >
                            {isResponding ? (
                              <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                            ) : (
                              <CheckIcon className="mr-1.5 size-4" />
                            )}
                            Qabul qilish
                          </Button>
                        </div>
                      }
                    />
                  );
                })}
                <LoadMoreFooter
                  canLoadMore={incomingList.canLoadMore}
                  onLoadMore={incomingList.loadMore}
                />
              </div>
            )}
          </SectionCard>
        </TabsContent>
        <TabsContent value="suggestions" className="mt-0">
          <SectionCard
            title="Tavsiya qilingan do'stlar"
            subtitle="Umumiy do'stlar yoki boshqa asoslar bo'yicha tavsiyalar"
          >
            {isSuggestionsLoading ? (
              <LoadingRows />
            ) : suggestions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Hozircha tavsiyalar yo&apos;q.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {suggestions.map((user) => {
                  const isAdding = Boolean(addingById[user.id]);
                  const subtitle =
                    user.mutualFriendCount > 0
                      ? `${user.mutualFriendCount} ta umumiy do'st`
                      : user.username
                        ? `@${user.username}`
                        : "Yangi foydalanuvchi";
                  return (
                    <PersonRow
                      key={user.id}
                      person={user}
                      description={subtitle}
                      right={
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 rounded-xl px-4 font-semibold"
                          disabled={isAdding}
                          onClick={() => handleAddFromSuggestion(user.id)}
                        >
                          {isAdding ? (
                            <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                          ) : (
                            <UserPlusIcon className="mr-1.5 size-4" />
                          )}
                          Do&apos;st bo&apos;lish
                        </Button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Drawer
        open={inviteDrawerOpen}
        onOpenChange={(open) => !open && resetInviteFlow()}
        direction="bottom"
      >
        <DrawerContent className="outline-none">
          {inviteForm.step === "method" && (
            <>
              <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
                <DrawerTitle className="text-center text-xl font-bold text-foreground">
                  Do&apos;st taklif qilish
                </DrawerTitle>
                <DrawerDescription className="text-center">
                  Avval qanday yo&apos;l bilan do&apos;st taklif qilishni tanlang.
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-3 px-4 py-4">
                {INVITE_METHOD_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = inviteForm.method === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                        active ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                      )}
                      onClick={() => updateInviteForm({ method: option.value })}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <DrawerFooter className="border-t border-border/40 p-4">
                <Button
                  className="h-11 rounded-xl px-8 font-semibold"
                  onClick={() => updateInviteForm({ step: "identifier" })}
                >
                  Davom etish
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl px-6 font-semibold"
                  onClick={resetInviteFlow}
                >
                  Bekor qilish
                </Button>
              </DrawerFooter>
            </>
          )}

          {inviteForm.step === "identifier" && (
            <>
              <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
                <DrawerTitle className="text-center text-xl font-bold text-foreground">
                  Ma&apos;lumotni kiriting
                </DrawerTitle>
                <DrawerDescription className="text-center">
                  {selectedMethod.label} uchun kerakli qiymatni kiriting.
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-4 py-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="friend-invite-identifier" className="ml-1 text-xs font-bold uppercase text-muted-foreground">
                    Qiymat
                  </Label>
                  {inviteForm.method === "phone" ? (
                    <PhoneInput
                      id="friend-invite-identifier"
                      value={inviteForm.identifier}
                      onChange={(value) => updateInviteForm({ identifier: value ?? "" })}
                      defaultCountry="UZ"
                      placeholder={selectedMethod.placeholder}
                    />
                  ) : (
                    <Input
                      id="friend-invite-identifier"
                      className="h-11 rounded-xl"
                      value={inviteForm.identifier}
                      onChange={(e) => updateInviteForm({ identifier: e.target.value })}
                      placeholder={selectedMethod.placeholder}
                    />
                  )}
                </div>
              </div>
              <DrawerFooter className="border-t border-border/40 p-4">
                <Button
                  className="h-11 rounded-xl px-8 font-semibold"
                  onClick={() => {
                    if (!inviteForm.identifier.trim()) {
                      toast.error("Iltimos, qiymatni kiriting.");
                      return;
                    }
                    updateInviteForm({ step: "message" });
                  }}
                >
                  Davom etish
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl px-6 font-semibold"
                  onClick={() => updateInviteForm({ step: "method" })}
                >
                  Orqaga
                </Button>
              </DrawerFooter>
            </>
          )}

          {inviteForm.step === "message" && (
            <>
              <DrawerHeader className="border-b border-border/40 pb-4 pt-5">
                <DrawerTitle className="text-center text-xl font-bold text-foreground">
                  Xabar qoldiring
                </DrawerTitle>
                <DrawerDescription className="text-center">
                  Ixtiyoriy xabar qoldiring va taklifni yuboring.
                </DrawerDescription>
              </DrawerHeader>
              <div className="space-y-4 px-4 py-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="friend-invite-message" className="ml-1 text-xs font-bold uppercase text-muted-foreground">
                    Xabar (ixtiyoriy)
                  </Label>
                  <Textarea
                    id="friend-invite-message"
                    className="min-h-[100px] rounded-xl"
                    value={inviteForm.message}
                    onChange={(e) => updateInviteForm({ message: e.target.value })}
                    placeholder="Masalan: Salom, do'stlar ro'yxatiga qo'shilaylik!"
                  />
                </div>
              </div>
              <DrawerFooter className="border-t border-border/40 p-4">
                <Button
                  className="h-11 rounded-xl px-8 font-semibold shadow-lg shadow-primary/20"
                  onClick={handleInviteFriend}
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  ) : (
                    <SendIcon className="mr-2 size-4" />
                  )}
                  Taklif yuborish
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl px-6 font-semibold"
                  onClick={() => updateInviteForm({ step: "identifier" })}
                >
                  Orqaga
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
}
