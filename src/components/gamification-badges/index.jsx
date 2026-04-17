import React from "react";
import { SparklesIcon, ZapIcon, TrophyIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const GamificationBadges = ({ compact = false, className }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const progress = user?.levelProgress || 0;
  const streak = 3;

  // Level badge component
  const LevelBadge = ({ size = "md" }) => (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0",
        size === "sm" ? "size-8" : "size-12",
      )}
    >
      <div className="absolute inset-0 rounded-lg bg-primary rotate-45 shadow-lg shadow-primary/20" />
      <span
        className={cn(
          "relative leading-none font-black text-primary-foreground",
          size === "sm" ? "text-xs" : "text-lg",
        )}
      >
        {level}
      </span>
    </div>
  );

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-3 w-full max-w-[200px]", className)}
      >
        <LevelBadge size="sm" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-tighter text-primary">
              {t("profile.levelTitle")} {level}
            </span>
            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
              {xp} XP
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-primary/10" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-5 w-full", className)}>
      <div className="flex items-center gap-4 border border-border/40 bg-card p-4 rounded-[28px] shadow-sm">
        <LevelBadge />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-black uppercase tracking-tight">
                {t("profile.levelTitle")} {level}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("profile.totalXp", { count: xp })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary">
                <TrophyIcon className="size-3" />
                <span className="text-xs font-black">{progress}%</span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2.5 bg-primary/10" />
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">
            <span>{t("profile.progress")}</span>
            <span>{t("profile.nextLevel", { percent: 100 - progress })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border border-orange-500/10 bg-orange-500/5 px-5 py-3 rounded-2xl">
        <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-xl shadow-inner">
          🔥
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-orange-600">
            {t("profile.streakTitle", { count: streak })}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-tight text-orange-600/60">
            {t("profile.streakHint")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GamificationBadges;
