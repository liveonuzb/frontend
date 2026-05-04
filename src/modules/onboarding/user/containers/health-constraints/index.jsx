import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  CheckIcon,
  ChevronRightIcon,
  CircleSlashIcon,
  HeartPulseIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import {
  OtherSelectionCard,
  OtherSelectionDrawer,
  OtherSelectionSelectedItems,
} from "../other-selection-drawer.jsx";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
  normalizeCustomChips,
} from "../../lib/chip-selection.js";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";

const getTone = (selected) => {
  if (selected?.type === "medical_condition") return ONBOARDING_ACCENTS.rose;
  if (selected?.type === "mobility_limitation") return ONBOARDING_ACCENTS.sky;
  if (selected?.key === "none") return ONBOARDING_ACCENTS.green;
  return ONBOARDING_ACCENTS.amber;
};

const extractConstraints = (response) => {
  const body = response?.data?.data ?? response?.data ?? [];
  return Array.isArray(body) ? body : [];
};

const ensureEllipsis = (value) => {
  const label = String(value ?? "").trim();
  if (!label) return "";
  return label.endsWith("…") ? label : `${label.replace(/\.\.\.$/, "")}…`;
};

const normalizeConstraintKeys = (values = []) =>
  Array.isArray(values)
    ? Array.from(
        new Set(
          values.map((value) => String(value ?? "").trim()).filter(Boolean),
        ),
      )
    : [];

