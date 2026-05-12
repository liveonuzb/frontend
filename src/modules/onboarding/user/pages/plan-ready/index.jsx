import React from "react";
import {
  BellIcon,
  CheckCircle2Icon,
  DropletsIcon,
  DumbbellIcon,
  Loader2Icon,
  ShieldCheckIcon,
  UtensilsIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "@/modules/onboarding/user/components/page-aura.jsx";
import { unwrapApiData } from "@/modules/onboarding/user/lib/personalization.js";
import { ONBOARDING_ACCENTS } from "@/modules/onboarding/user/lib/tones.js";
import { useAuthStore } from "@/store";

const tone = ONBOARDING_ACCENTS.green;

const steps = [
  { key: "water", icon: DropletsIcon },
  { key: "meal", icon: UtensilsIcon },
  { key: "workout", icon: DumbbellIcon },
];

const qualityLevels = new Set(["excellent", "good", "needs_review", "blocked"]);

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setOnboardingFlow, latestPlanGenerationJobId } = useAuthStore(
    (state) => ({
      setOnboardingFlow: state.setOnboardingFlow,
      latestPlanGenerationJobId: state.latestPlanGenerationJobId,
    }),
  );
  const { mutateAsync: activateOnboarding, isPending } = usePostQuery();
  const generationStatusQuery = useGetQuery({
    url: latestPlanGenerationJobId
      ? `/user/onboarding/generation-status/${latestPlanGenerationJobId}`
      : "",
    queryProps: {
      enabled: Boolean(latestPlanGenerationJobId),
      queryKey: ["onboarding", "generation-status", latestPlanGenerationJobId],
      staleTime: 60000,
    },
  });
  const generationJob = unwrapApiData(generationStatusQuery.data);
  const qualityReport = generationJob?.qualityReport;
  const qualityScore = Number(qualityReport?.score ?? 0);
  const qualityLevel = qualityLevels.has(qualityReport?.level)
    ? qualityReport.level
    : "good";

  useOnboardingFooter(
    <Button
      type="button"
      size="lg"
      disabled={isPending}
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      onClick={async () => {
        const response = await activateOnboarding({
          url: "/user/onboarding/activate",
        });
        const body = unwrapApiData(response);
        setOnboardingFlow({
          onboardingFlowStatus: body?.onboardingFlowStatus ?? body?.status,
          onboardingNextPath: body?.onboardingNextPath,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["me"] }),
          queryClient.invalidateQueries({ queryKey: ["meal-plans"] }),
          queryClient.invalidateQueries({ queryKey: ["workout-plans"] }),
        ]);
        navigate("/user/dashboard", { replace: true });
      }}
    >
      {isPending ? <Loader2Icon className="size-4 animate-spin" /> : null}
      {t("onboarding.postOnboarding.planReady.cta")}
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-background px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <section className={cn("relative rounded-[1.75rem] border bg-background/90 p-5 shadow-sm backdrop-blur", tone.border)}>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
          <CheckCircle2Icon className="size-3.5" />
          {t("onboarding.postOnboarding.planReady.badge")}
        </div>
        <h1 className="mt-3 text-[2rem] font-black leading-[1.05] tracking-tight text-foreground">
          {t("onboarding.postOnboarding.planReady.title")}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
          {t("onboarding.postOnboarding.planReady.subtitle")}
        </p>
      </section>

      <section className="grid gap-3">
        {steps.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex gap-3 rounded-[1.35rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur"
          >
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", tone.badgeTone)}>
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-base font-black text-foreground">
                {t(`onboarding.postOnboarding.planReady.steps.${key}.title`)}
              </span>
              <span className="mt-1 block text-sm font-medium leading-6 text-muted-foreground">
                {t(
                  `onboarding.postOnboarding.planReady.steps.${key}.description`,
                )}
              </span>
            </span>
          </div>
        ))}
      </section>

      {qualityReport ? (
        <section className="rounded-[1.35rem] border border-emerald-500/20 bg-background/90 p-4 shadow-sm backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-black text-foreground">
              <ShieldCheckIcon className="size-4 text-emerald-600" />
              {t("onboarding.postOnboarding.planReady.qualityTitle")}
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-700">
              {t(
                `onboarding.postOnboarding.planReady.qualityLevel.${qualityLevel}`,
              )}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm font-black text-muted-foreground">
              {t("onboarding.postOnboarding.planReady.qualityScore")}
            </span>
            <span className="text-2xl font-black text-foreground">
              {qualityScore}%
            </span>
          </div>
          <Progress value={qualityScore} className="mt-3 h-2" />
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-700">
            {qualityReport.passed
              ? t("onboarding.postOnboarding.planReady.qualityPassed")
              : t("onboarding.postOnboarding.planReady.qualityNeedsReview")}
          </p>
        </section>
      ) : null}

      <section className="mb-24 rounded-[1.35rem] border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-black text-foreground">
          <BellIcon className="size-4 text-primary" />
          {t("onboarding.postOnboarding.planReady.retentionTitle")}
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
          {t("onboarding.postOnboarding.planReady.retentionDescription")}
        </p>
      </section>
    </div>
  );
};

export default Index;
