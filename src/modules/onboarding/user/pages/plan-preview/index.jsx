import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  DumbbellIcon,
  Loader2Icon,
  SaladIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { getUserOnboardingGeneratingPath } from "@/lib/app-paths";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { getOnboardingValueLabel } from "@/modules/onboarding/lib/onboarding-labels";
import PageAura from "@/modules/onboarding/user/components/page-aura.jsx";
import { unwrapApiData } from "@/modules/onboarding/user/lib/personalization.js";
import { ONBOARDING_ACCENTS } from "@/modules/onboarding/user/lib/tones.js";
import { useAuthStore } from "@/store";

const tone = ONBOARDING_ACCENTS.amber;

const IssueList = ({ title, items = [], toneClass }) => {
  if (!items.length) return null;

  return (
    <section className="rounded-[1.35rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
      <h2 className="text-sm font-black text-foreground">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div
            key={item.code ?? item.message}
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm font-semibold leading-5",
              toneClass,
            )}
          >
            {item.message ?? item}
          </div>
        ))}
      </div>
    </section>
  );
};

const SummaryBlock = ({ icon: Icon, title, rows }) => (
  <section className="rounded-[1.35rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
    <div className="flex items-center gap-2">
      <span className={cn("flex size-9 items-center justify-center rounded-full", tone.badgeTone)}>
        <Icon className="size-4" />
      </span>
      <h2 className="text-sm font-black text-foreground">{title}</h2>
    </div>
    <div className="mt-4 grid gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex min-h-10 items-center justify-between gap-3 rounded-2xl bg-muted/35 px-3 py-2 text-sm"
        >
          <span className="font-semibold text-muted-foreground">{row.label}</span>
          <span className="text-right font-black text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  </section>
);