const optionLabel = (option, fallback) => option?.name ?? fallback;

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    healthConstraints,
    customHealthConstraints,
    completedUserOnboardingSteps,
    setFields,
  } = useOnboardingStore();
  const [search, setSearch] = React.useState("");
  const [otherOpen, setOtherOpen] = React.useState(false);
  const deferredSearch = React.useDeferredValue(search);

  useOnboardingAutoSave("user", "health-constraints");

  const { data, isLoading, isError } = useGetQuery({
    url: "/user/onboarding/health-constraints",
    queryProps: {
      queryKey: ["user", "onboarding", "health-constraints"],
      staleTime: 60000,
    },
  });
  const searchLabel = normalizeChipLabel(deferredSearch);
  const searchKey = normalizeChipKey(searchLabel);
  const otherQueryParams = React.useMemo(
    () => ({
      isOnboarding: false,
      ...(searchLabel.length >= 2 ? { q: searchLabel } : {}),
    }),
    [searchLabel],
  );
  const { data: otherData, isFetching } = useGetQuery({
    url: "/user/onboarding/health-constraints",
    params: otherQueryParams,
    queryProps: {
      queryKey: [
        "user",
        "onboarding",
        "health-constraints",
        "other",
        searchLabel.length >= 2 ? searchLabel : "",
      ],
      enabled: otherOpen,
      staleTime: 15000,
    },
  });

  const constraints = React.useMemo(() => extractConstraints(data), [data]);
  const otherOptions = React.useMemo(
    () => extractConstraints(otherData),
    [otherData],
  );
  const drawerOptions = otherOptions;
  const noneOption = React.useMemo(
    () => ({
      key: "none",
      name: t("onboarding.healthConstraints.none"),
      description: t("onboarding.healthConstraints.noneDescription"),
      type: "none",
      isOnboarding: true,
    }),
    [t],
  );
  const selectedKeys = React.useMemo(
    () => normalizeConstraintKeys(healthConstraints),
    [healthConstraints],
  );
  const customChips = React.useMemo(
    () => normalizeCustomChips(customHealthConstraints),
    [customHealthConstraints],
  );
  const selectedKeySet = React.useMemo(
    () => new Set(selectedKeys),
    [selectedKeys],
  );
  const options = React.useMemo(
    () => [noneOption, ...constraints],
    [constraints, noneOption],
  );
  const allOptions = React.useMemo(() => {
    const map = new Map();
    [...options, ...otherOptions].forEach((item) => {
      if (item?.key) map.set(item.key, item);
    });
    return [...map.values()];
  }, [options, otherOptions]);
  const optionMap = React.useMemo(
    () => new Map(allOptions.map((item) => [item.key, item])),
    [allOptions],
  );
  const selectedOptions = React.useMemo(
    () => selectedKeys.map((key) => optionMap.get(key)).filter(Boolean),
    [optionMap, selectedKeys],
  );
  const hasSelection = selectedKeys.length > 0 || customChips.length > 0;
  const activeTone = getTone(selectedOptions[0]);
  const exactMatch = allOptions.some(
    (item) =>
      normalizeChipKey(item.name) === searchKey ||
      normalizeChipKey(item.key) === searchKey,
  );
  const canAddCustom =
    searchLabel.length >= 2 &&
    !exactMatch &&
    !hasChipLabel(customChips, searchLabel);

  const commitSelection = React.useCallback(
    (nextKeys, nextCustom = customChips) => {
      const normalizedKeys = normalizeConstraintKeys(nextKeys);
      const normalizedCustom = normalizeCustomChips(nextCustom);

      if (normalizedKeys.includes("none")) {
        setFields({
          healthConstraints: ["none"],
          customHealthConstraints: [],
          injurySeverity: "",
          forbiddenExercises: [],
          medications: "",
          supplements: "",
        });
        return;
      }

      setFields({
        healthConstraints: normalizedKeys.filter((key) => key !== "none"),
        customHealthConstraints: normalizedCustom,
        injurySeverity: "",
      });
    },
    [customChips, setFields],
  );

  const toggleOption = React.useCallback(
    (item) => {
      const key = String(item?.key ?? "").trim();
      if (!key) return;

      if (key === "none") {
        commitSelection(["none"], []);
        return;
      }

      const baseKeys = selectedKeys.filter((value) => value !== "none");
      commitSelection(
        selectedKeySet.has(key)
          ? baseKeys.filter((value) => value !== key)
          : [...baseKeys, key],
      );
    },
    [commitSelection, selectedKeySet, selectedKeys],
  );

  const addCustom = React.useCallback(() => {
    if (!canAddCustom) return;
    commitSelection(
      selectedKeys.filter((key) => key !== "none"),
      [...customChips, searchLabel],
    );
    setSearch("");
  }, [canAddCustom, commitSelection, customChips, searchLabel, selectedKeys]);

  const removeConstraint = React.useCallback(
    (key) => {
      commitSelection(
        selectedKeys.filter((value) => value !== key),
        key === "none" ? [] : customChips,
      );
    },
    [commitSelection, customChips, selectedKeys],
  );

  const removeCustom = React.useCallback(
    (label) => {
      const key = normalizeChipKey(label);
      commitSelection(
        selectedKeys.filter((value) => value !== "none"),
        customChips.filter((value) => normalizeChipKey(value) !== key),
      );
    },
    [commitSelection, customChips, selectedKeys],
  );

  const drawerSelectedItems = React.useMemo(
    () => [
      ...selectedKeys.map((key) => {
        const option = optionMap.get(key);
        const itemTone = getTone(option);
        return {
          key: `constraint-${key}`,
          label: optionLabel(option, key),
          className: `${itemTone.border} ${itemTone.badgeTone}`,
          onRemove: () => removeConstraint(key),
        };
      }),
      ...customChips.map((label) => ({
        key: `custom-${normalizeChipKey(label)}`,
        label,
        className:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15",
        onRemove: () => removeCustom(label),
      })),
    ],
    [customChips, optionMap, removeConstraint, removeCustom, selectedKeys],
  );

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([
          ...(completedUserOnboardingSteps ?? []),
          "health-constraints",
        ]),
      ),
    });
  }, [completedUserOnboardingSteps, setFields]);

  const goNext = React.useCallback(() => {
    if (!hasSelection) return;
    markCompleted();
    navigate("/user/onboarding/workout-location");
  }, [hasSelection, markCompleted, navigate]);

  const handleSkip = React.useCallback(() => {
    setFields({
      healthConstraints: ["none"],
      customHealthConstraints: [],
      injurySeverity: "",
      forbiddenExercises: [],
      medications: "",
      supplements: "",
      completedUserOnboardingSteps: Array.from(
        new Set([
          ...(completedUserOnboardingSteps ?? []),
          "health-constraints",
        ]),
      ),
    });
    navigate("/user/onboarding/workout-location");
  }, [completedUserOnboardingSteps, navigate, setFields]);

  const handleOtherOpenChange = React.useCallback((open) => {
    setOtherOpen(open);
    if (!open) {
      setSearch("");
    }
  }, []);

  const footerContent = React.useMemo(
    () => (
      <div className={"space-y-2"}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-12 w-full border-transparent"
          onClick={handleSkip}
        >
          {t("onboarding.skip")}
        </Button>
        <Button
          type="button"
          className={cn(
            "h-12 w-full border-transparent",
            hasSelection ? `bg-gradient-to-r ${activeTone.buttonTone}` : "",
          )}
          size="lg"
          disabled={!hasSelection}
          onClick={goNext}
        >
          {t("onboarding.next")}
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    ),
    [activeTone.buttonTone, goNext, handleSkip, hasSelection, t],
  );
  useOnboardingFooter(footerContent);

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={activeTone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion
          question={t("onboarding.healthConstraints.question")}
        />

        <div className="flex flex-col flex-1 justify-center gap-3 overflow-y-auto pb-5">
          {isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2Icon
                className="size-6 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {t("onboarding.chipSelect.error")}
            </div>
          ) : (
            options.map((item) => {
              const isActive = selectedKeySet.has(item.key);
              const itemTone = getTone(item);
              const Icon =
                item.key === "none" ? CircleSlashIcon : HeartPulseIcon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleOption(item)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:min-h-[84px] md:px-4",
                    isActive
                      ? `bg-gradient-to-br ${itemTone.cardTone} ${itemTone.border}`
                      : "border-border/70 bg-background/90",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                      isActive
                        ? itemTone.badgeTone
                        : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-bold leading-snug text-foreground">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                      {item.description ||
                        t("onboarding.healthConstraints.defaultDescription")}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isActive
                        ? `${itemTone.border} bg-background/70`
                        : "border-border bg-background",
                    )}
                    aria-hidden="true"
                  >
                    <CheckIcon
                      className={cn(
                        "size-4",
                        isActive ? itemTone.textTone : "text-transparent",
                      )}
                    />
                  </span>
                </button>
              );
            })
          )}

          <OtherSelectionCard
            open={otherOpen}
            tone={activeTone}
            title={t("onboarding.chipSelect.otherTitle")}
            description={t("onboarding.chipSelect.otherDescription")}
            onClick={() => handleOtherOpenChange(true)}
          />
        </div>
      </div>
      <OtherSelectionDrawer
        open={otherOpen}
        onOpenChange={handleOtherOpenChange}
        title={t("onboarding.chipSelect.otherTitle")}
        description={t("onboarding.chipSelect.otherDescription")}
        searchId="health-constraints-other-search"
        searchLabel={t("onboarding.chipSelect.searchLabel")}
        search={search}
        onSearchChange={setSearch}
        placeholder={ensureEllipsis(
          t("onboarding.healthConstraints.otherPlaceholder"),
        )}
        doneLabel={t("common.done", { defaultValue: "Tayyor" })}
      >
        <OtherSelectionSelectedItems
          items={drawerSelectedItems}
          title={t("onboarding.chipSelect.selectedCount", {
            count: selectedKeys.length + customChips.length,
          })}
        />

        {isFetching ? (
          <div className="flex min-h-16 items-center justify-center">
            <Loader2Icon
              className="size-5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : drawerOptions.length ? (
          drawerOptions.map((item) => {
            const isActive = selectedKeySet.has(item.key);
            return (
              <button
                key={`search-${item.key}`}
                type="button"
                onClick={() => toggleOption(item)}
                aria-pressed={isActive}
                className={cn(
                  "flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? `${activeTone.border} ${activeTone.badgeTone}`
                    : "border-border/70 bg-background",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {optionLabel(item, item.key)}
                </span>
                {item.isOnboarding === false ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t("onboarding.chipSelect.nonOnboarding")}
                  </span>
                ) : null}
              </button>
            );
          })
        ) : (
          <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            {t("onboarding.chipSelect.empty")}
          </p>
        )}

        {canAddCustom ? (
          <button
            type="button"
            onClick={addCustom}
            className="flex min-h-[52px] items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <PlusIcon className="size-4" aria-hidden="true" />
            </span>
            {t("onboarding.chipSelect.addCustom", {
              value: searchLabel,
            })}
          </button>
        ) : null}
      </OtherSelectionDrawer>
    </div>
  );
};

export default Index;
