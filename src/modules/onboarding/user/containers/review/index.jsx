import { isArray, join } from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  DumbbellIcon,
  HeartPulseIcon,
  Loader2Icon,
  SaladIcon,
  TargetIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePostQuery } from "@/hooks/api";
import { getUserOnboardingPersonalizingPath } from "@/lib/app-paths";
import {
  normalizeUserOnboarding,
  toUserOnboardingPayload,
} from "@/lib/user-onboarding";
import { cn } from "@/lib/utils";
import { useAuthStore, useOnboardingStore } from "@/store";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const tone = ONBOARDING_ACCENTS.green;

const buildCompletePayload = (state) => ({
  ...toUserOnboardingPayload({
    firstName: state.firstName,
    lastName: state.lastName,
    gender: state.gender,
    age: state.age,
    height: state.height,
    currentWeight: state.currentWeight,
    goal: state.goal,
    weightGoal: state.weightGoal,
    goals: state.goals,
    targetWeight: state.targetWeight,
    weeklyPace: state.weeklyPace,
    activityLevel: state.activityLevel,
    weeklyWorkoutCount: state.weeklyWorkoutCount,
    workoutExperience: state.workoutExperience,
    mealFrequency: state.mealFrequency,
    foodBudgetTier: state.foodBudgetTier,
    workoutLocation: state.workoutLocation,
    equipmentIds: state.equipmentIds,
    customEquipment: state.customEquipment,
    workoutBodyPartIds: state.workoutBodyPartIds,
    customWorkoutBodyParts: state.customWorkoutBodyParts,
    allergyIds: state.allergyIds?.length
      ? state.allergyIds
      : state.allergyIngredientIds,
    allergyIngredientIds: state.allergyIngredientIds,
    customAllergies: state.customAllergies,
    dietRequirementIds: state.dietRequirementIds,
    customDietRequirements: state.customDietRequirements,
    preferredCuisineIds: state.preferredCuisineIds,
    customPreferredCuisines: state.customPreferredCuisines,
    dislikedFoodIds: state.dislikedFoodIds,
    customDislikedFoods: state.customDislikedFoods,
    preferredIngredientIds: state.preferredIngredientIds,
    customPreferredIngredients: state.customPreferredIngredients,
    dislikedIngredientIds: state.dislikedIngredientIds,
    customDislikedIngredients: state.customDislikedIngredients,
    nutritionPreferenceKeys: state.nutritionPreferenceKeys,
    healthConstraints: state.healthConstraints,
    customHealthConstraints: state.customHealthConstraints,
  }),
  completed: true,
});

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const validateRequired = (state, t) => {
  const errors = [];
  if (!hasValue(state.firstName))
    errors.push(t("onboarding.review.missing.name"));
  if (!hasValue(state.gender))
    errors.push(t("onboarding.review.missing.gender"));
  if (!hasValue(state.age)) errors.push(t("onboarding.review.missing.age"));
  if (!hasValue(state.height?.value)) {
    errors.push(t("onboarding.review.missing.height"));
  }
  if (!hasValue(state.currentWeight?.value)) {
    errors.push(t("onboarding.review.missing.currentWeight"));
  }
  if (!hasValue(state.goal) && !hasValue(state.weightGoal)) {
    errors.push(t("onboarding.review.missing.goal"));
  }
  if (!hasValue(state.targetWeight?.value)) {
    errors.push(t("onboarding.review.missing.targetWeight"));
  }
  if (!hasValue(state.weeklyPace)) {
    errors.push(t("onboarding.review.missing.weeklyPace"));
  }
  if (!hasValue(state.activityLevel)) {
    errors.push(t("onboarding.review.missing.activityLevel"));
  }
  if (!hasValue(state.weeklyWorkoutCount)) {
    errors.push(t("onboarding.review.missing.weeklyWorkoutCount"));
  }
  if (!hasValue(state.workoutExperience)) {
    errors.push(t("onboarding.review.missing.workoutExperience"));
  }
  if (!hasValue(state.mealFrequency)) {
    errors.push(t("onboarding.review.missing.mealFrequency"));
  }
  const healthConstraintsCompleted =
    Array.isArray(state.completedUserOnboardingSteps) &&
    state.completedUserOnboardingSteps.includes("health-constraints");
  if (
    !hasValue(state.healthConstraints) &&
    !hasValue(state.customHealthConstraints) &&
    !healthConstraintsCompleted
  ) {
    errors.push(t("onboarding.review.missing.healthConstraints"));
  }
  return errors;
};

