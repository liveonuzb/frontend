import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SaveIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const AI_QUERY_KEY = ["admin", "ai"];

const FEATURE_LABELS = {
  personalization_result: "Personalizatsiya natijasi",
  personal_plan: "Meal + workout reja",
};

const emptyPrompt = {
  feature: "personalization_result",
  title: "",
  model: "gpt-4.1-mini",
  systemPrompt: "",
  userPromptTemplate: "",
  temperature: "",
  maxOutputTokens: "",
  inputTokenCostPer1M: 0,
  outputTokenCostPer1M: 0,
  notes: "",
};

const hasOwn = (value, key) =>
  value &&
  typeof value === "object" &&
  Object.prototype.hasOwnProperty.call(value, key);

const unwrapAiResponse = (response, fallback) => {
  let payload = get(response, "data", response);

  for (let index = 0; index < 4; index += 1) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      break;
    }

    const keys = Object.keys(payload).filter((key) => key !== "meta");
    if (!hasOwn(payload, "data") || keys.length !== 1) {
      break;
    }

    payload = payload.data;
  }

  return payload ?? fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const numberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatUsd = (value) =>
  `$${Number(value ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })}`;

const normalizePromptForm = (setting) => ({
  ...emptyPrompt,
  feature: get(setting, "feature", emptyPrompt.feature),
  title: get(setting, "title", ""),
  model: get(setting, "model", emptyPrompt.model),
  systemPrompt: get(setting, "systemPrompt", ""),
  userPromptTemplate: get(setting, "userPromptTemplate", "") ?? "",
  temperature: get(setting, "temperature", "") ?? "",
  maxOutputTokens: get(setting, "maxOutputTokens", "") ?? "",
  inputTokenCostPer1M: get(setting, "inputTokenCostPer1M", 0),
  outputTokenCostPer1M: get(setting, "outputTokenCostPer1M", 0),
  notes: get(setting, "notes", "") ?? "",
});

const Metric = ({ label, value }) => (
  <Card size="sm" className="py-6">
    <CardContent>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </CardContent>
  </Card>
);

