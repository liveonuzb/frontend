import React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  RefreshCcwIcon,
  SparklesIcon,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import {
  getUserOnboardingGeneratingPath,
  getUserOnboardingResultPath,
} from "@/lib/app-paths";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useAuthStore } from "@/store";
import PageAura from "../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../lib/tones.js";
import {
  clampProgress,
  personalizationChecklist,
  personalizationLoadingSteps,
  unwrapApiData,
} from "../lib/personalization.js";

const tone = ONBOARDING_ACCENTS.green;

const getStepIndex = (progress) =>
  Math.min(
    personalizationLoadingSteps.length - 1,
    Math.floor(
      (clampProgress(progress) / 100) * personalizationLoadingSteps.length,
    ),
  );

const LoadingShell = ({
  progress,
  error,
  missingData = [],
  onRetry,
  retryLabel,
  mode = "personalization",
}) => {
  const { t } = useTranslation();
  const activeIndex = getStepIndex(progress);

  useOnboardingFooter(null);

  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
      <PageAura tone={tone} />
      <motion.div
        className="relative z-10 w-full max-w-3xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-background/90 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="relative px-5 py-6 sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute inset-x-8 top-4 h-36 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
              <div className="mx-auto flex size-44 items-center justify-center rounded-full bg-muted/60 sm:size-52">
                <div
                  className="relative flex size-36 items-center justify-center rounded-full bg-background shadow-inner sm:size-44"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${clampProgress(progress) * 3.6}deg, hsl(var(--muted)) 0deg)`,
                  }}
                >
                  <div className="absolute inset-3 rounded-full bg-background" />
                  <div className="relative flex flex-col items-center">
                    {error ? (
                      <AlertTriangleIcon className="mb-2 size-7 text-destructive" />
                    ) : (
                      <SparklesIcon className="mb-2 size-7 text-primary" />
                    )}
                    <span className="text-4xl font-black tracking-tight">
                      {clampProgress(progress)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                    {error ? (
                      <AlertTriangleIcon className="size-3.5" />
                    ) : (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    )}
                    {t(`onboarding.postOnboarding.loading.badges.${mode}`)}
                  </div>
                  <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                    {t("onboarding.postOnboarding.loading.title")}
                  </h1>
                  <p className="text-sm font-medium leading-6 text-muted-foreground sm:text-base">
                    {error
                      ? t("onboarding.postOnboarding.loading.errorDescription")
                      : t(
                          `onboarding.postOnboarding.loading.subtitles.${personalizationLoadingSteps[activeIndex]}`,
                        )}
                  </p>
                </div>

                <Progress value={clampProgress(progress)} className="h-2.5" />

                <div className="grid gap-2">
                  {personalizationChecklist.map((item, index) => {
                    const completed =
                      clampProgress(progress) >=
                      Math.round(
                        ((index + 1) / personalizationChecklist.length) * 100,
                      );

                    return (
                      <div
                        key={item}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors",
                          completed
                            ? "border-primary/20 bg-primary/5 text-foreground"
                            : "border-border/70 bg-muted/30 text-muted-foreground",
                        )}
                      >
                        <CheckCircle2Icon
                          className={cn(
                            "size-4 shrink-0",
                            completed
                              ? "text-primary"
                              : "text-muted-foreground/50",
                          )}
                        />
                        {t(
                          `onboarding.postOnboarding.loading.checklist.${item}`,
                        )}
                      </div>
                    );
                  })}
                </div>

                {error ? (
                  <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
                    {missingData.length > 0 ? (
                      <div className="space-y-1 text-xs font-medium text-destructive">
                        {missingData.map((item) => (
                          <p key={item}>- {item}</p>
                        ))}
                      </div>
                    ) : null}
                    <Button type="button" onClick={onRetry} className="w-full">
                      <RefreshCcwIcon className="size-4" />
                      {retryLabel ??
                        t("onboarding.postOnboarding.loading.retry")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const PersonalizingContainer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const setOnboardingFlow = useAuthStore((state) => state.setOnboardingFlow);
  const [progress, setProgress] = React.useState(0);
  const { mutateAsync: retryPersonalization, isPending: isRetrying } =
    usePostQuery();
  const statusQuery = useGetQuery({
    url: jobId
      ? `/user/onboarding/personalization-status/${jobId}`
      : "/user/onboarding/personalization-result",
    queryProps: {
      queryKey: jobId
        ? ["onboarding", "personalization-status", jobId]
        : ["onboarding", "personalization-result"],
      retry: 1,
      refetchInterval: (query) => {
        if (!jobId) return false;
        const status = unwrapApiData(query.state.data)?.status;
        return status === "COMPLETED" || status === "FAILED" ? false : 1400;
      },
    },
  });
  const job = unwrapApiData(statusQuery.data);
  const isCompleted = jobId
    ? job?.status === "COMPLETED"
    : statusQuery.isSuccess;
  const isFailed = job?.status === "FAILED" || statusQuery.isError;
  const hasServerProgress = Number.isFinite(Number(job?.progress));
  const resolvedProgress = clampProgress(
    hasServerProgress ? job?.progress : progress,
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        const cap = isCompleted ? 100 : 88;
        return Math.min(cap, current + (isCompleted ? 12 : 4));
      });
    }, 180);

    return () => window.clearInterval(timer);
  }, [isCompleted]);

  React.useEffect(() => {
    if (job?.flowStatus || job?.nextPath) {
      setOnboardingFlow({
        onboardingFlowStatus: job.flowStatus,
        onboardingNextPath: job.nextPath,
        latestPersonalizationJobId: job.id,
      });
    }

    if (isCompleted && resolvedProgress >= 100) {
      const timer = window.setTimeout(() => {
        navigate(getUserOnboardingResultPath(), { replace: true });
      }, 420);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isCompleted, job, navigate, resolvedProgress, setOnboardingFlow]);

  return (
    <LoadingShell
      progress={isFailed ? 100 : resolvedProgress}
      error={isFailed}
      missingData={job?.missingData ?? []}
      onRetry={async () => {
        setProgress(0);
        if (isFailed) {
          const response = await retryPersonalization({
            url: "/user/onboarding/retry-personalization",
          });
          const nextJob = unwrapApiData(response);
          setOnboardingFlow({
            onboardingFlowStatus: nextJob?.flowStatus,
            onboardingNextPath: nextJob?.nextPath,
            latestPersonalizationJobId: nextJob?.id,
          });
          if (nextJob?.id && nextJob.id !== jobId) {
            navigate(`/user/onboarding/personalizing/${nextJob.id}`, {
              replace: true,
            });
            return;
          }
        }
        void statusQuery.refetch();
      }}
      retryLabel={isRetrying ? t("common.loading") : undefined}
      mode="personalization"
    />
  );
};

export const GeneratingContainer = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setOnboardingFlow = useAuthStore((state) => state.setOnboardingFlow);
  const [activeJobId, setActiveJobId] = React.useState(jobId ?? "");
  const [localProgress, setLocalProgress] = React.useState(0);
  const startedRef = React.useRef(false);
  const { mutateAsync: startGeneration, isPending: isStarting } =
    usePostQuery();
  const { mutateAsync: activateOnboarding } = usePostQuery();

  const statusQuery = useGetQuery({
    url: activeJobId ? `/user/onboarding/generation-status/${activeJobId}` : "",
    queryProps: {
      queryKey: ["onboarding", "generation-status", activeJobId],
      enabled: Boolean(activeJobId),
      refetchInterval: (query) => {
        const status = unwrapApiData(query.state.data)?.status;
        return status === "COMPLETED" || status === "FAILED" ? false : 1600;
      },
    },
  });
  const job = unwrapApiData(statusQuery.data);
  const isFailed = job?.status === "FAILED" || statusQuery.isError;
  const hasServerProgress = Number.isFinite(Number(job?.progress));
  const progress = clampProgress(
    hasServerProgress ? job?.progress : localProgress,
  );

  const start = React.useCallback(async () => {
    startedRef.current = true;
    const response = await startGeneration({
      url: "/user/onboarding/generate-personal-plan",
    });
    const nextJob = unwrapApiData(response);
    if (nextJob?.id) {
      setOnboardingFlow({
        onboardingFlowStatus: nextJob.flowStatus,
        onboardingNextPath: nextJob.nextPath,
        latestPlanGenerationJobId: nextJob.id,
      });
      setActiveJobId(nextJob.id);
      navigate(getUserOnboardingGeneratingPath(nextJob.id), { replace: true });
    }
  }, [navigate, setOnboardingFlow, startGeneration]);

  React.useEffect(() => {
    if (!activeJobId && !startedRef.current) {
      void start();
    }
  }, [activeJobId, start]);

  React.useEffect(() => {
    if (job?.status === "COMPLETED" && progress >= 100) {
      const timer = window.setTimeout(async () => {
        const activation = await activateOnboarding({
          url: "/user/onboarding/activate",
        });
        const activationBody = unwrapApiData(activation);
        setOnboardingFlow({
          onboardingFlowStatus:
            activationBody?.onboardingFlowStatus ?? activationBody?.status,
          onboardingNextPath: activationBody?.onboardingNextPath,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["me"] }),
          queryClient.invalidateQueries({ queryKey: ["meal-plans"] }),
          queryClient.invalidateQueries({ queryKey: ["workout-plans"] }),
        ]);
        navigate("/user/dashboard", { replace: true });
      }, 650);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [
    activateOnboarding,
    job?.status,
    navigate,
    progress,
    queryClient,
    setOnboardingFlow,
  ]);

  React.useEffect(() => {
    if (job?.flowStatus || job?.nextPath) {
      setOnboardingFlow({
        onboardingFlowStatus: job.flowStatus,
        onboardingNextPath: job.nextPath,
        latestPlanGenerationJobId: job.id,
      });
    }
  }, [job, setOnboardingFlow]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setLocalProgress((current) =>
        activeJobId ? Math.min(92, current + 2) : Math.min(20, current + 3),
      );
    }, 300);

    return () => window.clearInterval(timer);
  }, [activeJobId]);

  return (
    <LoadingShell
      progress={isFailed ? 100 : isStarting ? Math.max(progress, 12) : progress}
      error={isFailed}
      missingData={job?.missingData ?? []}
      onRetry={() => {
        startedRef.current = false;
        setActiveJobId("");
        setLocalProgress(0);
        void start();
      }}
      mode="generation"
    />
  );
};

export default PersonalizingContainer;
