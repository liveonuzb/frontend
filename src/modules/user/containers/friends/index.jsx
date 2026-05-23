import React from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  ClipboardListIcon,
  Loader2Icon,
  MessageSquareIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  UsersIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/page-transition";
import { useGetQuery } from "@/hooks/api";
import { usePostQuery } from "@/hooks/api";
import { useDeleteQuery } from "@/hooks/api";
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
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import { buildFriendRequestPayload } from "@/modules/user/lib/friend-request-payload";
import { buildFriendSuggestionRows } from "@/modules/user/lib/friend-suggestions";
import {
  getFriendItems,
  getFriendRequests,
} from "@/modules/user/lib/friends-response";
import { cn } from "@/lib/utils";
import PersonRow from "./components/person-row.jsx";
import SectionCard from "./components/section-card.jsx";

import { filter, isArray, map, trim, take } from "lodash";

const FRIENDS_QUERY_KEY = ["friends"];
const FRIEND_REQUESTS_QUERY_KEY = ["friend-requests"];
const FRIEND_SUGGESTIONS_QUERY_KEY = ["me", "friend-suggestions"];
const USER_SEARCH_QUERY_KEY = ["users", "search"];

const resolveApiErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;
  const details = responseData?.error?.details;
  const detailMessages = isArray(details)
    ? filter(
        map(details, (detail) => detail?.message),
        Boolean,
      )
    : [];

  if (detailMessages.length > 0) {
    return detailMessages.join(", ");
  }

  const message = responseData?.error?.message ?? responseData?.message;
  if (isArray(message)) {
    return message.join(", ");
  }
  return message || fallback;
};

