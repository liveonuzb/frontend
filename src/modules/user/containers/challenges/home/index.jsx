import React from "react";
import { get } from "lodash";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  PlusIcon,
  SparklesIcon,
  TrophyIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useChallengeStore } from "@/store/challenges-store";
import InvitationsBanner from "../invitations-banner.jsx";
import {
  formatChallengeDateRange,
  getMyProgress,
  getParticipantCount,
  getPresetCover,
} from "../challenge-utils.js";

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border bg-card/80 p-4">
    <p className="text-2xl font-black tabular-nums">{value}</p>
    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
  </div>
);

const ActiveChallengeTile = ({ challenge, onClick }) => {
  const progress = getMyProgress(challenge);
  const preset = getPresetCover(challenge.coverPreset || "run");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-[280px] shrink-0 overflow-hidden rounded-[1.5rem] border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden">
        {challenge?.image?.url ? (
          <img
            src={challenge.image.url}
            alt={challenge.title}
            className="size-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex size-full items-center justify-center bg-gradient-to-br ${preset.from} ${preset.to} text-5xl`}
          >
            {preset.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-1 text-base font-black text-white">
            {challenge.title}
          </h3>
          <p className="text-xs font-semibold text-white/75">
            {formatChallengeDateRange(challenge.startDate, challenge.endDate)}
          </p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-600">
            {Math.round(progress)}% bajarildi
          </span>
          <span className="text-muted-foreground">
            {getParticipantCount(challenge)} ishtirokchi
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </button>
  );
};

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
    respondToInvitation,
  } = useChallengeStore();

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
    () => (Array.isArray(challenges) ? challenges : []),
    [challenges],
  );
  const pendingInvitations = React.useMemo(
    () =>
      (Array.isArray(challengeInvitations) ? challengeInvitations : []).filter(
        (inv) => get(inv, "status") === "PENDING",
      ),
    [challengeInvitations],
  );
  const joinedChallenges = React.useMemo(
    () =>
      challengeList.filter((challenge) => {
        const participant = (challenge.participants || []).some(
          (item) => item.userId === user?.id,
        );
        return Boolean(challenge.isJoined || participant);
      }),
    [challengeList, user?.id],
  );
  const activeChallenges = joinedChallenges.filter(
    (challenge) => challenge.status === "ACTIVE",
  );
  const completedChallenges = joinedChallenges.filter(
    (challenge) => challenge.status === "COMPLETED",
  );
  const latestCompleted = completedChallenges[0];

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

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Chellenjlar</h1>
            <p className="text-sm text-muted-foreground">
              Faol musobaqalar, takliflar va natijalar.
            </p>
          </div>
          <Button asChild className="hidden rounded-2xl sm:inline-flex">
            <Link to="/user/challenges/create">
              <PlusIcon className="mr-2 size-4" />
              Yaratish
            </Link>
          </Button>
        </div>

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
              completedChallenges.filter(
                (challenge) =>
                  get(challenge, "myRank") === 1 ||
                  get(challenge, "myProgress.rank") === 1,
              ).length
            }
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Faol chellenjlar</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/user/challenges/my">
                Mening
                <ArrowRightIcon className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-56 w-[280px] shrink-0 rounded-[1.5rem]" />
              ))}
            </div>
          ) : activeChallenges.length ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
              {activeChallenges.map((challenge) => (
                <ActiveChallengeTile
                  key={challenge.id}
                  challenge={challenge}
                  onClick={() => navigate(`/user/challenges/${challenge.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed bg-muted/20 p-6 text-center">
              <p className="font-bold">Hali hech qanday chellenjga qo'shilmagansiz</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Barcha chellenjlarni ko'rib, mosini tanlang.
              </p>
              <Button asChild className="mt-4 rounded-2xl">
                <Link to="/user/challenges/explore">Ko'rish</Link>
              </Button>
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.5rem] border bg-card/80 p-5">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <TrophyIcon className="size-5" />
            </div>
            <h2 className="text-lg font-black">So'nggi natija</h2>
            {latestCompleted ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {latestCompleted.title} —{" "}
                {get(latestCompleted, "myRank")
                  ? `${get(latestCompleted, "myRank")}-o'rin`
                  : "muvaffaqiyatli yakunlandi"}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Hali tugallangan chellenj yo'q.
              </p>
            )}
          </div>

          <motion.div
            whileHover={{ y: -3 }}
            className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary to-emerald-500 p-5 text-primary-foreground shadow-xl shadow-primary/20"
          >
            <SparklesIcon className="mb-8 size-8 opacity-90" />
            <h2 className="text-2xl font-black tracking-tight">
              O'z chellenjingizni yarating
            </h2>
            <p className="mt-2 max-w-sm text-sm text-primary-foreground/80">
              Do'stlaringizni taklif qiling, maqsad qo'ying va XP uchun bellashing.
            </p>
            <Button
              variant="secondary"
              className="mt-5 rounded-2xl font-bold"
              onClick={() => navigate("/user/challenges/create")}
            >
              <PlusIcon className="mr-2 size-4" />
              Yaratish
            </Button>
          </motion.div>
        </div>

        <Button
          size="icon"
          className="fixed bottom-24 right-5 z-40 size-14 rounded-full shadow-2xl shadow-primary/40 sm:hidden"
          onClick={() => navigate("/user/challenges/create")}
        >
          <PlusIcon className="size-7" />
        </Button>
      </div>
    </PageTransition>
  );
}
