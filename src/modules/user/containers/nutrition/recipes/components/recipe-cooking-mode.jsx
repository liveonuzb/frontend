import React from "react";
import { XIcon } from "lucide-react";
import toNumber from "lodash/toNumber";
import { Button } from "@/components/ui/button";
import NutritionCard from "../../ui/nutrition-card.jsx";
import RecipeTimer from "./recipe-timer.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const RecipeCookingMode = ({ instructions = [], onClose }) => {
  const rt = useRecipeTranslation();
  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = instructions[stepIndex] || null;

  if (!currentStep) {
    return null;
  }

  const timerMinutes = toNumber(
    currentStep.durationMinutes ?? currentStep.timerMinutes,
  );

  return (
    <NutritionCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase text-primary">
            {rt("steps.stepNumber", { count: stepIndex + 1 })}
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-foreground">
            {currentStep.title || rt("steps.fallbackTitle")}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={rt("cookingMode.close")}
          onClick={onClose}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {currentStep.body || currentStep.text}
      </p>
      <div className="mt-5">
        <RecipeTimer minutes={timerMinutes} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
        >
          {rt("cookingMode.previous")}
        </Button>
        <Button
          type="button"
          disabled={stepIndex >= instructions.length - 1}
          onClick={() =>
            setStepIndex((value) =>
              Math.min(instructions.length - 1, value + 1),
            )
          }
        >
          {rt("cookingMode.next")}
        </Button>
      </div>
    </NutritionCard>
  );
};

export default RecipeCookingMode;
