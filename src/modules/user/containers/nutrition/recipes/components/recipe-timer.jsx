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
  const [seconds, setSeconds] = React.useState(initialSeconds);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  React.useEffect(() => {
    if (!isRunning || seconds <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, seconds]);

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
        onClick={() => setIsRunning((value) => !value)}
      >
        {isRunning ? rt("timer.pause") : rt("timer.start")}
      </Button>
    </div>
  );
};

export default RecipeTimer;
