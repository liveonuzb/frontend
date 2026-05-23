import React from "react";
import { filter, map, size, isArray, take } from "lodash";
import { AwardIcon, LockIcon, TrophyIcon } from "lucide-react";
import { Link } from "react-router";
import { useGetQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AchievementsWidget = () => {
  const { data } = useGetQuery({
    url: "/user/gamification/achievements",
    queryProps: {
      queryKey: ["user", "gamification", "achievements", "all"],
    },
  });

  const payload = getApiResponseData(data, []);
  const evaluated = isArray(payload) ? payload : [];
  const unlocked = filter(evaluated, { unlocked: true });
  const locked = filter(evaluated, { unlocked: false });
  const progress = size(unlocked);
  const total = size(evaluated);
  const unlockedPreview = take(unlocked, 5);
  const lockedPreview = take(locked, Math.max(0, 5 - size(unlockedPreview)));
  const previewItems = [...unlockedPreview, ...lockedPreview];
  const hiddenLockedCount = Math.max(0, size(locked) - size(lockedPreview));

  return (
    <Link to="/user/achievements" className="block h-full focus:outline-none">
      <Card className="group/card relative h-full overflow-hidden py-4 transition-all hover:-translate-y-0.5 hover:ring-primary/25 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/30">
        <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/10 blur-[24px] transition-colors group-hover/card:bg-primary/20" />
        <CardHeader className="relative z-10 px-4 pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex min-w-0 items-center gap-1.5 text-xs font-bold">
              <span className="rounded bg-primary/10 p-1 text-primary">
                <AwardIcon className="size-3" />
              </span>
              Achievements
            </CardTitle>
            <span className="shrink-0 text-xs font-bold text-primary">
              Ko&apos;rish
            </span>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-1 flex-col px-4 pb-4">
          <p className="text-xs font-medium text-muted-foreground">
            {progress}/{total} ta achievement olingan
          </p>

          <div className="mt-3 flex items-center gap-2 overflow-hidden">
            {size(previewItems) > 0 ? (
              map(previewItems, (item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl border text-2xl shadow-sm",
                    item.unlocked
                      ? "border-primary/15 bg-primary/10 text-primary"
                      : "border-border/50 bg-muted/30 text-muted-foreground",
                  )}
                  title={`${item.name} — ${item.description}`}
                >
                  {item.unlocked ? (
                    item.icon || "🏆"
                  ) : (
                    <LockIcon className="size-4" />
                  )}
                </div>
              ))
            ) : (
              <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-3 text-xs font-semibold text-muted-foreground">
                <TrophyIcon className="size-4" />
                Hali yutuq yo&apos;q
              </div>
            )}
            {hiddenLockedCount > 0 ? (
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/60 text-xs font-black text-foreground"
                aria-label={`${hiddenLockedCount} ta yopiq achievement`}
              >
                +{hiddenLockedCount}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default AchievementsWidget;
