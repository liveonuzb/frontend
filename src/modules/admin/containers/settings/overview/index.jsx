import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  BrainCircuitIcon,
  CheckCircleIcon,
  DollarSignIcon,
  GlobeIcon,
  PercentIcon,
  RotateCcwIcon,
  SaveIcon,
  SettingsIcon,
  ShieldIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner.jsx";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const DEFAULT_SYSTEM_SETTINGS = {
  maintenanceMode: false,
  globalCommissionRate: 20,
  registrationEnabled: true,
  minPayoutAmount: 50000,
  appName: "LiveOn",
  mealPlanBudgetRules: {
    enabled: true,
    maxDailyCostMultiplier: 1.05,
    maxWeeklyCostMultiplier: 1.05,
    unknownMealCostFallback: 20000,
    unknownIngredientPriceFallbackPer100g: 5000,
    maxUnknownCostMealSlotsPerWeek: 2,
    preferCheapIngredients: true,
    cheapIngredientMaxPricePer100g: 6000,
  },
};

const FEATURE_LABELS = {
  personalization_result: "Personalizatsiya natijasi",
  personal_plan: "Meal + workout reja",
};

const emptyAiPrompt = {
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
  ...emptyAiPrompt,
  feature: get(setting, "feature", emptyAiPrompt.feature),
  title: get(setting, "title", ""),
  model: get(setting, "model", "gpt-4.1-mini"),
  systemPrompt: get(setting, "systemPrompt", ""),
  userPromptTemplate: get(setting, "userPromptTemplate", "") ?? "",
  temperature: get(setting, "temperature", "") ?? "",
  maxOutputTokens: get(setting, "maxOutputTokens", "") ?? "",
  inputTokenCostPer1M: get(setting, "inputTokenCostPer1M", 0),
  outputTokenCostPer1M: get(setting, "outputTokenCostPer1M", 0),
  notes: get(setting, "notes", "") ?? "",
});

