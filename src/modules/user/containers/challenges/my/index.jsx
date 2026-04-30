import React from "react";
import { get, includes, trim } from "lodash";
import { Link, useNavigate } from "react-router";
import { CompassIcon, PlusIcon, TrophyIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import ChallengeCard from "../challenge-card.jsx";

const FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "ACTIVE", label: "Faol" },
  { value: "UPCOMING", label: "Kutilmoqda" },
  { value: "COMPLETED", label: "Yakunlangan" },
];

const EmptyState = () => (
  <Card>
    <CardHeader className="items-center text-center">
      <TrophyIcon />
      <CardTitle>Hali chellenjingiz yo'q</CardTitle>
      <CardDescription>
        Chellenj yarating yoki boshqalarning musobaqalariga qo'shiling.
      </CardDescription>
    </CardHeader>
    <CardFooter className="justify-center gap-2">
      <Button asChild>
        <Link to="/user/challenges/create">
          <PlusIcon data-icon="inline-start" />
          Yaratish
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/user/challenges/home">
          <CompassIcon data-icon="inline-start" />
          Ko'rish
        </Link>
      </Button>
    </CardFooter>
  </Card>
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
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/user/challenges/create">
              <PlusIcon data-icon="inline-start" />
              Yaratish
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto pb-1 no-scrollbar">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filter}
            onValueChange={(value) => value && setFilter(value)}
            className="min-w-max"
          >
            {FILTERS.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/5]" />
            ))}
          </div>
        ) : !hasAny ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-black">Qatnashayotganlarim</h2>
              {myJoined.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardDescription>
                  {includes(["ACTIVE", "UPCOMING", "COMPLETED"], filter)
                    ? `${trim(
                        FILTERS.find((item) => item.value === filter)?.label,
                      )} holatida qatnashayotgan chellenj yo'q.`
                    : "Hali hech qanday chellenjga qatnashmayapsiz."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black">Yaratganlarim</h2>
              {myCreated.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardDescription>
                      Bu filterda yaratgan chellenjingiz yo'q.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </section>
          </div>
        )}

        <Button
          size="icon-lg"
          className="fixed bottom-24 right-5"
          onClick={() => navigate("/user/challenges/create")}
        >
          <PlusIcon />
        </Button>
      </div>
    </PageTransition>
  );
}
