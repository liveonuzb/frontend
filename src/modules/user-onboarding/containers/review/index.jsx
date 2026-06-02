import isArray from "lodash/isArray";
import join from "lodash/join";
import filter from "lodash/filter";
import map from "lodash/map";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  HeartPulseIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  SaladIcon,
  TargetIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePostQuery } from "@/hooks/api";
import { getUserOnboardingPersonalizingPath } from "@/lib/app-paths";
import { trackLaunchEvent } from "@/lib/analytics.js";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { cn } from "@/lib/utils";
import { useAuthStore, useOnboardingStore } from "@/store";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { isMeaningfulUserDraftData } from "@/modules/user-onboarding/lib/user-draft-data";
import {
  getCountSummary,
  getOnboardingValueLabel,
} from "@/modules/user-onboarding/lib/onboarding-labels";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import {
  getHealthConstraintsSummary,
  getReviewBlockingErrors,
  getReviewBlockingFixTargets,
  getReviewRecommendations,
} from "./review-issues.js";
import { buildCompletePayload } from "./complete-payload.js";
import { ONBOARDING_GRID_SCROLL_AREA_CLASS } from "../onboarding-scroll-area.js";

const tone = ONBOARDING_ACCENTS.green;

const SummaryCard = ({ editLabel, icon: Icon, title, items, onEdit }) => (
  <section className="rounded-2xl border bg-background/90 p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            tone.badgeTone,
          )}
        >
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-black">{title}</h2>
      </div>
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 px-2 text-xs"
          onClick={onEdit}
        >
          <PencilIcon className="size-3.5" aria-hidden="true" />
          {editLabel}
        </Button>
      ) : null}
    </div>
    <div className="grid gap-2 text-sm">
      {map(items, ([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3">
          <span className="text-muted-foreground">{label}</span>
          <span className="max-w-[58%] text-right font-semibold">
            {value || "-"}
          </span>
        </div>
      ))}
    </div>
  </section>
);