const Index = () => {
  const { canManageSettings } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: isSettingsLoading } = useGetQuery({
    url: "/admin/settings",
    queryProps: { queryKey: ["admin", "settings"] },
  });
  const { data: aiData, isLoading: isAiLoading } = useGetQuery({
    url: "/admin/ai/overview",
    queryProps: { queryKey: ["admin", "ai", "overview"] },
  });

  const settings = get(settingsData, "data.data", DEFAULT_SYSTEM_SETTINGS);
  const aiOverview = get(aiData, "data.data", {});
  const aiSettings = get(aiOverview, "settings", []);
  const aiAnalytics = get(aiOverview, "analytics", {});
  const recentLogs = get(aiOverview, "recentLogs", []);
  const reviewQueue = get(aiOverview, "reviewQueue", []);

  const updateSettingsMutation = usePatchQuery({
    queryKey: ["admin", "settings"],
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["admin", "settings"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["admin", "dashboard"],
        });
      },
    },
  });
  const updateAiPromptMutation = usePatchQuery({
    queryKey: ["admin", "ai", "overview"],
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["admin", "ai", "overview"],
        });
      },
    },
  });
  const reviewAiLogMutation = usePatchQuery({
    queryKey: ["admin", "ai", "overview"],
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["admin", "ai", "overview"],
        });
      },
    },
  });

  const [formDraft, setFormDraft] = React.useState(null);
  const [promptDrafts, setPromptDrafts] = React.useState({});
  const formData = formDraft ?? settings;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/settings", title: "Sozlamalar" },
    ]);
  }, [setBreadcrumbs]);

  const handleSaveSettings = async () => {
    if (!canManageSettings) return;

    try {
      await updateSettingsMutation.mutateAsync({
        url: "/admin/settings",
        attributes: formData,
      });
      setFormDraft(null);
      toast.success("Sozlamalar saqlandi");
    } catch {
      toast.error("Sozlamalarni saqlab bo'lmadi");
    }
  };

  const handleSavePrompt = async (feature) => {
    if (!canManageSettings) return;
    const active = get(
      aiSettings.find((item) => get(item, "feature") === feature),
      "active",
      {},
    );
    const form = promptDrafts[feature] ?? normalizePromptForm(active);
    if (!form?.systemPrompt?.trim()) {
      toast.error("System prompt bo'sh bo'lmasligi kerak");
      return;
    }

    try {
      await updateAiPromptMutation.mutateAsync({
        url: "/admin/ai/prompt-settings",
        attributes: {
          ...form,
          feature,
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
      toast.success(`${FEATURE_LABELS[feature] ?? feature} prompt yangilandi`);
    } catch {
      toast.error("AI promptni saqlab bo'lmadi");
    }
  };

  const handleActivatePrompt = async (version) => {
    if (!canManageSettings || !version?.id) return;

    try {
      await updateAiPromptMutation.mutateAsync({
        url: `/admin/ai/prompt-settings/${version.id}/activate`,
        attributes: {},
      });
      toast.success(
        `${FEATURE_LABELS[version.feature] ?? version.feature} v${
          version.version
        } active qilindi`,
      );
    } catch {
      toast.error("Prompt versionni active qilib bo'lmadi");
    }
  };

  const handleReviewLog = async (log, reviewStatus) => {
    if (!canManageSettings || !log?.id) return;

    try {
      await reviewAiLogMutation.mutateAsync({
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

  const handleSystemChange = (key, value) => {
    setFormDraft((prev) => ({ ...(prev ?? settings), [key]: value }));
  };

  const handleBudgetRuleChange = (key, value) => {
    setFormDraft((prev) => {
      const base = prev ?? settings;
      return {
        ...base,
        mealPlanBudgetRules: {
          ...DEFAULT_SYSTEM_SETTINGS.mealPlanBudgetRules,
          ...(base.mealPlanBudgetRules ?? {}),
          [key]: value,
        },
      };
    });
  };

  const handlePromptChange = (feature, key, value) => {
    const active = get(
      aiSettings.find((item) => get(item, "feature") === feature),
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

  const isLoading = isSettingsLoading || isAiLoading;

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <SettingsIcon className="size-6 text-primary" />
              Tizim sozlamalari
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Platforma parametrlari, AI prompt versionlari va OpenAI xarajat
              analyticsini boshqarish.
            </p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending || !canManageSettings}
            className="gap-2 self-start"
          >
            <SaveIcon className="size-4" />
            Asosiy sozlamalarni saqlash
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-background">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GlobeIcon className="size-5 text-blue-500" />
                    <CardTitle>Asosiy sozlamalar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ilova nomi</Label>
                    <Input
                      value={formData.appName ?? ""}
                      onChange={(event) =>
                        handleSystemChange("appName", event.target.value)
                      }
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Global komissiya (%)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formData.globalCommissionRate ?? 0}
                        onChange={(event) =>
                          handleSystemChange(
                            "globalCommissionRate",
                            Number(event.target.value),
                          )
                        }
                        className="pr-10"
                        disabled={!canManageSettings}
                      />
                      <PercentIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimal payout (UZS)</Label>
                    <Input
                      type="number"
                      value={formData.minPayoutAmount ?? 0}
                      onChange={(event) =>
                        handleSystemChange(
                          "minPayoutAmount",
                          Number(event.target.value),
                        )
                      }
                      disabled={!canManageSettings}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <Label>Ro'yxatdan o'tish</Label>
                        <p className="text-xs text-muted-foreground">
                          Yangi user signup imkoniyati.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(formData.registrationEnabled)}
                        onCheckedChange={(value) =>
                          handleSystemChange("registrationEnabled", value)
                        }
                        disabled={!canManageSettings}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/30 p-3 dark:bg-red-950/10">
                      <div>
                        <Label className="text-red-700 dark:text-red-300">
                          Maintenance
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Ilovani vaqtincha yopish.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(formData.maintenanceMode)}
                        onCheckedChange={(value) =>
                          handleSystemChange("maintenanceMode", value)
                        }
                        disabled={!canManageSettings}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSignIcon className="size-5 text-emerald-500" />
                    <CardTitle>AI cost analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      label="30 kun request"
                      value={aiAnalytics.totalRequests ?? 0}
                    />
                    <Metric
                      label="Success rate"
                      value={`${aiAnalytics.successRate ?? 100}%`}
                    />
                    <Metric
                      label="Tokenlar"
                      value={aiAnalytics.totalTokens ?? 0}
                    />
                    <Metric
                      label="Taxminiy xarajat"
                      value={formatUsd(aiAnalytics.estimatedCostUsd)}
                    />
                    <Metric
                      label="Review queue"
                      value={aiAnalytics.pendingReviewRequests ?? 0}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {(get(aiAnalytics, "byFeature", []) ?? []).map((item) => (
                      <div
                        key={item.feature}
                        className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                      >
                        <span>
                          {FEATURE_LABELS[item.feature] ?? item.feature}
                        </span>
                        <span className="font-medium">
                          {item.requests} / {formatUsd(item.estimatedCostUsd)}
                        </span>
                      </div>
                    ))}
                    {get(aiAnalytics, "byFeature", []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Hali AI generation loglari yo'q.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="size-5 text-orange-500" />
                  <CardTitle>Meal plan budget rules</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center justify-between rounded-xl border p-3 md:col-span-2 xl:col-span-1">
                  <div>
                    <Label>Budget rules active</Label>
                    <p className="text-xs text-muted-foreground">
                      AI meal plan budget limitlarini majburiy qiladi.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(formData.mealPlanBudgetRules?.enabled)}
                    onCheckedChange={(value) =>
                      handleBudgetRuleChange("enabled", value)
                    }
                    disabled={!canManageSettings}
                  />
                </div>
                <Field
                  label="Daily max multiplier"
                  type="number"
                  value={formData.mealPlanBudgetRules?.maxDailyCostMultiplier}
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleBudgetRuleChange(
                      "maxDailyCostMultiplier",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Weekly max multiplier"
                  type="number"
                  value={formData.mealPlanBudgetRules?.maxWeeklyCostMultiplier}
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleBudgetRuleChange(
                      "maxWeeklyCostMultiplier",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Unknown meal fallback"
                  type="number"
                  value={formData.mealPlanBudgetRules?.unknownMealCostFallback}
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleBudgetRuleChange(
                      "unknownMealCostFallback",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Unknown ingredient / 100g"
                  type="number"
                  value={
                    formData.mealPlanBudgetRules
                      ?.unknownIngredientPriceFallbackPer100g
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleBudgetRuleChange(
                      "unknownIngredientPriceFallbackPer100g",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Max unknown meal slots"
                  type="number"
                  value={
                    formData.mealPlanBudgetRules
                      ?.maxUnknownCostMealSlotsPerWeek
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleBudgetRuleChange(
                      "maxUnknownCostMealSlotsPerWeek",
                      Number(value),
                    )
                  }
                />
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Label>Cheap ingredients</Label>
                    <p className="text-xs text-muted-foreground">
                      Arzon ingredientlarni ustunroq tanlash.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(
                      formData.mealPlanBudgetRules?.preferCheapIngredients,
                    )}
                    onCheckedChange={(value) =>
                      handleBudgetRuleChange("preferCheapIngredients", value)
                    }
                    disabled={!canManageSettings}
                  />
                </div>
                <Field
                  label="Cheap max / 100g"
                  type="number"
                  value={
                    formData.mealPlanBudgetRules?.cheapIngredientMaxPricePer100g
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleBudgetRuleChange(
                      "cheapIngredientMaxPricePer100g",
                      Number(value),
                    )
                  }
                />
              </CardContent>
            </Card>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {aiSettings.map((item) => {
                const feature = get(item, "feature");
                const active = get(item, "active", {});
                const form =
                  promptDrafts[feature] ?? normalizePromptForm(active);

                return (
                  <Card key={feature}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <BrainCircuitIcon className="size-5 text-primary" />
                          <div>
                            <CardTitle>
                              {FEATURE_LABELS[feature] ?? feature}
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Active version: v{get(active, "version", 0)} ·{" "}
                              {get(active, "isDefault") ? "default" : "custom"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{form.model}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field
                          label="Title"
                          value={form.title}
                          disabled={!canManageSettings}
                          onChange={(value) =>
                            handlePromptChange(feature, "title", value)
                          }
                        />
                        <Field
                          label="Model"
                          value={form.model}
                          disabled={!canManageSettings}
                          onChange={(value) =>
                            handlePromptChange(feature, "model", value)
                          }
                        />
                        <Field
                          label="Input $ / 1M tokens"
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
                        <Field
                          label="Output $ / 1M tokens"
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

                      <div className="space-y-2">
                        <Label>System prompt</Label>
                        <Textarea
                          value={form.systemPrompt}
                          onChange={(event) =>
                            handlePromptChange(
                              feature,
                              "systemPrompt",
                              event.target.value,
                            )
                          }
                          className="min-h-40 font-mono text-xs"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Qo'shimcha user instructions</Label>
                        <Textarea
                          value={form.userPromptTemplate}
                          onChange={(event) =>
                            handlePromptChange(
                              feature,
                              "userPromptTemplate",
                              event.target.value,
                            )
                          }
                          className="min-h-24"
                          disabled={!canManageSettings}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Saqlash yangi version yaratadi va uni active qiladi.
                        </p>
                        <Button
                          onClick={() => handleSavePrompt(feature)}
                          disabled={
                            updateAiPromptMutation.isPending ||
                            !canManageSettings
                          }
                          className="gap-2"
                        >
                          <SaveIcon className="size-4" />
                          Version saqlash
                        </Button>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Version history</p>
                        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                          {(get(item, "versions", []) ?? []).map((version) => (
                            <div
                              key={version.id}
                              className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">
                                    v{version.version}
                                  </span>
                                  <Badge
                                    variant={
                                      version.isActive
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {version.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {version.model}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {version.title}
                                </p>
                              </div>
                              {!version.isActive ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  disabled={
                                    updateAiPromptMutation.isPending ||
                                    !canManageSettings
                                  }
                                  onClick={() => handleActivatePrompt(version)}
                                >
                                  <RotateCcwIcon className="size-4" />
                                  Rollback
                                </Button>
                              ) : null}
                            </div>
                          ))}
                          {get(item, "versions", []).length === 0 ? (
                            <p className="rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                              Hali custom version yo'q. Default prompt
                              ishlayapti.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="size-5 text-amber-500" />
                  <CardTitle>AI review queue</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {reviewQueue.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border p-3 text-sm lg:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {FEATURE_LABELS[log.feature] ?? log.feature}
                        </p>
                        <Badge variant="outline">v{log.promptVersion ?? 0}</Badge>
                        <Badge variant="secondary">{log.reviewStatus}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {log.model} ·{" "}
                        {new Date(log.createdAt).toLocaleString("uz-UZ")}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sabab: {log.reviewReason || log.error || "Tekshiruv kerak"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={
                          reviewAiLogMutation.isPending || !canManageSettings
                        }
                        onClick={() => handleReviewLog(log, "approved")}
                      >
                        <CheckCircleIcon className="size-4 text-emerald-500" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={
                          reviewAiLogMutation.isPending || !canManageSettings
                        }
                        onClick={() => handleReviewLog(log, "rejected")}
                      >
                        <XCircleIcon className="size-4 text-red-500" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {reviewQueue.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                    <CheckCircleIcon className="mt-0.5 size-5 text-emerald-500" />
                    <p className="text-sm text-muted-foreground">
                      Review kutayotgan AI loglar yo'q.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldIcon className="size-5 text-amber-500" />
                  <CardTitle>Recent AI logs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 gap-2 rounded-xl border p-3 text-sm md:grid-cols-[1fr_auto_auto_auto_auto]"
                  >
                    <div>
                      <p className="font-medium">
                        {FEATURE_LABELS[log.feature] ?? log.feature}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.model} · v{log.promptVersion ?? 0} ·{" "}
                        {new Date(log.createdAt).toLocaleString("uz-UZ")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        log.status === "success" ? "secondary" : "destructive"
                      }
                      className="justify-self-start"
                    >
                      {log.status}
                    </Badge>
                    <Badge variant="outline" className="justify-self-start">
                      {log.reviewStatus ?? "not_required"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {log.totalTokens} tokens
                    </span>
                    <span className="font-medium">
                      {formatUsd(log.estimatedCostUsd)}
                    </span>
                  </div>
                ))}
                {recentLogs.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                    <AlertTriangleIcon className="mt-0.5 size-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Hali AI generation loglari mavjud emas.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-xl border bg-muted/20 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-semibold">{value}</p>
  </div>
);

const Field = ({ label, value, onChange, disabled, type = "text" }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input
      type={type}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  </div>
);

export default Index;