const SummaryCard = ({ icon: Icon, title, items }) => (
  <section className="rounded-2xl border bg-background/90 p-4">
    <div className="mb-3 flex items-center gap-2">
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
    <div className="grid gap-2 text-sm">
      {items.map(([label, value]) => (
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

const resolveBudgetLabel = (state, t) => {
  if (state.foodBudgetTier) {
    return t(`onboarding.foodBudget.tiers.${state.foodBudgetTier}.summary`);
  }

  if (state.foodBudget) {
    return `${state.foodBudget} ${state.budgetCurrency || "UZS"}`;
  }

  return "";
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const onboardingState = useOnboardingStore();
  const resetOnboardingStore = useOnboardingStore((state) => state.reset);
  const { initializeUser, setOnboardingCompleted, setOnboardingFlow, user } =
    useAuthStore();
  const [errors, setErrors] = React.useState([]);

  useOnboardingAutoSave("user", "review");

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
    const nextErrors = validateRequired(state, t);
    setErrors(nextErrors);
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
      disabled={isPending}
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
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.review.title")} />

        <div className="grid flex-1 content-start gap-3 overflow-y-auto pb-5">
          <div className="rounded-2xl border bg-background/90 p-4">
            <div className="flex items-start gap-3">
              {errors.length > 0 ? (
                <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {errors.length > 0
                    ? t("onboarding.review.fixRequired")
                    : t("onboarding.review.ready")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("onboarding.review.description")}
                </p>
                {errors.length > 0 ? (
                  <ul className="mt-2 grid gap-1 text-xs font-semibold text-destructive">
                    {errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <SummaryCard
            icon={UserIcon}
            title={t("onboarding.review.sections.profile")}
            items={[
              [
                t("onboarding.review.fields.name"),
                [onboardingState.firstName, onboardingState.lastName]
                  .filter(Boolean)
                  .join(" "),
              ],
              [t("onboarding.review.fields.gender"), onboardingState.gender],
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
            items={[
              [t("onboarding.review.fields.goal"), onboardingState.goal],
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
                onboardingState.activityLevel,
              ],
            ]}
          />

          <SummaryCard
            icon={SaladIcon}
            title={t("onboarding.review.sections.nutrition")}
            items={[
              [
                t("onboarding.review.fields.mealFrequency"),
                onboardingState.mealFrequency,
              ],
              [
                t("onboarding.review.fields.foodBudget"),
                resolveBudgetLabel(onboardingState, t),
              ],
              [
                t("onboarding.review.fields.allergies"),
                String(
                  (onboardingState.allergyIds?.length ?? 0) +
                    (onboardingState.customAllergies?.length ?? 0),
                ),
              ],
              [
                t("onboarding.review.fields.dietRequirements"),
                String(
                  (onboardingState.dietRequirementIds?.length ?? 0) +
                    (onboardingState.customDietRequirements?.length ?? 0),
                ),
              ],
              [
                t("onboarding.review.fields.preferredCuisines"),
                String(
                  (onboardingState.preferredCuisineIds?.length ?? 0) +
                    (onboardingState.customPreferredCuisines?.length ?? 0),
                ),
              ],
            ]}
          />

          <SummaryCard
            icon={HeartPulseIcon}
            title={t("onboarding.review.sections.safety")}
            items={[
              [
                t("onboarding.review.fields.healthConstraints"),
                String(
                  (onboardingState.healthConstraints?.filter(
                    (item) => item !== "none",
                  )?.length ?? 0) +
                    (onboardingState.customHealthConstraints?.length ?? 0),
                ),
              ],
            ]}
          />

          <SummaryCard
            icon={DumbbellIcon}
            title={t("onboarding.review.sections.workout")}
            items={[
              [
                t("onboarding.review.fields.weeklyWorkoutCount"),
                onboardingState.weeklyWorkoutCount,
              ],
              [
                t("onboarding.review.fields.workoutExperience"),
                onboardingState.workoutExperience,
              ],
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
