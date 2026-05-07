import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  BellIcon,
  BrainCircuitIcon,
  DollarSignIcon,
  DumbbellIcon,
  DropletsIcon,
  FlameIcon,
  GlobeIcon,
  PercentIcon,
  SaveIcon,
  SettingsIcon,
  ToggleRightIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
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
  healthFormulaSettings: {
    calorieFormula: "mifflin_st_jeor",
    deficitPercent: 15,
    surplusPercent: 10,
    minCaloriesFemale: 1200,
    minCaloriesMale: 1500,
    activityMultiplierSource: "profile",
    waterMlPerKg: 35,
    workoutExtraWaterMl: 500,
    hotWeatherExtraWaterMl: 300,
    minDailyWaterMl: 1500,
    maxDailyWaterMl: 4500,
  },
  notificationTemplates: {
    waterReminder: "Bugungi suv normangizni to'ldirishni unutmang.",
    mealReminder: "Rejadagi ovqatlanish vaqtini o'tkazib yubormang.",
    workoutReminder: "Bugungi mashg'ulot rejangiz tayyor.",
    progressReminder: "Progressingizni yangilab qo'ying.",
  },
  aiRuleReferences: {
    mealPlanPromptFeature: "personal_plan",
    workoutPlanPromptFeature: "personal_plan",
    safetyRulesSource: "health_constraints",
    budgetRulesSource: "mealPlanBudgetRules",
  },
  appModeDefaults: {
    defaultMode: "madagascar",
    enabledModes: ["focus", "zen", "madagascar"],
  },
  typedFeatureFlags: {
    aiPlanGeneration: true,
    foodPhotoAnalysis: true,
    coachMode: true,
    gamification: true,
    telegramBot: true,
  },
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
  workoutPlanGenerationSettings: {
    enabled: true,
    defaultPlanDays: 28,
    minDaysPerWeek: 2,
    defaultDaysPerWeek: 4,
    maxDaysPerWeek: 6,
    targetRestDaysPerWeek: 2,
    calorieEstimatePolicy: "tracking_defaults",
    safetyRulesRequired: true,
    progressionEnabled: true,
    deloadEveryWeeks: 4,
  },
};

const TYPED_FEATURE_FLAGS = [
  ["aiPlanGeneration", "AI plan generation"],
  ["foodPhotoAnalysis", "Food photo analysis"],
  ["coachMode", "Coach mode"],
  ["gamification", "Gamification"],
  ["telegramBot", "Telegram bot"],
];

const APP_MODES = [
  ["focus", "Focus"],
  ["zen", "Zen"],
  ["madagascar", "Madagascar"],
];

