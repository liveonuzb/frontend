import React from "react";
import { filter, find, get, map, orderBy, values } from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CheckIcon,
  DumbbellIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWorkoutPlan from "@/hooks/app/use-workout-plan";
import { useLanguageStore, useBreadcrumbStore } from "@/store";
import { deriveWorkoutPlanMetrics } from "../utils";

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

const getSourceLabel = (plan) => {
  if (get(plan, "source") === "ai") return "AI";
  if (get(plan, "source") === "coach") return "Murabbiy";
  if (get(plan, "isTemplate")) return "Template";
  return "Manual";
};

const PlanSourceBadge = ({ plan }) => {
  const source = get(plan, "source");

  if (source === "ai") {
    return (
      <Badge variant="secondary">
        <SparklesIcon />
        AI
      </Badge>
    );
  }

  if (get(plan, "isTemplate")) {
    return <Badge variant="outline">Template</Badge>;
  }

  if (source === "coach") {
    return <Badge variant="outline">Murabbiy</Badge>;
  }

  return <Badge variant="outline">Manual</Badge>;
};

const PlanStats = ({ plan }) => (
  <div className="grid grid-cols-3 gap-2">
    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Kun/hafta
      </p>
      <p className="mt-1 font-semibold">{get(plan, "daysPerWeek") || 0}</p>
    </div>
    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Davomiylik
      </p>
      <p className="mt-1 font-semibold">{get(plan, "days") || 0} kun</p>
    </div>
    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Mashqlar
      </p>
      <p className="mt-1 font-semibold">{get(plan, "totalExercises") || 0}</p>
    </div>
  </div>
);

