import React from "react";
import { CheckIcon, ListChecksIcon, XIcon } from "lucide-react";
import toNumber from "lodash/toNumber";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import NutritionCard from "../../ui/nutrition-card.jsx";
import RecipeTimer from "./recipe-timer.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const RecipeCookingMode = ({
  instructions = [],
  onClose,
  onFinish,
  onShowIngredients,
}) => {
  const rt = useRecipeTranslation();
  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = instructions[stepIndex] || null;

  if (!currentStep) {
    return null;
  }

  const timerMinutes = toNumber(
    currentStep.durationMinutes ?? currentStep.timerMinutes,
  );
  const isLastStep = stepIndex >= instructions.length - 1;
  const progress = Math.round(((stepIndex + 1) / instructions.length) * 100);
  const stepBody =
    currentStep.body || currentStep.text || currentStep.description || "";
  const stepMedia = currentStep.imageUrl || currentStep.mediaUrl || null;

  return (
    <NutritionCard className="flex min-h-[min(680px,calc(100svh-9rem))] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase text-primary">
            {stepIndex + 1}/{instructions.length} qadam
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-foreground md:text-3xl">
            {currentStep.title || rt("steps.fallbackTitle")}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onShowIngredients ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Masalliqlar"
              onClick={onShowIngredients}
            >
              <ListChecksIcon className="size-4" />
            </Button>
          ) : null}
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={rt("cookingMode.close")}
              onClick={onClose}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <Progress className="mt-4" value={progress} />
      <p className="mt-5 text-lg leading-8 text-foreground">
        {stepBody}
      </p>
      {stepMedia ? (
        <img
          src={stepMedia}
          alt={currentStep.title || rt("steps.fallbackTitle")}
          className="mt-5 aspect-video w-full rounded-2xl object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="mt-5">
        <RecipeTimer minutes={timerMinutes} />
      </div>
      <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-12"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
        >
          Oldingi
        </Button>
        <Button
          type="button"
          className="h-12"
          onClick={() => {
            if (isLastStep) {
              onFinish?.();
              return;
            }

            setStepIndex((value) =>
              Math.min(instructions.length - 1, value + 1),
            );
          }}
        >
          {isLastStep ? (
            <>
              <CheckIcon data-icon="inline-start" />
              Tugatish
            </>
          ) : (
            "Keyingi"
          )}
        </Button>
      </div>
    </NutritionCard>
  );
};

export default RecipeCookingMode;