const getRequestDescription = (request, userKey = "requester") => {
  if (request?.message) {
    return request.message;
  }

  const user = request?.[userKey];
  if (user?.username) {
    return `@${user.username}`;
  }

  return "Do'stlik so'rovi";
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

const SearchField = ({ value, onChange, placeholder, className }) => (
  <div className={cn("relative", className)}>
    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="h-11 w-full rounded-2xl bg-background/70 pl-10 text-sm font-medium shadow-none placeholder:text-muted-foreground focus-visible:ring-primary/30"
    />
  </div>
);

const StatTile = ({ icon: Icon, value, label, description }) => (
  <Card className="relative overflow-hidden py-4 transition-all hover:ring-primary/20 hover:shadow-sm">
    <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/10 blur-[24px]" />
    <CardContent className="relative z-10 flex items-center gap-3 px-4 py-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none tracking-tight">
          {value}
        </p>
        <p className="mt-1 truncate text-xs font-bold text-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
          {description}
        </p>
      </div>
    </CardContent>
  </Card>
);

const PageHeader = ({ onAddFriend }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0 space-y-1.5">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
        Do&apos;stlar
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        Do&apos;stlar ro&apos;yxatini boshqaring, kelgan so&apos;rovlarga javob
        bering va yangi foydalanuvchilarni toping.
      </p>
    </div>
    <Button
      type="button"
      size="lg"
      className="w-full rounded-2xl font-bold sm:w-auto"
      onClick={onAddFriend}
    >
      <UserPlusIcon className="size-4" data-icon="inline-start" />
      Do&apos;st qo&apos;shish
    </Button>
  </div>
);

const EmptyPanel = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-5 py-9 text-center">
    <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Icon className="size-7" strokeWidth={1.9} />
    </div>
    <h3 className="text-base font-bold text-foreground">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    {actionLabel && onAction ? (
      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-2xl px-5 font-semibold"
        onClick={onAction}
      >
        <UserPlusIcon className="mr-2 size-4" />
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

const LoadingRows = () => (
  <div className="space-y-2">
    {map(Array.from({ length: 4 }), (_, index) => (
      <div
        key={index}
        className="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-3"
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

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, items]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visibleItems = React.useMemo(
    () => take(items, visibleCount),
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
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        onClick={onLoadMore}
      >
        <ChevronDownIcon className="mr-2 size-4" />
        Yana ko&apos;rsatish
      </Button>
    </div>
  ) : null;

const FRIENDS_TABS = new Set(["friends", "suggestions"]);
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
  const [suggestionSearch, setSuggestionSearch] = React.useState("");
  const [isFiltering, startFiltering] = React.useTransition();
  const deferredFriendSearch = React.useDeferredValue(friendSearch);
  const deferredSuggestionSearch = React.useDeferredValue(suggestionSearch);
  const [respondingById, setRespondingById] = React.useState({});
  const [removingById, setRemovingById] = React.useState({});
  const [addingById, setAddingById] = React.useState({});
  const [cancellingById, setCancellingById] = React.useState({});
  const normalizedSuggestionSearch = React.useMemo(
    () => trim(deferredSuggestionSearch),
    [deferredSuggestionSearch],
  );
  const isSuggestionSearchActive = normalizedSuggestionSearch.length >= 2;

  // --- Data fetching via API hooks ---
  const { data: friendsData, isLoading: isFriendsLoading } = useGetQuery({
    url: "/users/me/friends",
    params: { q: deferredFriendSearch || undefined },
    queryProps: {
      queryKey: [...FRIENDS_QUERY_KEY, deferredFriendSearch],
    },
  });
  const friends = getFriendItems(friendsData);

  const { data: requestsData } = useGetQuery({
    url: "/users/me/friends/requests",
    queryProps: {
      queryKey: FRIEND_REQUESTS_QUERY_KEY,
    },
  });
  const { incoming: incomingRequests, outgoing: outgoingRequests } =
    getFriendRequests(requestsData);

  const { data: suggestionsData, isLoading: isSuggestionsLoading } =
    useGetQuery({
      url: "/users/me/friends/suggestions",
      queryProps: {
        queryKey: FRIEND_SUGGESTIONS_QUERY_KEY,
      },
    });
  const suggestions = getFriendItems(suggestionsData);

  const { data: userSearchData, isLoading: isUserSearchLoading } = useGetQuery({
    url: "/users/search",
    params: {
      query: normalizedSuggestionSearch,
      limit: 20,
    },
    queryProps: {
      queryKey: [...USER_SEARCH_QUERY_KEY, normalizedSuggestionSearch],
      enabled: isSuggestionSearchActive,
    },
  });
  const searchedUsers = getFriendItems(userSearchData);

  // --- Mutations ---
  const invalidateAll = React.useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: FRIEND_REQUESTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: FRIEND_SUGGESTIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: USER_SEARCH_QUERY_KEY }),
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

  const { mutateAsync: cancelFriendRequestMutation } = useDeleteQuery({
    queryKey: FRIENDS_QUERY_KEY,
    listKey: FRIEND_REQUESTS_QUERY_KEY,
  });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/friends", title: "Do'stlar" },
    ]);
  }, [setBreadcrumbs]);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const urlTab = resolveFriendsTab(tabFromUrl);
    setActiveTab((current) => (current === urlTab ? current : urlTab));
  }, [tabFromUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const summary = React.useMemo(
    () => ({
      friends: friends.length,
      incoming: incomingRequests.length,
      outgoing: outgoingRequests.length,
    }),
    [friends.length, incomingRequests.length, outgoingRequests.length],
  );
  const friendsList = useInfiniteSlice(friends, FRIENDS_BATCH_SIZE);

  const incomingList = useInfiniteSlice(incomingRequests, REQUESTS_BATCH_SIZE);
  const suggestionRows = React.useMemo(
    () =>
      buildFriendSuggestionRows({
        suggestions,
        sourceUsers: isSuggestionSearchActive ? searchedUsers : undefined,
        outgoingRequests,
        friends,
        incomingRequests,
        includeOutgoingRows: !isSuggestionSearchActive,
      }),
    [
      friends,
      incomingRequests,
      isSuggestionSearchActive,
      outgoingRequests,
      searchedUsers,
      suggestions,
    ],
  );
  const suggestionList = useInfiniteSlice(suggestionRows, FRIENDS_BATCH_SIZE);

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
          attributes: buildFriendRequestPayload({ targetUserId: userId }),
        });
        toast.success("Do'stlik so'rovi yuborildi.");
        await invalidateAll();
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
    [addingById, invalidateAll, sendFriendRequestMutation],
  );

  const handleCancelOutgoingRequest = React.useCallback(
    async (requestId) => {
      if (cancellingById[requestId]) {
        return;
      }
      setCancellingById((prev) => ({ ...prev, [requestId]: true }));
      try {
        await cancelFriendRequestMutation({
          url: `/users/me/friends/requests/${requestId}`,
        });
        toast.success("Yuborilgan so'rov bekor qilindi.");
        await invalidateAll();
      } catch (error) {
        toast.error(resolveApiErrorMessage(error, "So'rov bekor qilinmadi"));
      } finally {
        setCancellingById((prev) => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
      }
    },
    [cancelFriendRequestMutation, cancellingById, invalidateAll],
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
    [
      invalidateAll,
      queryClient,
      respondToFriendRequestMutation,
      respondingById,
    ],
  );

  const onFriendSearchChange = React.useCallback(
    (event) => {
      const value = event.target.value;
      startFiltering(() => setFriendSearch(value));
    },
    [startFiltering],
  );

  const onSuggestionSearchChange = React.useCallback((event) => {
    setSuggestionSearch(event.target.value);
  }, []);

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
    <PageTransition className="space-y-5 pb-28">
      <PageHeader onAddFriend={() => handleTabChange("suggestions")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={UsersIcon}
          value={summary.friends}
          label="Jami do'stlar"
          description="Faol kontaktlar"
        />
        <StatTile
          icon={ClipboardListIcon}
          value={summary.incoming}
          label="Kelgan so'rovlar"
          description="Javob kutilmoqda"
        />
        <StatTile
          icon={SendIcon}
          value={summary.outgoing}
          label="Yuborilgan so'rovlar"
          description="Tasdiq kutilmoqda"
        />
      </div>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-1">
          <TabsList className="grid h-11 w-full grid-cols-2 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger
              value="friends"
              className="h-full min-w-0 rounded-xl px-2 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <UsersIcon className="mr-2 size-4" />
              <span>Do&apos;stlar</span>
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {summary.friends}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="suggestions"
              className="h-full min-w-0 rounded-xl px-2 text-sm font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              <UserPlusIcon className="mr-2 size-4" />
              <span>Tavsiyalar</span>
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                {suggestionRows.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="friends" className="mt-0">
          <div
            className={cn(
              "grid gap-4",
              !incomingEmpty &&
                "lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]",
            )}
          >
            <SectionCard
              title="Do'stlar ro'yxati"
              subtitle="Profilni ochish, chat boshlash yoki ro'yxatdan olib tashlash."
              right={
                <Badge variant="outline" className="rounded-full">
                  {friends.length} ta
                </Badge>
              }
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
                <EmptyPanel
                  icon={UsersIcon}
                  title="Hali do'stlar yo'q."
                  description="Do'st qo'shing va kundalik natijalarni birga kuzating."
                  actionLabel="Do'st qo'shish"
                  onAction={() => handleTabChange("suggestions")}
                />
              ) : (
                <div
                  className="max-h-[520px] space-y-2 overflow-y-auto pr-1"
                  onScroll={friendsList.handleScroll}
                >
                  {map(friendsList.visibleItems, (friend) => {
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
                              variant="outline"
                              className="relative z-10 rounded-xl font-semibold"
                              onClick={() => handleOpenFriendChat(friend.id)}
                            >
                              <MessageSquareIcon className="size-4" />
                              <span className="hidden sm:inline">Chat</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon-sm"
                                  className="relative z-10 rounded-xl"
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
                                  <AlertDialogTitle>
                                    Do&apos;stni ro&apos;yxatdan o&apos;chirish
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {friend.name || "Bu foydalanuvchi"} endi
                                    sizning do&apos;stlaringiz ro&apos;yxatida
                                    ko&apos;rinmaydi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl font-semibold">
                                    Bekor qilish
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-xl bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() =>
                                      handleRemoveFriend(friend.id)
                                    }
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

            {!incomingEmpty ? (
              <SectionCard
                title="Kelgan so'rovlar"
                subtitle="Do'stlik so'rovlariga shu yerdan javob bering."
                right={
                  <Badge variant="outline" className="rounded-full">
                    {summary.incoming} ta
                  </Badge>
                }
              >
                <div
                  className="max-h-[520px] space-y-2 overflow-y-auto pr-1"
                  onScroll={incomingList.handleScroll}
                >
                  {map(incomingList.visibleItems, (request) => {
                    const isResponding = Boolean(respondingById[request.id]);
                    return (
                      <PersonRow
                        key={request.id}
                        person={request.requester}
                        description={
                          getRequestDescription(request, "requester") +
                          (request?.createdAt
                            ? ` • ${formatRequestDate(request.createdAt)}`
                            : "")
                        }
                        right={
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="destructive"
                              className="relative z-10 rounded-xl"
                              onClick={() =>
                                handleRespond(request.id, "DECLINE")
                              }
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
                              className="relative z-10 rounded-xl font-semibold"
                              onClick={() =>
                                handleRespond(request.id, "ACCEPT")
                              }
                              disabled={isResponding}
                            >
                              {isResponding ? (
                                <Loader2Icon className="size-4 animate-spin" />
                              ) : (
                                <CheckIcon className="size-4" />
                              )}
                              <span className="hidden sm:inline">Qabul</span>
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
              </SectionCard>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-0">
          <SectionCard
            title="Tavsiya qilingan do'stlar"
            subtitle="Foydalanuvchini qidiring, so'rov yuboring yoki yuborilgan so'rovni qaytaring"
            right={
              <Badge variant="outline" className="rounded-full">
                {suggestionRows.length} ta
              </Badge>
            }
          >
            <SearchField
              value={suggestionSearch}
              onChange={onSuggestionSearchChange}
              placeholder="Username yoki ism bo'yicha qidirish"
            />
            {trim(suggestionSearch).length === 1 ? (
              <p className="text-xs text-muted-foreground">
                Qidirish uchun kamida 2 ta belgi kiriting.
              </p>
            ) : null}
            {(isSuggestionSearchActive && isUserSearchLoading) ||
            (!isSuggestionSearchActive && isSuggestionsLoading) ? (
              <LoadingRows />
            ) : suggestionRows.length === 0 ? (
              <EmptyPanel
                icon={SearchIcon}
                title={
                  isSuggestionSearchActive
                    ? "Mos foydalanuvchi topilmadi."
                    : "Hozircha tavsiyalar yo'q."
                }
                description={
                  isSuggestionSearchActive
                    ? "Boshqa username yoki ism bilan qidirib ko'ring."
                    : "Yangi tavsiyalar paydo bo'lganda shu yerda ko'rinadi."
                }
              />
            ) : (
              <div
                className="max-h-[520px] space-y-2 overflow-y-auto pr-1"
                onScroll={suggestionList.handleScroll}
              >
                {map(suggestionList.visibleItems, (user) => {
                  const isAdding = Boolean(addingById[user.id]);
                  const isRequestSent =
                    user.friendshipStatus === "request_sent";
                  const isCancelling = Boolean(cancellingById[user.requestId]);
                  const subtitle = isRequestSent
                    ? "So'rov yuborilgan"
                    : user.mutualFriendCount > 0
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
                        isRequestSent ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            disabled={!user.requestId || isCancelling}
                            onClick={() =>
                              handleCancelOutgoingRequest(user.requestId)
                            }
                          >
                            {isCancelling ? (
                              <Loader2Icon className="mr-1.5 size-4 animate-spin" />
                            ) : (
                              <XIcon className="mr-1.5 size-4" />
                            )}
                            Bekor qilish
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl font-semibold"
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
                        )
                      }
                    />
                  );
                })}
                <LoadMoreFooter
                  canLoadMore={suggestionList.canLoadMore}
                  onLoadMore={suggestionList.loadMore}
                />
              </div>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
