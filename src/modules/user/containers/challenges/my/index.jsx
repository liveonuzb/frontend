import React from "react";
import { get, includes, trim } from "lodash";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { CompassIcon, PlusIcon, TrophyIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import { cn } from "@/lib/utils";
import ChallengeCard from "../challenge-card.jsx";

const FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "ACTIVE", label: "Faol" },
  { value: "UPCOMING", label: "Kutilmoqda" },
  { value: "COMPLETED", label: "Yakunlangan" },
];

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed bg-muted/20 px-5 py-16 text-center">
    <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <TrophyIcon className="size-8" />
    </div>
    <h3 className="text-xl font-black">Hali chellenjingiz yo'q</h3>
    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
      Chellenj yarating yoki boshqalarning musobaqalariga qo'shiling.
    </p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <Button asChild className="rounded-2xl">
        <Link to="/user/challenges/create">
          <PlusIcon className="mr-2 size-4" />
          Yaratish
        </Link>
      </Button>
      <Button asChild variant="outline" className="rounded-2xl">
        <Link to="/user/challenges/explore">
          <CompassIcon className="mr-2 size-4" />
          Ko'rish
        </Link>
      </Button>
    </div>
  </div>
);

export default function ChallengeMyContainer() {
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
  const [filter, setFilter] = React.useState("ALL");

  React.useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges/my", title: "Mening chellenjlarim" },
    ]);
  }, [setBreadcrumbs]);

  const challengeList = React.useMemo(
    () => (Array.isArray(challenges) ? challenges : []),
    [challenges],
  );

  const myJoined = React.useMemo(
    () =>
      challengeList.filter((challenge) => {
        const joinedByParticipants = (challenge.participants || []).some(
          (item) => item.userId === user?.id,
        );
        const matchesStatus = filter === "ALL" || challenge.status === filter;
        return matchesStatus && Boolean(challenge.isJoined || joinedByParticipants);
      }),
    [challengeList, filter, user?.id],
  );

  const myCreated = React.useMemo(
    () =>
      challengeList.filter((challenge) => {
        const creatorId =
          get(challenge, "creator.id") || get(challenge, "creator.userId");
        const matchesStatus = filter === "ALL" || challenge.status === filter;
        return (
          matchesStatus &&
          (challenge.type === "CUSTOM" || creatorId === user?.id) &&
          creatorId === user?.id
        );
      }),
    [challengeList, filter, user?.id],
  );

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

  const hasAny = myJoined.length > 0 || myCreated.length > 0;

  return (
    <PageTransition>
      <div className="flex flex-col gap-5 pb-28">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Mening chellenjlarim
            </h1>
            <p className="text-sm text-muted-foreground">
              Qatnashayotgan va yaratgan chellenjlaringiz.
            </p>
          </div>
          <Button asChild className="hidden rounded-2xl sm:inline-flex">
            <Link to="/user/challenges/create">
              <PlusIcon className="mr-2 size-4" />
              Yaratish
            </Link>
          </Button>
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
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-[4/5] rounded-[1.75rem]"
              />
            ))}
          </div>
        ) : !hasAny ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-black">Qatnashayotganlarim</h2>
              {myJoined.length ? (
                <motion.div
                  layout
                  className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  {myJoined.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      userId={user?.id}
                      showProgress
                      isBusy={Boolean(
                        get(actionLoading, `joiningById.${challenge.id}`),
                      )}
                      onJoin={handleJoin}
                      onViewDetail={(id) => navigate(`/user/challenges/${id}`)}
                    />
                  ))}
                </motion.div>
              ) : (
                <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                  {includes(["ACTIVE", "UPCOMING", "COMPLETED"], filter)
                    ? `${trim(
                        FILTERS.find((item) => item.value === filter)?.label,
                      )} holatida qatnashayotgan chellenj yo'q.`
                    : "Hali hech qanday chellenjga qatnashmayapsiz."}
                </p>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black">Yaratganlarim</h2>
              {myCreated.length ? (
                <motion.div
                  layout
                  className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                  {myCreated.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      userId={user?.id}
                      showProgress
                      isBusy={Boolean(
                        get(actionLoading, `joiningById.${challenge.id}`),
                      )}
                      onJoin={handleJoin}
                      onViewDetail={(id) => navigate(`/user/challenges/${id}`)}
                    />
                  ))}
                </motion.div>
              ) : (
                <p className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                  Bu filterda yaratgan chellenjingiz yo'q.
                </p>
              )}
            </section>
          </div>
        )}

        <Button
          size="icon"
          className="fixed bottom-24 right-5 z-40 size-14 rounded-full shadow-2xl shadow-primary/40"
          onClick={() => navigate("/user/challenges/create")}
        >
          <PlusIcon className="size-7" />
        </Button>
      </div>
    </PageTransition>
  );
}
