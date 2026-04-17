import React from "react";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import {
  LayoutPanelLeftIcon,
  MonitorIcon,
  MoonStarIcon,
  TypeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DrawerFooter } from "@/components/ui/drawer";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import { applyFontSize, applyTheme } from "@/lib/user-preferences";

const getThemeOptions = (t) => [
  {
    value: "light",
    label: t("profile.appearance.theme.light"),
    description: t("profile.appearance.theme.lightDesc"),
    icon: MonitorIcon,
  },
  {
    value: "dark",
    label: t("profile.appearance.theme.dark"),
    description: t("profile.appearance.theme.darkDesc"),
    icon: MoonStarIcon,
  },
];

const getFontSizeOptions = (t) => [
  { value: "small", label: t("profile.appearance.fontSize.small") },
  { value: "medium", label: t("profile.appearance.fontSize.medium") },
  { value: "large", label: t("profile.appearance.fontSize.large") },
];

const getSidebarOptions = (t) => [
  { value: "expanded", label: t("profile.appearance.sidebar.expanded") },
  { value: "collapsed", label: t("profile.appearance.sidebar.collapsed") },
];

const createInitialForm = (settings) => ({
  theme: settings.theme || "light",
  fontSize: settings.fontSize || "medium",
  sidebarState: settings.sidebarState || "expanded",
});

const AppearanceTabContent = ({
  embedded,
  form,
  handleSave,
  initialForm,
  isDirty,
  isSavingGeneral,
  setForm,
  t,
}) => {
  const THEME_OPTIONS = getThemeOptions(t);
  const FONT_SIZE_OPTIONS = getFontSizeOptions(t);
  const SIDEBAR_OPTIONS = getSidebarOptions(t);

  return (
    <Card className="py-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">{t("profile.tabs.appearance")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <Field>
          <FieldLabel>{t("profile.appearance.theme.title")}</FieldLabel>
          <div className="grid gap-4 md:grid-cols-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = form.theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, theme: option.value }))
                  }
                  className={cn(
                    "rounded-3xl border p-5 text-left transition-all",
                    isActive
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60 hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-2xl",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "mt-1 size-4 rounded-full border-2",
                        isActive
                          ? "border-primary bg-primary"
                          : "border-border bg-transparent",
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <FieldDescription>
            {t("profile.appearance.theme.hint")}
          </FieldDescription>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field>
            <FieldLabel>{t("profile.appearance.fontSize.title")}</FieldLabel>
            <Select
              value={form.fontSize}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, fontSize: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {t("profile.appearance.fontSize.hint")}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>{t("profile.appearance.sidebar.title")}</FieldLabel>
            <Select
              value={form.sidebarState}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, sidebarState: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIDEBAR_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {t("profile.appearance.sidebar.hint")}
            </FieldDescription>
          </Field>
        </div>

        {!embedded ? (
          <>
            <div className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <TypeIcon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold">{t("profile.appearance.fontSize.title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {
                      FONT_SIZE_OPTIONS.find(
                        (item) => item.value === form.fontSize,
                      )?.label
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <LayoutPanelLeftIcon className="size-4" />
                </div>
                <div>
                  <p className="font-semibold">{t("profile.appearance.sidebar.title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {
                      SIDEBAR_OPTIONS.find(
                        (item) => item.value === form.sidebarState,
                      )?.label
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                disabled={!isDirty || isSavingGeneral}
                onClick={handleSave}
              >
                {isSavingGeneral ? t("profile.general.saving") : t("profile.general.save")}
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const AppearanceTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { settings, saveGeneralSettings, isSavingGeneral } =
    useProfileSettings();
  const initialForm = React.useMemo(
    () => createInitialForm(settings),
    [settings],
  );
  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  React.useEffect(() => {
    applyTheme(form.theme);
  }, [form.theme]);

  React.useEffect(() => {
    applyFontSize(form.fontSize);
  }, [form.fontSize]);

  const isDirty = !isEqual(form, initialForm);

  const handleSave = React.useCallback(async () => {
    try {
      await saveGeneralSettings(form);
      toast.success(t("profile.appearance.saveSuccess"));
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.appearance.saveError"),
        ),
      );
    }
  }, [form, saveGeneralSettings, t]);

  const handleReset = React.useCallback(() => {
    setForm(initialForm);
    applyTheme(initialForm.theme);
    applyFontSize(initialForm.fontSize);
  }, [initialForm]);

  const content = (
    <AppearanceTabContent
      embedded={embedded}
      form={form}
      handleSave={handleSave}
      initialForm={initialForm}
      isDirty={isDirty}
      isSavingGeneral={isSavingGeneral}
      setForm={setForm}
      t={t}
    />
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8 sm:px-6">
          {content}
        </div>
        <DrawerFooter>
          <Button
            type="button"
            disabled={!isDirty || isSavingGeneral}
            onClick={handleSave}
          >
            {isSavingGeneral ? t("profile.general.saving") : t("profile.general.save")}
          </Button>
        </DrawerFooter>
      </div>
    );
  }

  return content;
};