const reviewReturnState = { returnTo: "/user/onboarding/review" };

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const onboardingState = useOnboardingStore();
  const resetOnboardingStore = useOnboardingStore((state) => state.reset);
  const { initializeUser, setOnboardingCompleted, setOnboardingFlow, user } =
    useAuthStore();
  const canAutoSaveReview = isMeaningfulUserDraftData(onboardingState);
  const blockingFixTargets = React.useMemo(
    () => getReviewBlockingFixTargets(onboardingState, t),
    [onboardingState, t],
  );
  const blockingErrors = React.useMemo(
    () => getReviewBlockingErrors(onboardingState, t),
    [onboardingState, t],
  );
  const recommendations = React.useMemo(
    () => getReviewRecommendations(onboardingState, t),
    [onboardingState, t],
  );
  const hasBlockingErrors = blockingErrors.length > 0;

  useOnboardingAutoSave("user", "review", { enabled: canAutoSaveReview });

  const { mutateAsync: completeOnboarding, isPending } = usePostQuery({
    mutationProps: {
      onSuccess: async (_data, variables) => {
        const body = _data?.data?.data ?? _data?.data ?? {};
        const personalizationJobId =
          body?.personalizationJobId ?? body?.personalizationJob?.id;
        const flowPayload = {
          onboardingFlowStatus:
            body?.onboardingFlowStatus ??
            body?.personalizationJob?.flowStatus ??
            "PERSONALIZING",
          onboardingNextPath:
            body?.onboardingNextPath ?? body?.personalizationJob?.nextPath,
          latestPersonalizationJobId: personalizationJobId,
        };
        const nextOnboarding = normalizeUserOnboarding(variables?.attributes);
        const nextUser = user
          ? {
              ...user,
              onboardingCompleted: true,
              ...flowPayload,
              onboarding: nextOnboarding,
            }
          : user;

        void trackLaunchEvent("personalization_started", {
          source: "onboarding",
          properties: {
            nextPath: body?.onboardingNextPath,
            hasPersonalizationJob: Boolean(personalizationJobId),
          },
        });
        setOnboardingCompleted(true);
        setOnboardingFlow(flowPayload);

        if (nextUser) {
          initializeUser(nextUser);
          queryClient.setQueryData(["me"], { data: nextUser });
        }

        await queryClient.invalidateQueries({ queryKey: ["me"] });
        resetOnboardingStore();
        navigate(
          body?.onboardingNextPath ??
            getUserOnboardingPersonalizingPath(personalizationJobId),
          { replace: true },
        );
      },
      onError: (error) => {
        const message = error?.response?.data?.message;
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || t("onboarding.review.submitError"),
        );
      },
    },
  });

  const handleComplete = React.useCallback(async () => {
    const state = useOnboardingStore.getState();
    const nextErrors = getReviewBlockingErrors(state, t);
    if (nextErrors.length > 0) {
      return;
    }

    await completeOnboarding({
      url: "/user/onboarding/complete",
      attributes: buildCompletePayload(state),
    });
  }, [completeOnboarding, t]);

  useOnboardingFooter(
    <Button
      type="button"
      className={cn(
        "h-12 w-full border-transparent bg-gradient-to-r",
        tone.buttonTone,
      )}
      size="lg"
      disabled={isPending || hasBlockingErrors}
      onClick={handleComplete}
    >
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
      {t("onboarding.review.generate")}
    </Button>,
  );

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.review.title")} />

        <div className={cn(ONBOARDING_GRID_SCROLL_AREA_CLASS, "gap-3")}>
          <div className="rounded-2xl border bg-background/90 p-4">
            <div className="flex items-start gap-3">
              {hasBlockingErrors ? (
                <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {hasBlockingErrors
                    ? t("onboarding.review.fixRequired")
                    : t("onboarding.review.ready")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("onboarding.review.description")}
                </p>
                {hasBlockingErrors ? (
                  <ul className="mt-2 grid gap-1 text-xs font-semibold text-destructive">
                    {map(blockingFixTargets, ({ message, step }) => (
                      <li
                        key={`${step}-${message}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>{message}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 shrink-0 px-2 text-[11px]"
                          onClick={() =>
                            navigate(`/user/onboarding/${step}`, {
                              state: reviewReturnState,
                            })
                          }
                        >
                          {t("onboarding.review.fix")}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          {recommendations.length > 0 ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <InfoIcon
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold">
                    {t("onboarding.review.recommendations.title")}
                  </p>
                  <ul className="mt-2 grid gap-1 text-xs font-semibold">
                    {map(recommendations, (recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <SummaryCard
            icon={UserIcon}
            title={t("onboarding.review.sections.profile")}
            editLabel={t("onboarding.review.edit")}
            onEdit={() =>
              navigate("/user/onboarding/name", { state: reviewReturnState })
            }
            items={[
              [
                t("onboarding.review.fields.name"),
                filter(
                  [onboardingState.firstName, onboardingState.lastName],
                  Boolean,
                ).join(" "),
              ],
              [
                t("onboarding.review.fields.gender"),
                getOnboardingValueLabel("gender", onboardingState.gender, t),
              ],
              [t("onboarding.review.fields.age"), onboardingState.age],
              [
                t("onboarding.review.fields.height"),
                onboardingState.height?.value
                  ? `${onboardingState.height.value} ${onboardingState.height.unit}`
                  : "",
              ],
              [
                t("onboarding.review.fields.currentWeight"),
                onboardingState.currentWeight?.value
                  ? `${onboardingState.currentWeight.value} ${onboardingState.currentWeight.unit}`
                  : "",
              ],
            ]}
          />

          <SummaryCard
            icon={TargetIcon}
            title={t("onboarding.review.sections.goals")}
            editLabel={t("onboarding.review.edit")}
            onEdit={() =>
              navigate("/user/onboarding/goal", { state: reviewReturnState })
            }
            items={[
              [
                t("onboarding.review.fields.goal"),
                getOnboardingValueLabel("goal", onboardingState.goal, t),
              ],
              [
                t("onboarding.review.fields.targetWeight"),
                onboardingState.targetWeight?.value
                  ? `${onboardingState.targetWeight.value} ${onboardingState.targetWeight.unit}`
                  : "",
              ],
              [
                t("onboarding.review.fields.weeklyPace"),
                onboardingState.weeklyPace
                  ? `${onboardingState.weeklyPace} kg`
                  : "",
              ],
              [
                t("onboarding.review.fields.activityLevel"),
                getOnboardingValueLabel(
                  "activityLevel",
                  onboardingState.activityLevel,
                  t,
                ),
              ],
            ]}
          />

          <SummaryCard
            icon={SaladIcon}
            title={t("onboarding.review.sections.nutrition")}
            editLabel={t("onboarding.review.edit")}
            onEdit={() =>
              navigate("/user/onboarding/meal-frequency", {
                state: reviewReturnState,
              })
            }
            items={[
              [
                t("onboarding.review.fields.mealFrequency"),
                onboardingState.mealFrequency,
              ],
              [
                t("onboarding.review.fields.allergies"),
                getCountSummary(
                  (onboardingState.allergyIds?.length ?? 0) +
                    (onboardingState.customAllergies?.length ?? 0),
                  t,
                ),
              ],
              [
                t("onboarding.review.fields.dietRequirements"),
                getCountSummary(
                  (onboardingState.dietRequirementIds?.length ?? 0) +
                    (onboardingState.customDietRequirements?.length ?? 0),
                  t,
                ),
              ],
            ]}
          />

          <SummaryCard
            icon={HeartPulseIcon}
            title={t("onboarding.review.sections.safety")}
            editLabel={t("onboarding.review.edit")}
            onEdit={() =>
              navigate("/user/onboarding/health-constraints", {
                state: reviewReturnState,
              })
            }
            items={[
              [
                t("onboarding.review.fields.healthConstraints"),
                getHealthConstraintsSummary(onboardingState, t),
              ],
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
