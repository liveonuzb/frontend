import React from "react";
import { ClockIcon } from "lucide-react";
import map from "lodash/map";
import NutritionCard from "../../ui/nutrition-card.jsx";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const imageMediaPattern = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i;
const videoMediaPattern = /\.(mp4|mov|webm)(\?.*)?$/i;

const getStepTitle = (step, fallback) => step.title || fallback;

const RecipeStepMedia = ({ step, title, rt }) => {
  if (!step.mediaUrl) {
    return null;
  }

  if (imageMediaPattern.test(step.mediaUrl)) {
    return (
      <img
        src={step.mediaUrl}
        alt={rt("steps.imageAlt", { title })}
        className="mt-3 aspect-video w-full rounded-[16px] object-cover"
        loading="lazy"
      />
    );
  }

  if (videoMediaPattern.test(step.mediaUrl)) {
    return (
      <video
        src={step.mediaUrl}
        controls
        aria-label={rt("steps.videoLabel", {
          title,
          defaultValue: `${title} video`,
        })}
        className="mt-3 aspect-video w-full rounded-[16px] object-cover"
      />
    );
  }

  return (
    <a
      href={step.mediaUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex text-sm font-black text-primary"
    >
      {rt("steps.media")}
    </a>
  );
};

const RecipeStepList = ({ instructions = [] }) => {
  const rt = useRecipeTranslation();

  return (
    <NutritionCard className="p-5">
      <h2 className="text-sm font-black uppercase text-muted-foreground">
        {rt("steps.title")}
      </h2>
      <div className="mt-3 space-y-3">
        {instructions.length ? (
          map(instructions, (step, index) => {
            const stepTitle = getStepTitle(step, rt("steps.fallbackTitle"));

            return (
              <article
                key={step.id || `${step.stepNumber}-${index}`}
                className="rounded-[20px] border border-border/60 bg-background/70 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-black">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                    {step.stepNumber || index + 1}
                  </span>
                  {stepTitle}
                  {step.durationMinutes || step.timerMinutes ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ClockIcon className="size-3" />
                      {rt("common.minutes", {
                        count: step.durationMinutes || step.timerMinutes,
                      })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body || step.text}
                </p>
                <RecipeStepMedia step={step} title={stepTitle} rt={rt} />
              </article>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">{rt("steps.empty")}</p>
        )}
      </div>
    </NutritionCard>
  );
};

export default RecipeStepList;
