import React from "react";
import get from "lodash/get";
import includes from "lodash/includes";
import trim from "lodash/trim";
import filter from "lodash/filter";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toLower from "lodash/toLower";
import some from "lodash/some";
import { Link, useNavigate } from "react-router";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  PlusIcon,
  SearchIcon,
  TrophyIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import ChallengeCard from "../challenge-card.jsx";
import InvitationsBanner from "../invitations-banner.jsx";
import {
  formatChallengeDateRange,
  getMetricMeta,
  getMyProgress,
  getParticipantCount,
} from "../challenge-utils.js";

const FILTERS = [
  { value: "ALL", label: "Barchasi" },
  { value: "ACTIVE", label: "Faol" },
  { value: "UPCOMING", label: "Kutilmoqda" },
  { value: "STEPS", label: "Qadam" },
  { value: "WORKOUT_MINUTES", label: "Mashq" },
  { value: "BURNED_CALORIES", label: "Kaloriya" },
  { value: "SLEEP_HOURS", label: "Uyqu" },
];

const PageHeader = () => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-3xl font-semibold tracking-tight">Chellenjlar</h1>
      <p className="text-sm text-muted-foreground">
        Takliflar, faol musobaqalar va barcha ochiq chellenjlar.
      </p>
    </div>
    <Button asChild className="sm:w-auto">
      <Link to="/user/challenges/create">
        <PlusIcon data-icon="inline-start" />
        Yaratish
      </Link>
    </Button>
  </div>
);

const StatCard = ({ label, value }) => (
  <Card size="sm">
    <CardHeader>
      <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      <CardDescription>{label}</CardDescription>
    </CardHeader>
  </Card>
);