const PLAN_PREVIEW_KEY = "onboarding.postOnboarding.planPreview";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setOnboardingFlow = useAuthStore((state) => state.setOnboardingFlow);
  const { mutateAsync: startGeneration, isPending } = usePostQuery();
  const preflightQuery = useGetQuery({
    url: "/user/onboarding/plan-preflight",
    queryProps: {
      queryKey: ["onboarding", "plan-preflight"],
      staleTime: 15000,
    },
  });
  const preflight = unwrapApiData(preflightQuery.data);

  const canGenerate = preflight?.canGenerate !== false;
  const readinessScore = Number(
    preflight?.readinessScore ?? preflight?.qualityScore ?? 0,
  );

  useOnboardingFooter(
    <Button
      type="button"
      size="lg"
      disabled={isPending || preflightQuery.isLoading || !canGenerate}
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      onClick={async () => {
        const response = await startGeneration({
          url: "/user/onboarding/generate-personal-plan",
        });
        const job = unwrapApiData(response);
        setOnboardingFlow({
          onboardingFlowStatus: job?.flowStatus,
          onboardingNextPath: job?.nextPath,
          latestPlanGenerationJobId: job?.id,
        });
        navigate(getUserOnboardingGeneratingPath(job?.id), { replace: true });
      }}
    >
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
      {t(`${PLAN_PREVIEW_KEY}.cta`)}
    </Button>,
  );

  if (preflightQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-background px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <section className={cn("relative rounded-[1.75rem] border bg-background/90 p-5 shadow-sm backdrop-blur", tone.border)}>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-black text-primary">
          <SparklesIcon className="size-3.5" />
          {t(`${PLAN_PREVIEW_KEY}.badge`)}
        </div>
        <h1 className="mt-3 text-[2rem] font-black leading-[1.05] tracking-tight text-foreground">
          {t(`${PLAN_PREVIEW_KEY}.title`)}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
          {t(`${PLAN_PREVIEW_KEY}.subtitle`)}
        </p>
        <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-black text-foreground">
              {t(`${PLAN_PREVIEW_KEY}.readinessScore`)}
            </span>
            <span className="text-2xl font-black text-foreground">
              {readinessScore}%
            </span>
          </div>
          <Progress value={readinessScore} className="mt-3 h-2" />
        </div>
      </section>

      {!canGenerate ? (
        <IssueList
          title={t(`${PLAN_PREVIEW_KEY}.fixFirstTitle`)}
          items={preflight?.blockingIssues ?? []}
          toneClass="border-destructive/25 bg-destructive/5 text-destructive"
        />
      ) : (
        <section className="rounded-[1.35rem] border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm font-semibold leading-6 text-emerald-700">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="size-4" />
            {t(`${PLAN_PREVIEW_KEY}.ready`)}
          </div>
        </section>
      )}

      <IssueList
        title={t(`${PLAN_PREVIEW_KEY}.attentionTitle`)}
        items={preflight?.warnings ?? []}
        toneClass="border-amber-500/25 bg-amber-500/10 text-amber-700"
      />

      <SummaryBlock
        icon={SaladIcon}
        title={t(`${PLAN_PREVIEW_KEY}.nutritionTitle`)}
        rows={[
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.calories`),
            value: t(`${PLAN_PREVIEW_KEY}.values.kcal`, {
              value: preflight?.nutrition?.dailyCalories ?? "-",
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.macros`),
            value: t(`${PLAN_PREVIEW_KEY}.values.macros`, {
              protein: preflight?.nutrition?.proteinGram ?? "-",
              carbs: preflight?.nutrition?.carbsGram ?? "-",
              fat: preflight?.nutrition?.fatGram ?? "-",
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.meals`),
            value: t(`${PLAN_PREVIEW_KEY}.values.meals`, {
              count: preflight?.nutrition?.mealsPerDay ?? 3,
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.cuisines`),
            value: t(`${PLAN_PREVIEW_KEY}.values.count`, {
              count: preflight?.nutrition?.preferredCuisineCount ?? 0,
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.allergies`),
            value: t(`${PLAN_PREVIEW_KEY}.values.count`, {
              count: preflight?.nutrition?.allergyCount ?? 0,
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.budget`),
            value: preflight?.nutrition?.budgetTier
              ? getOnboardingValueLabel(
                  "foodBudgetTier",
                  preflight.nutrition.budgetTier,
                  t,
                )
              : t("onboarding.review.emptyValue"),
          },
        ]}
      />

      <SummaryBlock
        icon={DumbbellIcon}
        title={t(`${PLAN_PREVIEW_KEY}.workoutTitle`)}
        rows={[
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.weeklyWorkouts`),
            value: t(`${PLAN_PREVIEW_KEY}.values.days`, {
              count: preflight?.workout?.weeklyWorkoutDays ?? "-",
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.location`),
            value: getOnboardingValueLabel(
              "workoutLocation",
              preflight?.workout?.workoutLocation,
              t,
            ),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.equipment`),
            value: t(`${PLAN_PREVIEW_KEY}.values.count`, {
              count: preflight?.workout?.equipmentCount ?? 0,
            }),
          },
          {
            label: t(`${PLAN_PREVIEW_KEY}.rows.bodyParts`),
            value: t(`${PLAN_PREVIEW_KEY}.values.count`, {
              count: preflight?.workout?.bodyPartCount ?? 0,
            }),
          },
        ]}
      />

      <section className="mb-24 rounded-[1.35rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <ShieldCheckIcon className="size-4 text-primary" />
          {t(`${PLAN_PREVIEW_KEY}.recommendationsTitle`)}
        </div>
        <div className="mt-3 grid gap-2">
          {(preflight?.recommendedFixes ?? []).map((fix) => (
            <div
              key={fix}
              className="rounded-2xl bg-muted/35 px-3 py-2 text-sm font-semibold leading-5 text-muted-foreground"
            >
              {fix}
            </div>
          ))}
        </div>
        {(preflight?.recommendedFixes ?? []).length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            {t(`${PLAN_PREVIEW_KEY}.noRecommendations`)}
          </p>
        ) : null}
      </section>

      {(preflight?.blockingIssues ?? []).length > 0 ? (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive">
          <AlertTriangleIcon className="size-4" />
          {t(`${PLAN_PREVIEW_KEY}.blockingLocked`)}
        </div>
      ) : null}
    </div>
  );
};

export default Index;
