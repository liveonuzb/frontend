import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ChevronRightIcon,
  CircleSlashIcon,
  HeartPulseIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { useOnboardingOptions } from "@/modules/user-onboarding/lib/use-onboarding-options";
import {
  OtherSelectionCard,
  OtherSelectionDrawer,
  OtherSelectionSelectedItems,
} from "./other-drawer.jsx";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
  normalizeCustomChips,
} from "../../lib/chip-selection.js";
import PageAura from "../../components/page-aura.jsx";
import OnboardingOption from "./option.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import { ONBOARDING_SCROLL_AREA_CLASS } from "../onboarding-scroll-area.js";

import concat from "lodash/concat";
import filter from "lodash/filter";
import forEach from "lodash/forEach";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import map from "lodash/map";
import some from "lodash/some";
import trim from "lodash/trim";
import uniq from "lodash/uniq";

const STEP = "health-constraints";

const getTone = (selected) => {
  if (selected?.type === "medical_condition") return ONBOARDING_ACCENTS.rose;
  if (selected?.type === "mobility_limitation") return ONBOARDING_ACCENTS.sky;
  if (selected?.key === "none") return ONBOARDING_ACCENTS.green;
  return ONBOARDING_ACCENTS.amber;
};

const ensureEllipsis = (value) => {
  const label = trim(String(value ?? ""));
  if (!label) return "";
  return label.endsWith("…") ? label : `${label.replace(/\.\.\.$/, "")}…`;
};

