import React from "react";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  RefreshCcwIcon,
  SparklesIcon,
} from "lucide-react";
import { filter, find, get, gte, map, size } from "lodash";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import {
  buildLoadingStepStates,
  buildVisibleLoadingIssues,
  clampProgress,
  planGenerationChecklist,
} from "../lib/personalization.js";

const LOADING_KEY = "onboarding.postOnboarding.loading";

const GenerationProgressRing = ({ progress, error, label }) => {
  const progressValue = clampProgress(progress);

  return (
    <div
      className={cn(
        "ai-plan-generation__ring",
        error && "ai-plan-generation__ring--error",
      )}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressValue}
      style={{
        "--ai-plan-progress": `${progressValue * 3.6}deg`,
      }}
    >
      <div className="ai-plan-generation__ring-inner">
        {error ? (
          <AlertTriangleIcon className="ai-plan-generation__ring-icon" />
        ) : (
          <SparklesIcon className="ai-plan-generation__ring-icon" />
        )}
        <span className="ai-plan-generation__percent">{progressValue}%</span>
      </div>
    </div>
  );
};

const GenerationStepItem = ({ step }) => {
  const { t } = useTranslation();
  const title = t(`${LOADING_KEY}.checklist.${step.key}`);
  const statusLabel = t(`${LOADING_KEY}.stepStatus.${step.status}`);

  return (
    <li
      className={cn(
        "ai-plan-generation__step",
        `ai-plan-generation__step--${step.status}`,
      )}
      aria-current={step.isActive ? "step" : undefined}
    >
      <span className="ai-plan-generation__step-marker" aria-hidden="true">
        {step.isCompleted ? (
          <CheckCircle2Icon className="ai-plan-generation__step-icon" />
        ) : step.isActive ? (
          <SparklesIcon className="ai-plan-generation__step-icon" />
        ) : (
          step.index + 1
        )}
      </span>
      <span className="ai-plan-generation__step-title">{title}</span>
      <span className="sr-only">{statusLabel}</span>
    </li>
  );
};

const GenerationStepList = ({ steps }) => (
  <ol className="ai-plan-generation__steps">
    {map(steps, (step) => (
      <GenerationStepItem key={step.key} step={step} />
    ))}
  </ol>
);

const GenerationHintCard = () => {
  const { t } = useTranslation();

  return (
    <div className="ai-plan-generation__hint">
      <Clock3Icon className="ai-plan-generation__hint-icon" />
      <div>
        <p className="ai-plan-generation__hint-title">
          {t(`${LOADING_KEY}.hintTitle`)}
        </p>
        <p className="ai-plan-generation__hint-description">
          {t(`${LOADING_KEY}.hintDescription`)}
        </p>
      </div>
    </div>
  );
};

const GenerationErrorCard = ({
  issues,
  onRetry,
  retryLabel,
  canContinue,
  onContinue,
}) => {
  const { t } = useTranslation();

  return (
    <div className="ai-plan-generation__error">
      <div className="ai-plan-generation__error-heading">
        <AlertTriangleIcon className="size-4" />
        <span>{t(`${LOADING_KEY}.errorDescription`)}</span>
      </div>
      {size(issues) > 0 ? (
        <div className="ai-plan-generation__issues">
          {map(issues, (issue) => (
            <p key={issue}>- {issue}</p>
          ))}
        </div>
      ) : null}
      <div className="ai-plan-generation__actions">
        <Button type="button" onClick={onRetry} className="w-full">
          <RefreshCcwIcon className="size-4" />
          {retryLabel ?? t(`${LOADING_KEY}.retry`)}
        </Button>
        {canContinue ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onContinue}
            className="w-full"
          >
            <ArrowRightIcon className="size-4" />
            {t(`${LOADING_KEY}.manualContinue`)}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

const AiPlanGeneration = ({
  progress,
  error,
  missingData = [],
  qualityIssues = [],
  onRetry,
  retryLabel,
  canContinue = false,
  onContinue,
}) => {
  const { t } = useTranslation();
  const progressValue = clampProgress(progress);
  const isComplete = gte(progressValue, 100);
  const stepStates = buildLoadingStepStates(
    progressValue,
    planGenerationChecklist,
  );
  const activeStep =
    find(stepStates, { status: "active" }) ??
    stepStates[Math.max(0, size(stepStates) - 1)];
  const activeStepKey = get(activeStep, "key", "finalizing");
  const completedSteps = filter(stepStates, { status: "completed" });
  const subtitle = error
    ? t(`${LOADING_KEY}.errorDescription`)
    : t(`${LOADING_KEY}.subtitles.${activeStepKey}`);
  const visibleIssues = React.useMemo(
    () => buildVisibleLoadingIssues({ missingData, qualityIssues }),
    [missingData, qualityIssues],
  );

  useOnboardingFooter(null);

  return (
    <section
      className={cn(
        "ai-plan-generation",
        error && "ai-plan-generation--error",
        isComplete && "ai-plan-generation--complete",
      )}
      data-testid="ai-plan-generation"
    >
      <div className="ai-plan-generation__background" aria-hidden="true" />
      <article className="ai-plan-generation__card">
        <div className="ai-plan-generation__decor" aria-hidden="true" />

        <div className="ai-plan-generation__ring-wrap">
          <GenerationProgressRing
            progress={progressValue}
            error={error}
            label={t(`${LOADING_KEY}.progressAria`, {
              value: progressValue,
            })}
          />
        </div>

        <div className="ai-plan-generation__copy">
          <div className="ai-plan-generation__badge">
            {error ? (
              <AlertTriangleIcon className="size-4" />
            ) : (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            {t(`${LOADING_KEY}.badges.generation`)}
          </div>

          <h1 className="ai-plan-generation__title">
            {t(`${LOADING_KEY}.titles.generation`)}
          </h1>

          <p className="ai-plan-generation__subtitle">
            <span className="ai-plan-generation__status-dot" />
            <span className="ai-plan-generation__subtitle-text">
              {subtitle}
            </span>
          </p>

          {!error ? (
            <p className="ai-plan-generation__description">
              {t(`${LOADING_KEY}.description`)}
            </p>
          ) : null}
        </div>

        <div
          className="ai-plan-generation__linear"
          aria-hidden="true"
          style={{ "--ai-plan-linear": `${progressValue}%` }}
        >
          <div className="ai-plan-generation__linear-fill" />
        </div>

        <div className="sr-only">
          {t(`${LOADING_KEY}.currentStep`, {
            step: t(`${LOADING_KEY}.checklist.${activeStepKey}`),
          })}
          . {t(`${LOADING_KEY}.stepStatus.completed`)}: {size(completedSteps)}.
        </div>

        <GenerationStepList steps={stepStates} />

        {error ? (
          <GenerationErrorCard
            issues={visibleIssues}
            onRetry={onRetry}
            retryLabel={retryLabel}
            canContinue={canContinue}
            onContinue={onContinue}
          />
        ) : (
          <GenerationHintCard />
        )}
      </article>
    </section>
  );
};

export default AiPlanGeneration;
