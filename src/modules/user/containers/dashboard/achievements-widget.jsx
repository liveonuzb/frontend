import React from "react";
import { filter, map, size } from "lodash";
import { AwardIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";
import { useGetQuery } from "@/hooks/api";

const AchievementsWidget = () => {
  const { data } = useGetQuery({
    url: "/gamification/achievements",
    queryProps: { queryKey: ["gamification", "achievements", "all"] },
  });

  const evaluated = Array.isArray(data?.data) ? data.data : [];
  const unlocked = filter(evaluated, { unlocked: true });
  const locked = filter(evaluated, { unlocked: false });
  const progress = size(unlocked);
  const total = size(evaluated);

  return (
    <div className="group relative h-full overflow-hidden rounded-[28px] border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.08] via-card to-card px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5">
      <div className="absolute inset-x-8 top-0 h-24 rounded-full bg-amber-500/8 blur-3xl transition-opacity group-hover:opacity-90" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-600/70">
              Yutuqlar
            </p>
            <h3 className="mt-1 inline-flex items-center gap-2 text-lg font-black tracking-tight">
              <AwardIcon className="size-4 text-amber-500" />
              Achievements
            </h3>
          </div>
          <Link
            to="/user/achievements"
            className="text-sm font-semibold text-amber-600 hover:underline"
          >
            {progress}/{total}
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {map(unlocked, (item) => (
            <div
              key={item.id}
              className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-lg transition-transform hover:scale-110"
              title={`${item.name} — ${item.description}`}
            >
              {item.icon || "🏆"}
            </div>
          ))}
          {map(locked.slice(0, 4), (item) => (
            <div
              key={item.id}
              className="flex size-10 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground"
              title={`${item.name} — ${item.description}`}
            >
              <LockIcon className="size-3.5" />
            </div>
          ))}
          {size(locked) > 4 ? (
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted/40 text-xs font-semibold text-muted-foreground">
              +{size(locked) - 4}
            </div>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          {size(locked) > 0 ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Keyingi yutuq
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {locked[0].icon || "🏆"} {locked[0].name}
              </p>
              <p className="text-xs text-muted-foreground">
                {locked[0].description}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center text-sm font-medium text-amber-600">
              Barcha yutuqlar ochilgan! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsWidget;