const WorkoutPlansPage = () => {
  const navigate = useNavigate();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    plans,
    templates,
    activePlan,
    startPlan,
    removePlan,
    isStartingPlan,
    isRemovingPlan,
  } = useWorkoutPlan();
  const [filterKey, setFilterKey] = React.useState("all");
  const [deletingPlan, setDeletingPlan] = React.useState(null);
  const normalizedPlans = React.useMemo(
    () =>
      orderBy(
        map(plans, (plan) => deriveWorkoutPlanMetrics(plan)),
        [
          (plan) => (get(plan, "status") === "active" ? 0 : 1),
          (plan) => new Date(get(plan, "updatedAt") || get(plan, "createdAt") || 0).getTime(),
        ],
        ["asc", "desc"],
      ),
    [plans],
  );
  const normalizedTemplates = React.useMemo(
    () => map(templates, (plan) => deriveWorkoutPlanMetrics({
      ...plan,
      isTemplate: true,
      status: "template",
    })),
    [templates],
  );
  const visiblePlans = React.useMemo(() => {
    if (filterKey === "templates") {
      return normalizedTemplates;
    }

    if (filterKey === "active") {
      return filter(normalizedPlans, (plan) => get(plan, "status") === "active");
    }

    if (filterKey === "draft") {
      return filter(normalizedPlans, (plan) => get(plan, "status") === "draft");
    }

    if (filterKey === "ai") {
      return filter(normalizedPlans, (plan) => get(plan, "source") === "ai");
    }

    return normalizedPlans;
  }, [filterKey, normalizedPlans, normalizedTemplates]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout", title: "Workout" },
      { url: "/user/workout/plans", title: "Mening rejalarim" },
    ]);
  }, [setBreadcrumbs]);

  const handleStartPlan = async (plan) => {
    try {
      const activatedPlan = await startPlan(plan);
      toast.success(`"${get(plan, "name", "Workout reja")}" boshlandi`);

      if (get(activatedPlan, "id")) {
        navigate(`/user/workout/plans/${get(activatedPlan, "id")}`);
      }
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Rejani boshlashda xatolik yuz berdi",
      );
    }
  };

  const handleDeletePlan = async () => {
    if (!get(deletingPlan, "id")) {
      return;
    }

    try {
      await removePlan(get(deletingPlan, "id"));
      toast.success("Workout reja o'chirildi");
      setDeletingPlan(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Workout rejani o'chirib bo'lmadi",
      );
    }
  };

  return (
    <PageTransition mode="slide-up">
      <div className="flex flex-col gap-6">
        <TrackingPageHeader
          title="Mening rejalarim"
          subtitle="Saqlangan, faol va AI orqali yaratilgan workout rejalar."
          hideTitleOnMobile={false}
          actions={
            <Button onClick={() => navigate("/user/workout/plans/create")}>
              <PlusIcon data-icon="inline-start" />
              Yangi reja
            </Button>
          }
        />

        <Tabs value={filterKey} onValueChange={setFilterKey}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
        </Tabs>

        {get(visiblePlans, "length") > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {map(visiblePlans, (plan) => {
              const isTemplate = get(plan, "isTemplate");
              const isActive = get(plan, "id") === get(activePlan, "id");
              const title = isTemplate
                ? resolveText(
                    get(plan, "translations"),
                    get(plan, "name"),
                    currentLanguage,
                  )
                : get(plan, "name");
              const description = isTemplate
                ? resolveText(
                    get(plan, "descriptionTranslations"),
                    get(plan, "description"),
                    currentLanguage,
                  )
                : get(plan, "description") || "Saqlangan workout reja";

              return (
                <Card key={`${isTemplate ? "template" : "plan"}-${get(plan, "id")}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="truncate">{title}</span>
                      {isActive ? (
                        <Badge variant="secondary">
                          <CheckIcon />
                          Faol
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                    <CardAction>
                      <PlanSourceBadge plan={plan} />
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <PlanStats plan={plan} />
                  </CardContent>
                  <CardFooter className="flex-wrap gap-2">
                    {isTemplate ? (
                      <>
                        <Button
                          disabled={isStartingPlan}
                          onClick={() => handleStartPlan(plan)}
                        >
                          <PlayIcon data-icon="inline-start" />
                          Boshlash
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate("/user/workout/plans/create", {
                              state: { initialPlan: plan },
                            })
                          }
                        >
                          <PencilIcon data-icon="inline-start" />
                          Moslashtirish
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/user/workout/plans/${get(plan, "id")}`)}
                        >
                          <EyeIcon data-icon="inline-start" />
                          Ko'rish
                        </Button>
                        <Button
                          variant={isActive ? "outline" : "default"}
                          disabled={isStartingPlan}
                          onClick={() => handleStartPlan(plan)}
                        >
                          <PlayIcon data-icon="inline-start" />
                          {isActive ? "Sessiya" : "Boshlash"}
                        </Button>
                        {get(plan, "source") !== "coach" ? (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              aria-label={`${title} rejasini tahrirlash`}
                              onClick={() =>
                                navigate(`/user/workout/plans/edit/${get(plan, "id")}`)
                              }
                            >
                              <PencilIcon />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={isRemovingPlan}
                              aria-label={`${title} rejasini o'chirish`}
                              onClick={() => setDeletingPlan(plan)}
                            >
                              <Trash2Icon />
                            </Button>
                          </>
                        ) : null}
                      </>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Reja topilmadi</CardTitle>
              <CardDescription>
                {filterKey === "all"
                  ? "Hali workout reja yaratmagansiz."
                  : `${filterKey} filteri bo'yicha reja yo'q.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
                <DumbbellIcon className="mx-auto size-10 text-muted-foreground/40" />
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Manual reja tuzing yoki AI yordamida maqsadingiz, darajangiz va
                  jihozlaringizga mos reja yarating.
                </p>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={() => navigate("/user/workout/plans/create")}>
                <PlusIcon data-icon="inline-start" />
                Yangi reja
              </Button>
              <Button variant="outline" onClick={() => setFilterKey("templates")}>
                Template ko'rish
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      <AlertDialog
        open={Boolean(deletingPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPlan(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Workout rejani o'chirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {get(deletingPlan, "name")
                ? `"${get(deletingPlan, "name")}" rejasi butunlay o'chiriladi.`
                : "Tanlangan workout reja butunlay o'chiriladi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingPlan}>
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemovingPlan}
              onClick={handleDeletePlan}
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default WorkoutPlansPage;
