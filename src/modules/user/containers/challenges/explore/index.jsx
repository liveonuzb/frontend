import React from "react";
import { get, includes, trim } from "lodash";
import { useNavigate } from "react-router";
import { SearchIcon, TrophyIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import { cn } from "@/lib/utils";
import ChallengeCard from "../challenge-card.jsx";

const FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "ACTIVE", label: "Faol" },
  { value: "UPCOMING", label: "Kutilmoqda" },
  { value: "STEPS", label: "Qadam" },
  { value: "WORKOUT_MINUTES", label: "Mashq" },
  { value: "BURNED_CALORIES", label: "Kaloriya" },
  { value: "SLEEP_HOURS", label: "Uyqu" },
];

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed bg-muted/20 px-5 py-16 text-center">
    <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <TrophyIcon className="size-8" />
    </div>
    <h3 className="text-xl font-black">Hozircha chellenjlar yo'q</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      Tez orada yangi chellenjlar qo'shiladi.
    </p>
  </div>
);

export default function ChallengeExploreContainer() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { user } = useAuthStore();
  const {
    challenges,
    isLoading,
    actionLoading,
    fetchChallenges,
    joinChallenge,
  } = useChallengeStore();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("ALL");
  const deferredSearch = React.useDeferredValue(search);

  React.useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges/explore", title: "Barcha chellenjlar" },
    ]);
  }, [setBreadcrumbs]);

  const challengeList = React.useMemo(
    () => (Array.isArray(challenges) ? challenges : []),
    [challenges],
  );

  const filteredChallenges = React.useMemo(() => {
    const q = trim(deferredSearch).toLowerCase();
    return challengeList.filter((challenge) => {
      const metricType =
        get(challenge, "metricDetails.type") || challenge.metricType;
      const matchesFilter =
        filter === "ALL" ||
        challenge.status === filter ||
        metricType === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        includes(String(get(challenge, "title", "")).toLowerCase(), q) ||
        includes(String(get(challenge, "description", "")).toLowerCase(), q) ||
        includes(
          String(get(challenge, "creator.profile.firstName", "")).toLowerCase(),
          q,
        )
      );
    });
  }, [challengeList, deferredSearch, filter]);

  const handleJoin = React.useCallback(
    async (challengeId) => {
      if (actionLoading?.joiningById?.[challengeId]) return;
      try {
        await joinChallenge(challengeId);
      } catch {
        // store-level toast
      }
    },
    [actionLoading?.joiningById, joinChallenge],
  );

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 pb-24">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Barcha chellenjlar</h1>
          <p className="text-sm text-muted-foreground">
            Ommaviy va do'stlaringiz yaratgan chellenjlarni toping.
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Chellenj qidirish..."
            className="h-12 rounded-2xl pl-11 font-semibold"
          />
        </div>

        <div className="-mx-1 overflow-x-auto px-1 pb-1 no-scrollbar">
          <div className="flex min-w-max gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  filter === item.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-[4/5] rounded-[1.75rem]"
              />
            ))}
          </div>
        ) : filteredChallenges.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={user?.id}
                isBusy={Boolean(get(actionLoading, `joiningById.${challenge.id}`))}
                onJoin={handleJoin}
                onViewDetail={(id) => navigate(`/user/challenges/${id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </PageTransition>
  );
}
