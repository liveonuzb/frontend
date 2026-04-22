import React from "react";
import { map, filter } from "lodash";
import { format } from "date-fns";
import {
  AwardIcon,
  LockIcon,
  CheckCircle2Icon,
  ZapIcon,
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import PageLoader from "@/components/page-loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { getApiResponseData } from "@/lib/api-response";

const CATEGORY_LABELS = {
  NUTRITION: "Ovqatlanish",
  WORKOUT: "Mashg'ulot",
  WATER: "Suv",
  SOCIAL: "Ijtimoiy",
  STREAK: "Streak",
  CHALLENGE: "Challenge",
  GENERAL: "Umumiy",
};

const getCategoryLabel = (category) => {
  const normalized = String(category ?? "").trim().toUpperCase();
  return (
    CATEGORY_LABELS[normalized] ??
    normalized.replaceAll("_", " ").trim() ??
    category
  );
};

const AchievementCard = ({ item, onClick }) => {
  const progressPct = item.threshold > 0
    ? Math.min(100, Math.round((item.progress / item.threshold) * 100))
    : 0;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
        item.unlocked
          ? "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-card"
          : "border-border/60 bg-card hover:border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl",
              item.unlocked ? "bg-amber-500/15" : "bg-muted/60 grayscale",
            )}
          >
            {item.icon || "🏆"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{item.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>
        {item.unlocked ? (
          <CheckCircle2Icon className="size-5 shrink-0 text-amber-500" />
        ) : (
          <LockIcon className="size-4 shrink-0 text-muted-foreground/50" />
        )}
      </div>

      {!item.unlocked && item.threshold > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {item.progress ?? 0}/{item.threshold}
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>
      ) : null}

      {item.unlocked ? (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <ZapIcon className="size-3" />
          <span>+{item.xpReward} XP</span>
          {item.unlockedAt ? (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {new Date(item.unlockedAt).toLocaleDateString("uz-UZ")}
              </span>
            </>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ZapIcon className="size-3" />
          <span>+{item.xpReward} XP</span>
        </div>
      )}
    </button>
  );
};

const XP_TYPE_LABELS = {
  ACHIEVEMENT: "Yutuq uchun",
  MEAL_LOG: "Ovqat yozuvi",
  WATER_LOG: "Suv yozuvi",
  WORKOUT_SESSION: "Mashg'ulot yozuvi",
  FRIEND_ACCEPTED: "Do'stlik qabul qilindi",
  CHALLENGE_JOINED: "Challengega qo'shilish",
  REFERRAL_REGISTRATION: "Referral bonus",
  REFERRAL_SUBSCRIPTION: "Referral komissiyasi",
  COACH_ENTRY_BONUS: "Coach referral bonusi",
  COACH_CLIENT_NEW: "Yangi mijoz bonusi",
  COACH_CLIENT_EXISTING: "Mavjud mijoz bonusi",
  WITHDRAWAL: "Yechib olish",
  OTHER: "XP o'zgarishi",
  DAILY_LOGIN: "Kunlik kirish",
  WORKOUT_COMPLETE: "Mashg'ulot",
  WATER_GOAL: "Suv maqsadi",
  FRIEND_ADD: "Do'st qo'shish",
  CHALLENGE_COMPLETE: "Challenge",
  STREAK: "Streak",
  MANUAL: "Qo'lda",
};

const XpHistorySection = () => {
  const [page, setPage] = React.useState(0);
  const limit = 15;
  const { data, isLoading } = useGetQuery({
    url: "/gamification/xp/history",
    params: { limit, offset: page * limit },
    queryProps: { queryKey: ["gamification", "xp-history", page] },
  });
  const payload = getApiResponseData(data, {});
  const items = payload?.items ?? [];
  const total = payload?.total ?? 0;
  const hasMore = (page + 1) * limit < total;

  if (!isLoading && items.length === 0 && page === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <ZapIcon className="size-4 text-amber-500" />
        XP tarixi
      </h2>
      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {isLoading && items.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Yuklanmoqda...
            </div>
          ) : (
            map(items, (entry) => {
              const isEarned = entry.amount > 0;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${isEarned ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-500"}`}
                    >
                      {isEarned ? (
                        <TrendingUpIcon className="size-4" />
                      ) : (
                        <TrendingDownIcon className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.note || XP_TYPE_LABELS[entry.type] || entry.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), "dd.MM.yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${isEarned ? "text-amber-500" : "text-red-500"}`}
                    >
                      {isEarned ? "+" : ""}{entry.amount} XP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.balance} XP
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      {(hasMore || page > 0) ? (
        <div className="flex items-center justify-center gap-3">
          {page > 0 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPage((p) => p - 1)}
            >
              Oldingi
            </button>
          ) : null}
          {hasMore ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => setPage((p) => p + 1)}
            >
              Ko&apos;proq ko&apos;rish
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const AchievementsPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/achievements", title: "Yutuqlar" },
    ]);
  }, [setBreadcrumbs]);

  const { data: categoriesData } = useGetQuery({
    url: "/gamification/achievements/categories",
    queryProps: { queryKey: ["gamification", "achievement-categories"] },
  });

  const { data: achievementsData, isLoading } = useGetQuery({
    url: "/gamification/achievements",
    params: selectedCategory ? { category: selectedCategory } : {},
    queryProps: {
      queryKey: ["gamification", "achievements", selectedCategory ?? "all"],
    },
  });

  const categories = Array.isArray(getApiResponseData(categoriesData, []))
    ? getApiResponseData(categoriesData, [])
    : [];
  const achievementsPayload = getApiResponseData(achievementsData, []);
  const achievements = Array.isArray(achievementsPayload)
    ? achievementsPayload
    : [];

  const unlockedCount = filter(achievements, { unlocked: true }).length;
  const totalCount = achievements.length;

  if (isLoading && achievements.length === 0) return <PageLoader />;

  return (
    <PageTransition mode="slide-up">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-24">
        {/* Header */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-500/20 via-primary/5 to-background">
          <CardContent className="px-5 py-6 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold">
                  <AwardIcon className="size-3.5 text-amber-500" />
                  Yutuqlar
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  Achievements
                </h1>
                <p className="text-sm text-muted-foreground">
                  Maqsadlarga erishib XP va yutuqlar qozonin.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Card className="rounded-2xl border bg-background/70 py-4 shadow-none">
                  <CardContent className="space-y-1 px-4">
                    <p className="text-xs text-muted-foreground">Ochilgan</p>
                    <p className="text-xl font-black text-amber-500">
                      {unlockedCount}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border bg-background/70 py-4 shadow-none">
                  <CardContent className="space-y-1 px-4">
                    <p className="text-xs text-muted-foreground">Jami</p>
                    <p className="text-xl font-black">{totalCount}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border bg-background/70 py-4 shadow-none">
                  <CardContent className="space-y-1 px-4">
                    <p className="text-xs text-muted-foreground">Foiz</p>
                    <p className="text-xl font-black">
                      {totalCount > 0
                        ? Math.round((unlockedCount / totalCount) * 100)
                        : 0}
                      %
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category filter */}
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              Barchasi
            </button>
            {map(categories, (cat) => (
              <button
                key={cat.category}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    cat.category === selectedCategory ? null : cat.category,
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                  selectedCategory === cat.category
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {getCategoryLabel(cat.category)}
                <span className="text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Achievements grid */}
        {achievements.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {map(achievements, (item) => (
              <AchievementCard
                key={item.id}
                item={item}
                onClick={setSelectedItem}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <StarIcon className="size-10 text-muted-foreground/30" />
              <p className="font-semibold">Yutuqlar topilmadi</p>
              <p className="text-sm text-muted-foreground">
                Bu kategoriyada hali yutuqlar yo&apos;q.
              </p>
            </CardContent>
          </Card>
        )}

        {/* XP History */}
        <XpHistorySection />
      </div>

      {/* Achievement detail drawer */}
      <Drawer
        direction="bottom"
        open={!!selectedItem}
        onOpenChange={(open) => { if (!open) setSelectedItem(null); }}
      >
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl",
                  selectedItem?.unlocked ? "bg-amber-500/15" : "bg-muted/60 grayscale",
                )}
              >
                {selectedItem?.icon || "🏆"}
              </div>
              <div>
                <DrawerTitle>{selectedItem?.name}</DrawerTitle>
                <DrawerDescription>
                  {getCategoryLabel(selectedItem?.category ?? "")}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            {selectedItem ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.description}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">XP mukofot</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-bold text-amber-500">
                      <ZapIcon className="size-4" />
                      +{selectedItem.xpReward} XP
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Holat</p>
                    <div className="mt-0.5">
                      {selectedItem.unlocked ? (
                        <Badge className="border-0 bg-amber-500/20 text-amber-600">
                          Ochilgan ✓
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Jarayonda
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {!selectedItem.unlocked && selectedItem.threshold > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">
                        {selectedItem.progress ?? 0} / {selectedItem.threshold}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        Math.round(
                          ((selectedItem.progress ?? 0) / selectedItem.threshold) * 100,
                        ),
                      )}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Yutuqni ochish uchun yana{" "}
                      {selectedItem.threshold - (selectedItem.progress ?? 0)} ta qoldiq.
                    </p>
                  </div>
                ) : null}

                {selectedItem.unlocked && selectedItem.unlockedAt ? (
                  <p className="text-sm text-muted-foreground">
                    Ochilgan sana:{" "}
                    <span className="font-medium text-foreground">
                      {new Date(selectedItem.unlockedAt).toLocaleDateString("uz-UZ")}
                    </span>
                  </p>
                ) : null}
              </>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default AchievementsPage;
