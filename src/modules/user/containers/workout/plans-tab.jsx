import React from "react";
import { filter, find, values, get } from "lodash";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { useLanguageStore } from "@/store";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  DumbbellIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

const resolveText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = String(get(translations, language, "")).trim();
    if (direct) return direct;

    const uzText = String(get(translations, "uz", "")).trim();
    if (uzText) return uzText;

    const enText = String(get(translations, "en", "")).trim();
    if (enText) return enText;

    const ruText = String(get(translations, "ru", "")).trim();
    if (ruText) return ruText;

    const firstValue = find(values(translations), (value) =>
      String(value ?? "").trim(),
    );
    if (firstValue) return String(firstValue).trim();
  }

  return String(fallback ?? "").trim();
};

export default function PlansTab({
  plans = [],
  templates = [],
  activePlan,
  onDeletePlan,
  onEditPlan,
  onStartPlan,
  onOpenPlanBuilder,
  onStartSession,
  isRemovingPlan = false,
}) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const userPlans = React.useMemo(() => {
    return [...plans].sort((left, right) => {
      const leftPriority = get(left, "status") === "active" ? 0 : get(left, "status") === "draft" ? 1 : 2;
      const rightPriority =
        get(right, "status") === "active" ? 0 : get(right, "status") === "draft" ? 1 : 2;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return (
        new Date(get(right, "updatedAt") || get(right, "createdAt") || 0).getTime() -
        new Date(get(left, "updatedAt") || get(left, "createdAt") || 0).getTime()
      );
    });
  }, [plans]);

  return (
    <>
      <DrawerBody>
        <div className="space-y-6">
          {get(userPlans, "length") > 0 ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Saqlangan rejalar</h2>
                <p className="text-sm text-muted-foreground">
                  Kerakli rejani tanlang. Kartani bosish uni faol qiladi.
                </p>
              </div>

              <div className="grid gap-3">
                {userPlans.map((plan) => {
                  const isActive = get(plan, "id") === get(activePlan, "id");

                  return (
                  <div
                    key={get(plan, "id")}
                    className={cn(
                      "space-y-3 rounded-2xl border bg-background p-4 shadow-sm transition-all",
                      isActive
                        ? "border-primary bg-primary/5 shadow-primary/10"
                        : "hover:border-primary/25 hover:bg-accent/60",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() =>
                        isActive ? onStartSession() : onStartPlan(plan)
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {get(plan, "status") === "draft"
                                ? "Qoralama"
                                : get(plan, "status") === "active"
                                  ? "Faol"
                                  : get(plan, "status")}
                            </Badge>
                            {get(plan, "source") === "coach" ? (
                              <Badge variant="outline">Murabbiy</Badge>
                            ) : (
                              <Badge variant="outline">Meniki</Badge>
                            )}
                          </div>
                          <p className="truncate text-base font-black">
                            {get(plan, "name")}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {get(plan, "description") || "Saqlangan workout reja"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isActive ? (
                            <div className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                              Faol
                            </div>
                          ) : null}
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-2xl border",
                              isActive
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {isActive ? (
                              <CheckIcon className="size-4" />
                            ) : (
                              <ChevronRightIcon className="size-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Kun/hafta
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {get(plan, "daysPerWeek") || 0}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Davomiylik
                          </p>
                          <p className="mt-1 text-sm font-semibold">
                            {get(plan, "days") || 0} kun
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                      {get(plan, "source") !== "coach" ? (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            aria-label="Rejani tahrirlash"
                            onClick={() => onEditPlan(plan)}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={isRemovingPlan}
                            aria-label="Rejani o'chirish"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDeletePlan(plan)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </>
                      ) : null}
                      <Button
                        className="flex-1"
                        variant={isActive ? "outline" : "default"}
                        onClick={() =>
                          isActive ? onStartSession() : onStartPlan(plan)
                        }
                      >
                        <PlayIcon className="mr-1.5 size-4" />
                        {isActive ? "Sessiyani boshlash" : "Faollashtirish"}
                      </Button>
                    </div>
                  </div>
                )})}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Tayyor shablonlar</h2>
              <p className="text-sm text-muted-foreground">
                Maqsadingizga mos rejani tanlang.
              </p>
            </div>

            <div className="grid gap-3">
              {templates.map((plan) => {
                const title = resolveText(
                  get(plan, "translations"),
                  get(plan, "name"),
                  currentLanguage,
                );
                const description = resolveText(
                  get(plan, "descriptionTranslations"),
                  get(plan, "description"),
                  currentLanguage,
                );

                return (
                  <div
                    key={get(plan, "id")}
                    className="space-y-3 rounded-2xl border bg-background p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border p-3">
                        <DumbbellIcon className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {get(plan, "difficulty") ? (
                        <Badge variant="outline">
                          {get(plan, "difficulty")}
                        </Badge>
                      ) : null}
                      <Badge variant="outline">
                        <CalendarIcon className="mr-1 size-3.5" />
                        {get(plan, "daysPerWeek")} kun/hafta
                      </Badge>
                      <Badge variant="outline">{get(plan, "days")} kun</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => onStartPlan(plan)}>
                        <PlayIcon className="mr-1.5 size-4" />
                        Boshlash
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenPlanBuilder(plan)}
                      >
                        <PencilIcon className="mr-1.5 size-4" />
                        Moslashtirish
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button variant="outline" onClick={() => onOpenPlanBuilder(null)}>
          <PlusIcon className="mr-2 size-4" />
          Maxsus reja yaratish
        </Button>
      </DrawerFooter>
    </>
  );
}