const normalizeConstraintKeys = (values = []) =>
  isArray(values)
    ? uniq(
        filter(
          map(values, (value) => trim(String(value ?? ""))),
          Boolean,
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

  useOnboardingAutoSave("user", STEP);

  const {
    options: constraints,
    isLoading,
    isError,
  } = useOnboardingOptions({
    resource: STEP,
    step: STEP,
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
  const otherQueryParts = React.useMemo(
    () => ["other", searchLabel.length >= 2 ? searchLabel : ""],
    [searchLabel],
  );
  const { options: otherOptions, isFetching } = useOnboardingOptions({
    enabled: otherOpen,
    params: otherQueryParams,
    queryParts: otherQueryParts,
    resource: STEP,
    staleTime: 15000,
    step: STEP,
  });

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
    forEach([...options, ...otherOptions], (item) => {
      if (item?.key) map.set(item.key, item);
    });
    return [...map.values()];
  }, [options, otherOptions]);
  const optionMap = React.useMemo(
    () => new Map(map(allOptions, (item) => [item.key, item])),
    [allOptions],
  );
  const selectedOptions = React.useMemo(
    () =>
      filter(
        map(selectedKeys, (key) => optionMap.get(key)),
        Boolean,
      ),
    [optionMap, selectedKeys],
  );
  const hasSelection = selectedKeys.length > 0 || customChips.length > 0;
  const activeTone = getTone(selectedOptions[0]);
  const exactMatch = some(
    allOptions,
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

      if (includes(normalizedKeys, "none")) {
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
        healthConstraints: filter(normalizedKeys, (key) => key !== "none"),
        customHealthConstraints: normalizedCustom,
        injurySeverity: "",
      });
    },
    [customChips, setFields],
  );

  const toggleOption = React.useCallback(
    (item) => {
      const key = trim(String(item?.key ?? ""));
      if (!key) return;

      if (key === "none") {
        commitSelection(["none"], []);
        return;
      }

      const baseKeys = filter(selectedKeys, (value) => value !== "none");
      commitSelection(
        selectedKeySet.has(key)
          ? filter(baseKeys, (value) => value !== key)
          : [...baseKeys, key],
      );
    },
    [commitSelection, selectedKeySet, selectedKeys],
  );

  const addCustom = React.useCallback(() => {
    if (!canAddCustom) return;
    commitSelection(
      filter(selectedKeys, (key) => key !== "none"),
      [...customChips, searchLabel],
    );
    setSearch("");
  }, [canAddCustom, commitSelection, customChips, searchLabel, selectedKeys]);

  const removeConstraint = React.useCallback(
    (key) => {
      commitSelection(
        filter(selectedKeys, (value) => value !== key),
        key === "none" ? [] : customChips,
      );
    },
    [commitSelection, customChips, selectedKeys],
  );

  const removeCustom = React.useCallback(
    (label) => {
      const key = normalizeChipKey(label);
      commitSelection(
        filter(selectedKeys, (value) => value !== "none"),
        filter(customChips, (value) => normalizeChipKey(value) !== key),
      );
    },
    [commitSelection, customChips, selectedKeys],
  );

  const drawerSelectedItems = React.useMemo(
    () => concat(
      map(selectedKeys, (key) => {
        const option = optionMap.get(key);
        const itemTone = getTone(option);
        return {
          key: `constraint-${key}`,
          label: optionLabel(option, key),
          className: `${itemTone.border} ${itemTone.badgeTone}`,
          onRemove: () => removeConstraint(key),
        };
      }),
      map(customChips, (label) => ({
        key: `custom-${normalizeChipKey(label)}`,
        label,
        className:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15",
        onRemove: () => removeCustom(label),
      })),
    ),
    [customChips, optionMap, removeConstraint, removeCustom, selectedKeys],
  );

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: uniq([
        ...(completedUserOnboardingSteps ?? []),
        "health-constraints",
      ]),
    });
  }, [completedUserOnboardingSteps, setFields]);

  const goNext = React.useCallback(() => {
    if (!hasSelection) {
      setFields({
        healthConstraints: ["none"],
        customHealthConstraints: [],
        injurySeverity: "",
        forbiddenExercises: [],
        medications: "",
        supplements: "",
        completedUserOnboardingSteps: uniq([
          ...(completedUserOnboardingSteps ?? []),
          "health-constraints",
        ]),
      });
      navigate("/user/onboarding/review");
      return;
    }

    markCompleted();
    navigate("/user/onboarding/review");
  }, [
    completedUserOnboardingSteps,
    hasSelection,
    markCompleted,
    navigate,
    setFields,
  ]);

  const handleOtherOpenChange = React.useCallback((open) => {
    setOtherOpen(open);
    if (!open) {
      setSearch("");
    }
  }, []);

  const footerContent = React.useMemo(
    () => (
      <Button
        type="button"
        className={cn(
          "h-12 w-full border-transparent bg-gradient-to-r",
          activeTone.buttonTone,
        )}
        size="lg"
        onClick={goNext}
      >
        {t("onboarding.next")}
        <ChevronRightIcon className="size-4" aria-hidden="true" />
      </Button>
    ),
    [activeTone.buttonTone, goNext, t],
  );
  useOnboardingFooter(footerContent);

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={activeTone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-2xl">
        <OnboardingQuestion
          question={t("onboarding.healthConstraints.question")}
        />

        <div
          className={cn(
            ONBOARDING_SCROLL_AREA_CLASS,
            "flex flex-col justify-center gap-3",
          )}
        >
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
            map(options, (item) => {
              const isActive = selectedKeySet.has(item.key);
              const itemTone = getTone(item);
              const Icon =
                item.key === "none" ? CircleSlashIcon : HeartPulseIcon;

              return (
                <OnboardingOption
                  key={item.key}
                  active={isActive}
                  description={
                    item.description ||
                    t("onboarding.healthConstraints.defaultDescription")
                  }
                  icon={Icon}
                  onClick={() => toggleOption(item)}
                  selectionMode="multi"
                  title={item.name}
                  tone={itemTone}
                  variant="compact"
                />
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
        doneLabel={t("common.done")}
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
          map(drawerOptions, (item) => {
            const isActive = selectedKeySet.has(item.key);
            return (
              <OnboardingOption
                key={`search-${item.key}`}
                active={isActive}
                metaBadge={
                  item.isOnboarding === false
                    ? t("onboarding.chipSelect.nonOnboarding")
                    : null
                }
                onClick={() => toggleOption(item)}
                selectionMode="multi"
                title={optionLabel(item, item.key)}
                tone={activeTone}
                variant="drawer"
              />
            );
          })
        ) : (
          <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            {t("onboarding.chipSelect.empty")}
          </p>
        )}

        {canAddCustom ? (
          <OnboardingOption
            icon={PlusIcon}
            onClick={addCustom}
            title={t("onboarding.chipSelect.addCustom", {
              value: searchLabel,
            })}
            tone={activeTone}
            variant="drawer"
          />
        ) : null}
      </OtherSelectionDrawer>
    </div>
  );
};

export default Index;