const PromptField = ({ label, value, onChange, disabled, type = "text" }) => (
  <div className="flex flex-col gap-2">
    <Label>{label}</Label>
    <Input
      type={type}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

const Index = () => {
  const { canManageSettings } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();
  const [promptDrafts, setPromptDrafts] = React.useState({});

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/ai", title: "AI Admin" },
    ]);
  }, [setBreadcrumbs]);

  const overviewQuery = useGetQuery({
    url: "/admin/ai/overview",
    queryProps: { queryKey: [...AI_QUERY_KEY, "overview"] },
  });
  const promptSettingsQuery = useGetQuery({
    url: "/admin/ai/prompt-settings",
    queryProps: { queryKey: [...AI_QUERY_KEY, "prompt-settings"] },
  });
  const analyticsQuery = useGetQuery({
    url: "/admin/ai/analytics",
    queryProps: { queryKey: [...AI_QUERY_KEY, "analytics"] },
  });
  const logsQuery = useGetQuery({
    url: "/admin/ai/generation-logs",
    params: { page: 1, pageSize: 20 },
    queryProps: { queryKey: [...AI_QUERY_KEY, "generation-logs"] },
  });
  const reviewQueueQuery = useGetQuery({
    url: "/admin/ai/generation-logs",
    params: { reviewStatus: "pending", page: 1, pageSize: 20 },
    queryProps: { queryKey: [...AI_QUERY_KEY, "review-queue"] },
  });

  const mutation = usePatchQuery({
    queryKey: AI_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: AI_QUERY_KEY });
      },
    },
  });

  const overview = unwrapAiResponse(overviewQuery.data, {});
  const promptSettings = toArray(
    unwrapAiResponse(promptSettingsQuery.data, get(overview, "settings", [])),
  );
  const analytics = unwrapAiResponse(
    analyticsQuery.data,
    get(overview, "analytics", {}),
  );
  const generationLogs = toArray(
    unwrapAiResponse(logsQuery.data, get(overview, "recentLogs", [])),
  );
  const reviewQueue = toArray(
    unwrapAiResponse(reviewQueueQuery.data, get(overview, "reviewQueue", [])),
  );
  const featureAnalytics = toArray(get(analytics, "byFeature", []));
  const isLoading =
    overviewQuery.isLoading ||
    promptSettingsQuery.isLoading ||
    analyticsQuery.isLoading;

  const handlePromptChange = (feature, key, value) => {
    const active = get(
      promptSettings.find((item) => get(item, "feature") === feature),
      "active",
      {},
    );
    setPromptDrafts((prev) => ({
      ...prev,
      [feature]: {
        ...(prev[feature] ?? normalizePromptForm(active)),
        feature,
        [key]: value,
      },
    }));
  };

  const handleSavePrompt = async (feature) => {
    if (!canManageSettings) return;
    const active = get(
      promptSettings.find((item) => get(item, "feature") === feature),
      "active",
      {},
    );
    const form = promptDrafts[feature] ?? normalizePromptForm(active);
    if (!form.systemPrompt?.trim()) {
      toast.error("System prompt bo'sh bo'lmasligi kerak");
      return;
    }

    try {
      await mutation.mutateAsync({
        url: "/admin/ai/prompt-settings",
        attributes: {
          ...form,
          temperature: numberOrNull(form.temperature),
          maxOutputTokens: numberOrNull(form.maxOutputTokens),
          inputTokenCostPer1M: Number(form.inputTokenCostPer1M ?? 0),
          outputTokenCostPer1M: Number(form.outputTokenCostPer1M ?? 0),
        },
      });
      setPromptDrafts((prev) => {
        const next = { ...prev };
        delete next[feature];
        return next;
      });
      toast.success(`${FEATURE_LABELS[feature] ?? feature} prompt saqlandi`);
    } catch {
      toast.error("AI promptni saqlab bo'lmadi");
    }
  };

  const handleActivatePrompt = async (version) => {
    if (!canManageSettings || !version?.id) return;

    try {
      await mutation.mutateAsync({
        url: `/admin/ai/prompt-settings/${version.id}/activate`,
        attributes: {},
      });
      toast.success(`v${version.version} active qilindi`);
    } catch {
      toast.error("Prompt versionni active qilib bo'lmadi");
    }
  };

  const handleReviewLog = async (log, reviewStatus) => {
    if (!canManageSettings || !log?.id) return;

    try {
      await mutation.mutateAsync({
        url: `/admin/ai/generation-logs/${log.id}/review`,
        attributes: { reviewStatus },
      });
      toast.success(
        reviewStatus === "approved"
          ? "AI log tasdiqlandi"
          : "AI log rad qilindi",
      );
    } catch {
      toast.error("AI review holatini yangilab bo'lmadi");
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <BrainCircuitIcon className="text-primary" />
              AI Admin
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Prompt versionlari, generation logs, review queue va AI xarajat
              monitoringi.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: AI_QUERY_KEY })}
          >
            <RefreshCwIcon data-icon="inline-start" />
            Yangilash
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-background">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex flex-col gap-5">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric label="30 kun request" value={analytics.totalRequests ?? 0} />
                <Metric label="Success rate" value={`${analytics.successRate ?? 100}%`} />
                <Metric label="Total tokens" value={analytics.totalTokens ?? 0} />
                <Metric label="Estimated cost" value={formatUsd(analytics.estimatedCostUsd)} />
              </div>
              <Card className="py-6">
                <CardHeader>
                  <CardTitle>Feature analytics</CardTitle>
                  <CardDescription>
                    Prompt feature bo'yicha request, token va xarajat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {featureAnalytics.map((item) => (
                        <TableRow key={item.feature}>
                          <TableCell>
                            {FEATURE_LABELS[item.feature] ?? item.feature}
                          </TableCell>
                          <TableCell>{item.requests ?? 0}</TableCell>
                          <TableCell>{item.successRate ?? 100}%</TableCell>
                          <TableCell>{item.totalTokens ?? 0}</TableCell>
                          <TableCell>{formatUsd(item.estimatedCostUsd)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prompts" className="grid gap-5 xl:grid-cols-2">
              {promptSettings.map((item) => {
                const feature = get(item, "feature");
                const active = get(item, "active", {});
                const form = promptDrafts[feature] ?? normalizePromptForm(active);

                return (
                  <Card key={feature} className="py-6">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>
                            {FEATURE_LABELS[feature] ?? feature}
                          </CardTitle>
                          <CardDescription>
                            Active version v{get(active, "version", 0)}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{form.model}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <PromptField
                          label="Title"
                          value={form.title}
                          disabled={!canManageSettings}
                          onChange={(value) =>
                            handlePromptChange(feature, "title", value)
                          }
                        />
                        <PromptField
                          label="Model"
                          value={form.model}
                          disabled={!canManageSettings}
                          onChange={(value) =>
                            handlePromptChange(feature, "model", value)
                          }
                        />
                        <PromptField
                          label="Input $ / 1M"
                          type="number"
                          value={form.inputTokenCostPer1M}
                          disabled={!canManageSettings}
                          onChange={(value) =>
                            handlePromptChange(
                              feature,
                              "inputTokenCostPer1M",
                              value,
                            )
                          }
                        />
                        <PromptField
                          label="Output $ / 1M"
                          type="number"
                          value={form.outputTokenCostPer1M}
                          disabled={!canManageSettings}
                          onChange={(value) =>
                            handlePromptChange(
                              feature,
                              "outputTokenCostPer1M",
                              value,
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>System prompt</Label>
                        <Textarea
                          value={form.systemPrompt}
                          disabled={!canManageSettings}
                          className="min-h-40 font-mono text-xs"
                          onChange={(event) =>
                            handlePromptChange(
                              feature,
                              "systemPrompt",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Qo'shimcha user instructions</Label>
                        <Textarea
                          value={form.userPromptTemplate}
                          disabled={!canManageSettings}
                          className="min-h-24"
                          onChange={(event) =>
                            handlePromptChange(
                              feature,
                              "userPromptTemplate",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Saqlash yangi active version yaratadi.
                        </p>
                        <Button
                          type="button"
                          disabled={mutation.isPending || !canManageSettings}
                          onClick={() => handleSavePrompt(feature)}
                        >
                          <SaveIcon data-icon="inline-start" />
                          Version saqlash
                        </Button>
                      </div>
                      <Separator />
                      <div className="flex flex-col gap-2">
                        {toArray(get(item, "versions", [])).map((version) => (
                          <div
                            key={version.id}
                            className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                  v{version.version}
                                </span>
                                <Badge
                                  variant={
                                    version.isActive ? "secondary" : "outline"
                                  }
                                >
                                  {version.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {version.model}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {version.title}
                              </p>
                            </div>
                            {!version.isActive ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={mutation.isPending || !canManageSettings}
                                onClick={() => handleActivatePrompt(version)}
                              >
                                <RotateCcwIcon data-icon="inline-start" />
                                Rollback
                              </Button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="review" className="flex flex-col gap-3">
              {reviewQueue.map((log) => (
                <Card key={log.id} size="sm" className="py-6">
                  <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {FEATURE_LABELS[log.feature] ?? log.feature}
                        </p>
                        <Badge variant="outline">v{log.promptVersion ?? 0}</Badge>
                        <Badge variant="secondary">{log.reviewStatus}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {log.model} · {new Date(log.createdAt).toLocaleString("uz-UZ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.reviewReason || log.error || "Tekshiruv kerak"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mutation.isPending || !canManageSettings}
                        onClick={() => handleReviewLog(log, "approved")}
                      >
                        <CheckCircleIcon data-icon="inline-start" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mutation.isPending || !canManageSettings}
                        onClick={() => handleReviewLog(log, "rejected")}
                      >
                        <XCircleIcon data-icon="inline-start" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {reviewQueue.length === 0 ? (
                <Card className="py-6">
                  <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircleIcon />
                    Review kutayotgan AI loglar yo'q.
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="logs" className="flex flex-col gap-3">
              <Card className="py-6">
                <CardHeader>
                  <CardTitle>Recent AI logs</CardTitle>
                  <CardDescription>
                    Oxirgi generation requestlari va review statuslari.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {FEATURE_LABELS[log.feature] ?? log.feature}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === "success"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.reviewStatus ?? "not_required"}</TableCell>
                          <TableCell>{log.totalTokens ?? 0}</TableCell>
                          <TableCell>{formatUsd(log.estimatedCostUsd)}</TableCell>
                          <TableCell>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString("uz-UZ")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {generationLogs.length === 0 ? (
                <Card className="py-6">
                  <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                    <AlertTriangleIcon />
                    Hali AI generation loglari mavjud emas.
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageTransition>
  );
};

export default Index;
