import React from "react";
import { BotIcon, SparklesIcon } from "lucide-react";
import { get } from "lodash";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachAi,
  useCoachPlanDraftGenerator,
} from "@/modules/coach/lib/hooks";

const resolveItems = (data) => get(data, "data.items", []);
const resolveMeta = (data) =>
  get(data, "data.meta", { total: 0, page: 1, pageSize: 10, totalPages: 1 });

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const CoachAiContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [type, setType] = React.useState("all");
  const [draftType, setDraftType] = React.useState("meal");
  const [goal, setGoal] = React.useState("");
  const [clientContext, setClientContext] = React.useState("");
  const [draftResult, setDraftResult] = React.useState(null);
  const queryParams = React.useMemo(
    () => ({
      ...(type !== "all" ? { type } : {}),
      sortBy: "createdAt",
      sortDir: "desc",
      page: 1,
      pageSize: 10,
    }),
    [type],
  );
  const { data, isLoading } = useCoachAi(queryParams);
  const { generatePlanDraft, isGenerating } = useCoachPlanDraftGenerator();
  const invocations = resolveItems(data);
  const meta = resolveMeta(data);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/ai", title: "AI" },
    ]);
  }, [setBreadcrumbs]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    try {
      const response = await generatePlanDraft({
        type: draftType,
        goal,
        clientContext,
      });
      setDraftResult(get(response, "data", response));
      toast.success("Plan draft tayyor");
    } catch {
      toast.error("Plan draft yaratib bo'lmadi");
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <BotIcon className="size-3.5" />
            Coach AI
          </p>
          <h1 className="text-3xl font-black tracking-tight">AI workspace</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            AI invocation history va meal/workout plan draft generator.
          </p>
        </div>
        <Badge variant="secondary">{meta.total} ta invocation</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" />
              Generate plan draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="draft-type">Plan turi</Label>
                <select
                  id="draft-type"
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  value={draftType}
                  onChange={(event) => setDraftType(event.target.value)}
                >
                  <option value="meal">Meal</option>
                  <option value="workout">Workout</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft-goal">Goal</Label>
                <Input
                  id="draft-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Masalan: 6 haftada vazn kamaytirish"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="draft-context">Client context</Label>
                <Textarea
                  id="draft-context"
                  value={clientContext}
                  onChange={(event) => setClientContext(event.target.value)}
                  placeholder="Yosh, cheklovlar, tajriba, jadval..."
                  required
                />
              </div>
              <Button type="submit" disabled={isGenerating}>
                Draft yaratish
              </Button>
            </form>

            {draftResult ? (
              <div className="mt-5 rounded-2xl border bg-muted/20 p-4">
                <p className="font-semibold">{draftResult.title || "Draft"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {draftResult.description}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {(draftResult.items || []).slice(0, 5).map((item, index) => (
                    <li key={`${item.name}-${index}`} className="rounded-xl bg-background px-3 py-2">
                      <span className="font-medium">{item.name}</span>
                      {item.details ? (
                        <span className="text-muted-foreground"> — {item.details}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>AI invocations</CardTitle>
            <select
              aria-label="Invocation type"
              className="h-9 rounded-xl border bg-background px-3 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="all">Barchasi</option>
              <option value="meal">Meal</option>
              <option value="workout">Workout</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="space-y-2 rounded-2xl border p-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              ))
            ) : invocations.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Hali AI invocation yo&apos;q
              </div>
            ) : (
              invocations.map((item) => (
                <div key={item.id} className="rounded-2xl border px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.goal || "Plan draft"}</p>
                    <Badge variant="outline">{item.type || "ai"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(item.createdAt)} • {item.itemCount || 0} item •{" "}
                    {item.latencyMs || 0}ms
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default CoachAiContainer;
