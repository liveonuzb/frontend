import React from "react";
import toNumber from "lodash/toNumber";
import { Button } from "@/components/ui/button";
import useRecipeTranslation from "../lib/recipe-i18n.js";

const formatSeconds = (value) => {
  const seconds = Math.max(0, toNumber(value) || 0);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
};

const RecipeTimer = ({ minutes }) => {
  const rt = useRecipeTranslation();
  const initialSeconds = Math.max(0, Math.round((toNumber(minutes) || 0) * 60));
  const [timer, setTimer] = React.useState(() => ({
    initialSeconds,
    seconds: initialSeconds,
    isRunning: false,
  }));

  const effectiveTimer =
    timer.initialSeconds === initialSeconds
      ? timer
      : { initialSeconds, seconds: initialSeconds, isRunning: false };
  const { seconds, isRunning } = effectiveTimer;

  React.useEffect(() => {
    if (!isRunning || seconds <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimer((current) => {
        const base =
          current.initialSeconds === initialSeconds
            ? current
            : { initialSeconds, seconds: initialSeconds, isRunning: false };

        return {
          ...base,
          seconds: Math.max(0, base.seconds - 1),
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [initialSeconds, isRunning, seconds]);

  if (!initialSeconds) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="rounded-[18px] border border-border/60 bg-background/70 px-4 py-2 text-lg font-black tabular-nums text-foreground">
        {formatSeconds(seconds)}
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-9"
        onClick={() =>
          setTimer((current) => {
            const base =
              current.initialSeconds === initialSeconds
                ? current
                : { initialSeconds, seconds: initialSeconds, isRunning: false };

            return {
              ...base,
              isRunning: !base.isRunning,
            };
          })
        }
      >
        {isRunning ? rt("timer.pause") : rt("timer.start")}
      </Button>
    </div>
  );
};

export default RecipeTimer;
