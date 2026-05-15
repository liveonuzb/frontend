import React from "react";
import {
  ArrowRightIcon,
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
import useGetQuery from "@/hooks/api/use-get-query";
import usePostQuery from "@/hooks/api/use-post-query";
import useDeleteQuery from "@/hooks/api/use-delete-query";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";
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

const FRIENDS_QUERY_KEY = ["friends"];
const FRIEND_REQUESTS_QUERY_KEY = ["friend-requests"];
const FRIEND_SUGGESTIONS_QUERY_KEY = ["me", "friend-suggestions"];
const USER_SEARCH_QUERY_KEY = ["users", "search"];

const resolveApiErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;
  const details = responseData?.error?.details;
  const detailMessages = Array.isArray(details)
    ? details.map((detail) => detail?.message).filter(Boolean)
    : [];

  if (detailMessages.length > 0) {
    return detailMessages.join(", ");
  }

  const message = responseData?.error?.message ?? responseData?.message;
  if (Array.isArray(message)) {
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
  <div className={cn("relative mb-2", className)}>
    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70 dark:text-slate-400" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="h-12 w-full rounded-[1.4rem] border-border/60 bg-muted/20 pl-11 text-sm font-medium shadow-none transition-all placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus-visible:bg-white/[0.055] dark:focus-visible:ring-emerald-400/30"
    />
  </div>
);

const STAT_TONES = {
  green:
    "border-emerald-400/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-300/18 dark:bg-emerald-400/10 dark:text-emerald-300",
  cyan:
    "border-cyan-400/20 bg-cyan-500/10 text-cyan-600 dark:border-cyan-300/18 dark:bg-cyan-400/10 dark:text-cyan-300",
  amber:
    "border-amber-400/25 bg-amber-500/10 text-amber-600 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300",
};

const StatTile = ({ icon: Icon, value, label, tone }) => (
  <div
    className={cn(
      "flex min-h-[92px] flex-col justify-center gap-2 rounded-[1.35rem] border px-3 py-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:gap-3 sm:px-4 dark:shadow-none",
      STAT_TONES[tone],
    )}
  >
    <Icon className="size-6 shrink-0 sm:size-7" strokeWidth={2.2} />
    <div className="min-w-0">
      <p className="text-2xl font-black leading-none tracking-tight sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-[9px] font-semibold uppercase leading-tight tracking-wide text-foreground/65 sm:text-[11px] dark:text-slate-300/80">
        {label}
      </p>
    </div>
  </div>
);

const HeroVisual = ({ src }) => (
  <div className="pointer-events-none absolute -right-24 top-16 z-0 h-44 w-72 opacity-55 sm:-right-20 sm:top-10 sm:h-56 sm:w-[24rem] md:-right-10 md:h-64 md:w-[27rem] md:opacity-80 lg:right-1 lg:h-72 lg:w-[31rem] dark:opacity-90">
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className="h-full w-full object-contain object-right drop-shadow-[0_28px_60px_rgba(245,158,11,0.22)]"
      loading="eager"
    />
  </div>
);

const EmptyPanel = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-border/70 bg-muted/20 px-5 py-10 text-center dark:border-white/10 dark:bg-white/[0.025]">
    <div className="mb-5 flex size-24 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border/60 dark:bg-slate-900/80 dark:text-slate-300 dark:ring-white/10">
      <Icon className="size-10" strokeWidth={1.8} />
    </div>
    <h3 className="text-lg font-semibold text-foreground dark:text-slate-50">
      {title}
    </h3>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
      {description}
    </p>
    {actionLabel && onAction ? (
      <Button
        type="button"
        variant="outline"
        className="mt-5 rounded-[1.1rem] border-emerald-500/30 px-5 font-semibold text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/5 dark:text-emerald-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
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
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="flex w-full items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/90 p-3 dark:border-white/10 dark:bg-white/[0.035]"
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
      <Button
        type="button"
        variant="outline"
        className="rounded-xl dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.065]"
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
  const appModeTheme = useAppModeTheme();
  const friendsHeroSrc =
    appModeTheme?.assets?.friendsHero ?? "/madagascar/friends/hero.png";

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
    () => deferredSuggestionSearch.trim(),
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
  const {
    incoming: incomingRequests,
    outgoing: outgoingRequests,
  } = getFriendRequests(requestsData);

  const { data: suggestionsData, isLoading: isSuggestionsLoading } = useGetQuery({
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
    [invalidateAll, queryClient, respondToFriendRequestMutation, respondingById],
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
    <PageTransition className="relative isolate space-y-6 pb-28 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-x-[-1rem] top-[-1.5rem] -z-10 h-[calc(100%+8rem)] opacity-0 dark:bg-[linear-gradient(180deg,#020812_0%,#061018_42%,#02070d_100%)] dark:opacity-100" />

      <Card className="relative overflow-hidden rounded-[2rem] border-primary/20 bg-[linear-gradient(135deg,rgba(34,197,94,0.10)_0%,rgba(255,255,255,0.96)_48%,rgba(245,158,11,0.10)_100%)] shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(2,8,23,0.96)_0%,rgba(6,24,26,0.92)_44%,rgba(91,45,12,0.74)_100%)] dark:shadow-2xl dark:shadow-emerald-950/20">
        <HeroVisual src={friendsHeroSrc} />
        <CardContent className="relative z-10 flex flex-col gap-6 p-5 sm:p-6 md:pr-[18rem] lg:min-h-[430px] lg:pr-[25rem]">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
              <UsersIcon className="size-4" />
              Community
            </p>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl dark:text-white">
              Do&apos;stlar tarmog&apos;ingiz
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground dark:text-slate-300">
              Challenge, leaderboard va kundalik motivatsiya uchun do&apos;stlar
              qo&apos;shing. Faqat do&apos;stlaringizni challenge&apos;larga taklif
              qila olasiz.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile
              icon={UsersIcon}
              value={summary.friends}
              label="ta do'st"
              tone="green"
            />
            <StatTile
              icon={ClipboardListIcon}
              value={summary.incoming}
              label="ta kelgan so'rov"
              tone="cyan"
            />
            <StatTile
              icon={SendIcon}
              value={summary.outgoing}
              label="ta yuborilgan so'rov"
              tone="amber"
            />
          </div>

          <div className="mt-auto border-t border-border/60 pt-5 dark:border-white/10">
            <Button
              type="button"
              className="h-14 w-full justify-between rounded-[1.25rem] bg-[linear-gradient(135deg,#f59e0b_0%,#ff7a00_48%,#ff5a1f_100%)] px-5 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.01] hover:shadow-orange-500/35"
              onClick={() => handleTabChange("suggestions")}
            >
              <span className="inline-flex items-center gap-3">
                <UserPlusIcon className="size-5" />
                Do&apos;st taklif qilish
              </span>
              <span className="flex size-10 items-center justify-center rounded-full bg-white/20">
                <ArrowRightIcon className="size-5" />
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/70 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-2xl dark:shadow-black/20">
          <TabsList className="grid h-14 w-full grid-cols-2 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger
              value="friends"
              className="group relative h-full min-w-0 rounded-[1.45rem] px-2 text-sm font-semibold transition-all data-[state=active]:bg-background/95 data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm sm:text-base dark:data-[state=active]:bg-slate-950/80 dark:data-[state=active]:text-emerald-300"
            >
              <UserPlusIcon className="mr-2 size-5" />
              <span>Do&apos;stlar</span>
              <span className="ml-2.5 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground/80 ring-1 ring-border/50 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/15">
                {summary.friends}
              </span>
              <span className="pointer-events-none absolute inset-x-8 bottom-1 h-0.5 rounded-full bg-[linear-gradient(90deg,#d9f99d,#22c55e)] opacity-0 transition-opacity group-data-[state=active]:opacity-100 group-data-active:opacity-100" />
            </TabsTrigger>
            <TabsTrigger
              value="suggestions"
              className="group relative h-full min-w-0 rounded-[1.45rem] px-2 text-sm font-semibold transition-all data-[state=active]:bg-background/95 data-[state=active]:text-cyan-600 data-[state=active]:shadow-sm sm:text-base dark:data-[state=active]:bg-slate-950/80 dark:data-[state=active]:text-cyan-300"
            >
              <UsersIcon className="mr-2 size-5" />
              <span>Tavsiyalar</span>
              <span className="ml-2.5 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground/80 ring-1 ring-border/50 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-300/15">
                {suggestionRows.length}
              </span>
              <span className="pointer-events-none absolute inset-x-8 bottom-1 h-0.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)] opacity-0 transition-opacity group-data-[state=active]:opacity-100 group-data-active:opacity-100" />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="friends" className="mt-0">
          <SectionCard
            title="Do'stlar ro'yxati"
            subtitle="Challenge va boshqa faoliyatlarga shu do'stlarni taklif qilasiz"
            className="dark:bg-slate-950/50"
            right={
              <Badge className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-300">
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
            {!incomingEmpty ? (
              <div className="space-y-2 rounded-[1.35rem] border border-emerald-500/20 bg-emerald-500/5 p-3 dark:border-emerald-300/15 dark:bg-emerald-400/[0.045]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Kelgan so&apos;rovlar</h3>
                  <Badge
                    variant="outline"
                    className="rounded-full dark:border-emerald-300/20 dark:text-emerald-300"
                  >
                    {summary.incoming} ta
                  </Badge>
                </div>
                <div
                  className="max-h-[300px] space-y-2 overflow-y-auto pr-2"
                  onScroll={incomingList.handleScroll}
                >
                  {incomingList.visibleItems.map((request) => {
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
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="relative z-10 h-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive dark:hover:bg-red-500/10 dark:hover:text-red-300"
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
                              className="relative z-10 h-9 rounded-xl bg-emerald-600 px-4 font-semibold text-white shadow-sm transition-shadow hover:bg-emerald-500 hover:shadow-md dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
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
              </div>
            ) : null}
            {isFriendsLoading && friendsEmpty ? (
              <LoadingRows />
            ) : friendsEmpty ? (
              <EmptyPanel
                icon={UsersIcon}
                title="Hali do'stlar yo'q."
                description="Do'st taklif qiling va birga maqsadlaringizga erishing."
                actionLabel="Do'st taklif qilish"
                onAction={() => handleTabChange("suggestions")}
              />
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
                            className="relative z-10 h-9 rounded-xl px-3 font-semibold transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 sm:px-4 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/15 dark:hover:text-emerald-200"
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
                                className="relative z-10 h-9 rounded-xl px-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:px-3 dark:hover:bg-red-500/10 dark:hover:text-red-300"
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

        <TabsContent value="suggestions" className="mt-0">
          <SectionCard
            title="Tavsiya qilingan do'stlar"
            subtitle="Foydalanuvchini qidiring, so'rov yuboring yoki yuborilgan so'rovni qaytaring"
            className="dark:bg-slate-950/50"
            right={
              <Badge className="rounded-full border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-700 dark:border-cyan-300/15 dark:bg-cyan-400/10 dark:text-cyan-300">
                {suggestionRows.length} ta
              </Badge>
            }
          >
            <SearchField
              value={suggestionSearch}
              onChange={onSuggestionSearchChange}
              placeholder="Username yoki ism bo'yicha qidirish"
            />
            {suggestionSearch.trim().length === 1 ? (
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
                className="max-h-[430px] space-y-2 overflow-y-auto pr-2"
                onScroll={suggestionList.handleScroll}
              >
                {suggestionList.visibleItems.map((user) => {
                  const isAdding = Boolean(addingById[user.id]);
                  const isRequestSent = user.friendshipStatus === "request_sent";
                  const isCancelling = Boolean(cancellingById[user.requestId]);
                  const subtitle =
                    isRequestSent
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
                            className="h-9 rounded-xl px-3 font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-red-500/10 dark:hover:text-red-300"
                            disabled={!user.requestId || isCancelling}
                            onClick={() => handleCancelOutgoingRequest(user.requestId)}
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
                            className="h-9 rounded-xl bg-slate-800 px-4 font-semibold text-white hover:bg-slate-700 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
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