const Index = () => {
  const { canManageSettings } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: isSettingsLoading } = useGetQuery({
    url: "/admin/settings",
    queryProps: { queryKey: ["admin", "settings"] },
  });

  const settings = get(settingsData, "data.data", DEFAULT_SYSTEM_SETTINGS);

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

  const [formDraft, setFormDraft] = React.useState(null);
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

  const handleSystemChange = (key, value) => {
    setFormDraft((prev) => ({ ...(prev ?? settings), [key]: value }));
  };

  const handleNestedSettingsChange = (section, key, value) => {
    setFormDraft((prev) => {
      const base = prev ?? settings;
      return {
        ...base,
        [section]: {
          ...(DEFAULT_SYSTEM_SETTINGS[section] ?? {}),
          ...(base[section] ?? {}),
          [key]: value,
        },
      };
    });
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

  const handleAppModeToggle = (mode, checked) => {
    setFormDraft((prev) => {
      const base = prev ?? settings;
      const currentModes =
        base.appModeDefaults?.enabledModes ??
        DEFAULT_SYSTEM_SETTINGS.appModeDefaults.enabledModes;
      const enabledModes = checked
        ? Array.from(new Set([...currentModes, mode]))
        : currentModes.filter((item) => item !== mode);

      return {
        ...base,
        appModeDefaults: {
          ...DEFAULT_SYSTEM_SETTINGS.appModeDefaults,
          ...(base.appModeDefaults ?? {}),
          enabledModes,
          defaultMode: enabledModes.includes(base.appModeDefaults?.defaultMode)
            ? base.appModeDefaults.defaultMode
            : enabledModes[0] ||
              DEFAULT_SYSTEM_SETTINGS.appModeDefaults.defaultMode,
        },
      };
    });
  };

  const isLoading = isSettingsLoading;

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
              Platforma parametrlari, generation qoidalari va feature flaglarni
              boshqarish.
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
            <div className="grid grid-cols-1 gap-6">
              <Card>
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

            </div>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FlameIcon className="size-5 text-orange-500" />
                    <CardTitle>Health formula defaults</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Calorie formula"
                    value={formData.healthFormulaSettings?.calorieFormula}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "calorieFormula",
                        value,
                      )
                    }
                  />
                  <Field
                    label="Activity source"
                    value={
                      formData.healthFormulaSettings?.activityMultiplierSource
                    }
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "activityMultiplierSource",
                        value,
                      )
                    }
                  />
                  <Field
                    label="Deficit percent"
                    type="number"
                    value={formData.healthFormulaSettings?.deficitPercent}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "deficitPercent",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Surplus percent"
                    type="number"
                    value={formData.healthFormulaSettings?.surplusPercent}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "surplusPercent",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Min calories female"
                    type="number"
                    value={formData.healthFormulaSettings?.minCaloriesFemale}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "minCaloriesFemale",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Min calories male"
                    type="number"
                    value={formData.healthFormulaSettings?.minCaloriesMale}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "minCaloriesMale",
                        Number(value),
                      )
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DropletsIcon className="size-5 text-cyan-500" />
                    <CardTitle>Water formula defaults</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Water ml / kg"
                    type="number"
                    value={formData.healthFormulaSettings?.waterMlPerKg}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "waterMlPerKg",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Workout extra ml"
                    type="number"
                    value={formData.healthFormulaSettings?.workoutExtraWaterMl}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "workoutExtraWaterMl",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Hot weather extra ml"
                    type="number"
                    value={
                      formData.healthFormulaSettings?.hotWeatherExtraWaterMl
                    }
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "hotWeatherExtraWaterMl",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Min daily water ml"
                    type="number"
                    value={formData.healthFormulaSettings?.minDailyWaterMl}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "minDailyWaterMl",
                        Number(value),
                      )
                    }
                  />
                  <Field
                    label="Max daily water ml"
                    type="number"
                    value={formData.healthFormulaSettings?.maxDailyWaterMl}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "healthFormulaSettings",
                        "maxDailyWaterMl",
                        Number(value),
                      )
                    }
                  />
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BellIcon className="size-5 text-amber-500" />
                    <CardTitle>Notification templates</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ["waterReminder", "Water reminder"],
                    ["mealReminder", "Meal reminder"],
                    ["workoutReminder", "Workout reminder"],
                    ["progressReminder", "Progress reminder"],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Textarea
                        value={formData.notificationTemplates?.[key] ?? ""}
                        onChange={(event) =>
                          handleNestedSettingsChange(
                            "notificationTemplates",
                            key,
                            event.target.value,
                          )
                        }
                        className="min-h-20"
                        disabled={!canManageSettings}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BrainCircuitIcon className="size-5 text-primary" />
                    <CardTitle>AI rule references</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ["mealPlanPromptFeature", "Meal plan prompt feature"],
                    ["workoutPlanPromptFeature", "Workout prompt feature"],
                    ["safetyRulesSource", "Safety rules source"],
                    ["budgetRulesSource", "Budget rules source"],
                  ].map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      value={formData.aiRuleReferences?.[key]}
                      disabled={!canManageSettings}
                      onChange={(value) =>
                        handleNestedSettingsChange(
                          "aiRuleReferences",
                          key,
                          value,
                        )
                      }
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ToggleRightIcon className="size-5 text-emerald-500" />
                    <CardTitle>App modes and feature flags</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Field
                    label="Default app mode"
                    value={formData.appModeDefaults?.defaultMode}
                    disabled={!canManageSettings}
                    onChange={(value) =>
                      handleNestedSettingsChange(
                        "appModeDefaults",
                        "defaultMode",
                        value,
                      )
                    }
                  />
                  <div className="space-y-2">
                    <Label>Enabled modes</Label>
                    <div className="grid gap-2">
                      {APP_MODES.map(([key, label]) => (
                        <SwitchRow
                          key={key}
                          label={label}
                          checked={Boolean(
                            formData.appModeDefaults?.enabledModes?.includes(
                              key,
                            ),
                          )}
                          disabled={!canManageSettings}
                          onChange={(checked) =>
                            handleAppModeToggle(key, checked)
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Typed feature flags</Label>
                    <div className="grid gap-2">
                      {TYPED_FEATURE_FLAGS.map(([key, label]) => (
                        <SwitchRow
                          key={key}
                          label={label}
                          checked={Boolean(formData.typedFeatureFlags?.[key])}
                          disabled={!canManageSettings}
                          onChange={(checked) =>
                            handleNestedSettingsChange(
                              "typedFeatureFlags",
                              key,
                              checked,
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DumbbellIcon className="size-5 text-blue-500" />
                  <CardTitle>Workout AI generation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Label>Generation active</Label>
                    <p className="text-xs text-muted-foreground">
                      AI workout plan yaratishni yoqish.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(
                      formData.workoutPlanGenerationSettings?.enabled,
                    )}
                    onCheckedChange={(value) =>
                      handleNestedSettingsChange(
                        "workoutPlanGenerationSettings",
                        "enabled",
                        value,
                      )
                    }
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Label>Safety required</Label>
                    <p className="text-xs text-muted-foreground">
                      Health constraint safety qoidalarini majburiy qiladi.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(
                      formData.workoutPlanGenerationSettings
                        ?.safetyRulesRequired,
                    )}
                    onCheckedChange={(value) =>
                      handleNestedSettingsChange(
                        "workoutPlanGenerationSettings",
                        "safetyRulesRequired",
                        value,
                      )
                    }
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Label>Progression</Label>
                    <p className="text-xs text-muted-foreground">
                      Haftadan haftaga yuklamani oshirish.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(
                      formData.workoutPlanGenerationSettings
                        ?.progressionEnabled,
                    )}
                    onCheckedChange={(value) =>
                      handleNestedSettingsChange(
                        "workoutPlanGenerationSettings",
                        "progressionEnabled",
                        value,
                      )
                    }
                    disabled={!canManageSettings}
                  />
                </div>
                <Field
                  label="Default plan days"
                  type="number"
                  value={
                    formData.workoutPlanGenerationSettings?.defaultPlanDays
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "defaultPlanDays",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Min days / week"
                  type="number"
                  value={formData.workoutPlanGenerationSettings?.minDaysPerWeek}
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "minDaysPerWeek",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Default days / week"
                  type="number"
                  value={
                    formData.workoutPlanGenerationSettings?.defaultDaysPerWeek
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "defaultDaysPerWeek",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Max days / week"
                  type="number"
                  value={formData.workoutPlanGenerationSettings?.maxDaysPerWeek}
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "maxDaysPerWeek",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Rest days / week"
                  type="number"
                  value={
                    formData.workoutPlanGenerationSettings
                      ?.targetRestDaysPerWeek
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "targetRestDaysPerWeek",
                      Number(value),
                    )
                  }
                />
                <Field
                  label="Calorie estimate policy"
                  value={
                    formData.workoutPlanGenerationSettings
                      ?.calorieEstimatePolicy
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "calorieEstimatePolicy",
                      value,
                    )
                  }
                />
                <Field
                  label="Deload every weeks"
                  type="number"
                  value={
                    formData.workoutPlanGenerationSettings?.deloadEveryWeeks
                  }
                  disabled={!canManageSettings}
                  onChange={(value) =>
                    handleNestedSettingsChange(
                      "workoutPlanGenerationSettings",
                      "deloadEveryWeeks",
                      Number(value),
                    )
                  }
                />
              </CardContent>
            </Card>

          </>
        )}
      </div>
    </PageTransition>
  );
};

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

const SwitchRow = ({ checked, disabled, label, onChange }) => (
  <div className="flex items-center justify-between rounded-xl border p-3">
    <Label>{label}</Label>
    <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
  </div>
);

export default Index;