const ActiveChallengeTile = ({ challenge, onClick }) => {
  const progress = getMyProgress(challenge);
  const metricType =
    get(challenge, "metricDetails.type") || challenge.metricType || "STEPS";
  const metricMeta = getMetricMeta(metricType);

  return (
    <Card size="sm" className="w-[280px] shrink-0">
      <CardHeader>
        <CardTitle className="line-clamp-1">{challenge.title}</CardTitle>
        <CardDescription>
          {formatChallengeDateRange(challenge.startDate, challenge.endDate)}
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">{metricMeta.label}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">{Math.round(progress)}% bajarildi</span>
          <span className="text-muted-foreground">
            {getParticipantCount(challenge)} ishtirokchi
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
      <CardFooter>
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClick}>
          Ko'rish
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const EmptyState = ({ title, description, action }) => (
  <Card>
    <CardHeader className="items-center text-center">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    {action ? <CardFooter className="justify-center">{action}</CardFooter> : null}
  </Card>
);

export default function ChallengeHomeContainer() {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { user } = useAuthStore();
  const {
    challenges,
    challengeInvitations,
    isLoading,
    actionLoading,
    fetchChallenges,
    fetchMyInvitations,
    joinChallenge,
    respondToInvitation,
  } = useChallengeStore();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState("ALL");
  const deferredSearch = React.useDeferredValue(search);

  React.useEffect(() => {
    fetchChallenges();
    fetchMyInvitations("PENDING");
  }, [fetchChallenges, fetchMyInvitations]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/challenges/home", title: "Chellenjlar" },
    ]);
  }, [setBreadcrumbs]);

  const challengeList = React.useMemo(
    () => (isArray(challenges) ? challenges : []),
    [challenges],
  );
  const pendingInvitations = React.useMemo(
    () =>
      filter(
        (isArray(challengeInvitations) ? challengeInvitations : []),
        (inv) => get(inv, "status") === "PENDING",
      ),
    [challengeInvitations],
  );
  const joinedChallenges = React.useMemo(
    () =>
      filter(challengeList, (challenge) => {
        const participant = some((challenge.participants || []), (item) => item.userId === user?.id);
        return Boolean(challenge.isJoined || participant);
      }),
    [challengeList, user?.id],
  );
  const activeChallenges = filter(joinedChallenges, (challenge) => challenge.status === "ACTIVE");
  const completedChallenges = filter(joinedChallenges, (challenge) => challenge.status === "COMPLETED");
  const latestCompleted = completedChallenges[0];

  const filteredChallenges = React.useMemo(() => {
    const q = toLower(trim(deferredSearch));
    return filter(challengeList, (challenge) => {
      if (challenge.status === "CANCELLED") return false;
      const metricType =
        get(challenge, "metricDetails.type") || challenge.metricType;
      const matchesFilter =
        filter === "ALL" ||
        challenge.status === filter ||
        metricType === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (includes(toLower(String(get(challenge, "title", ""))), q) ||
      includes(toLower(String(get(challenge, "description", ""))), q) || includes(
        toLower(String(get(challenge, "creator.profile.firstName", ""))),
        q,
      ));
    });
  }, [challengeList, deferredSearch, filter]);

  const handleInvitationResponse = React.useCallback(
    async (invitationId, action) => {
      if (actionLoading?.respondingById?.[invitationId]) return;
      try {
        await respondToInvitation(invitationId, action);
      } catch {
        // store-level toast
      }
    },
    [actionLoading?.respondingById, respondToInvitation],
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

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 pb-24">
        <PageHeader />

        <InvitationsBanner
          invitations={pendingInvitations}
          respondingById={actionLoading?.respondingById}
          onRespond={handleInvitationResponse}
          onViewAll={() => navigate("/user/challenges/my")}
        />

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Faol" value={activeChallenges.length} />
          <StatCard label="Yakunlangan" value={completedChallenges.length} />
          <StatCard
            label="G'olib"
            value={
              filter(completedChallenges, (challenge) =>
                get(challenge, "myRank") === 1 ||
                get(challenge, "myProgress.rank") === 1).length
            }
          />
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Mening faol chellenjlarim</h2>
              <p className="text-sm text-muted-foreground">
                Bugun davom ettirishingiz mumkin bo'lgan musobaqalar.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/user/challenges/my">
                Mening
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {map(Array.from({ length: 2 }), (_, index) => (
                <Skeleton key={index} className="h-44 w-[280px] shrink-0" />
              ))}
            </div>
          ) : activeChallenges.length ? (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {map(activeChallenges, (challenge) => (
                <ActiveChallengeTile
                  key={challenge.id}
                  challenge={challenge}
                  onClick={() => navigate(`/user/challenges/${challenge.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Faol chellenj yo'q"
              description="Quyidagi ro'yxatdan mos chellenjni topib qo'shiling."
            />
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>So'nggi natija</CardTitle>
              <CardDescription>
                Yakunlangan chellenjlardagi oxirgi holatingiz.
              </CardDescription>
              <CardAction>
                <TrophyIcon />
              </CardAction>
            </CardHeader>
            <CardContent>
              {latestCompleted ? (
                <p className="text-sm text-muted-foreground">
                  {latestCompleted.title} -{" "}
                  {get(latestCompleted, "myRank")
                    ? `${get(latestCompleted, "myRank")}-o'rin`
                    : "muvaffaqiyatli yakunlandi"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Hali tugallangan chellenj yo'q.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O'z chellenjingizni yarating</CardTitle>
              <CardDescription>
                Do'stlaringizni taklif qiling, maqsad qo'ying va XP uchun bellashing.
              </CardDescription>
              <CardAction>
                <CheckCircle2Icon />
              </CardAction>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/user/challenges/create")}>
                <PlusIcon data-icon="inline-start" />
                Yaratish
              </Button>
            </CardFooter>
          </Card>
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Barcha chellenjlar</h2>
              <p className="text-sm text-muted-foreground">
                Ommaviy va do'stlaringiz yaratgan chellenjlarni toping.
              </p>
            </div>
            <Badge variant="outline">{filteredChallenges.length} ta</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <InputGroup className="h-10">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Chellenj qidirish..."
              />
            </InputGroup>

            <div className="overflow-x-auto pb-1 no-scrollbar">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={filter}
                onValueChange={(value) => value && setFilter(value)}
                className="min-w-max"
              >
                {map(FILTERS, (item) => (
                  <ToggleGroupItem key={item.value} value={item.value}>
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {map(Array.from({ length: 6 }), (_, index) => (
                <Skeleton key={index} className="aspect-[4/5]" />
              ))}
            </div>
          ) : filteredChallenges.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {map(filteredChallenges, (challenge) => (
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
            <EmptyState
              title="Chellenj topilmadi"
              description="Qidiruv yoki filterni o'zgartirib ko'ring."
            />
          )}
        </section>

        <Button
          size="icon-lg"
          className="fixed bottom-24 right-5 sm:hidden"
          onClick={() => navigate("/user/challenges/create")}
        >
          <PlusIcon />
        </Button>
      </div>
    </PageTransition>
  );
}
