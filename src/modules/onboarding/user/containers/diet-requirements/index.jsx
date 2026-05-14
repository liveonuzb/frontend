import React from "react";
import { ChevronRightIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { getDietRequirementLabel } from "@/modules/onboarding/lib/onboarding-labels";
import {
  getOnboardingOptionsPath,
  getOnboardingOptionsQueryKey,
  normalizeOnboardingOptionsResponse,
} from "@/modules/onboarding/lib/onboarding-options";
import { useOnboardingStore } from "@/store";
import PageAura from "../../components/page-aura.jsx";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
  normalizeCustomChips,
  normalizeSelectedIds,
} from "../../lib/chip-selection.js";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import {
  OtherSelectionCard,
  OtherSelectionDrawer,
  OtherSelectionSelectedItems,
} from "../other-selection-drawer.jsx";
import { CatalogOptionList } from "../catalog-option-list.jsx";
import { ONBOARDING_GRID_SCROLL_AREA_CLASS } from "../onboarding-scroll-area.js";
import OnboardingSelectCard from "../../components/onboarding-select-card.jsx";

const STEP = "diet-requirements";
const I18N_KEY = "onboarding.nutritionSteps.dietRequirements";
const OPTIONS_KEY = "dietRequirements";
const FIELD = "dietRequirementIds";
const LEGACY_FIELD = null;
const CUSTOM_FIELD = "customDietRequirements";
const NEXT_PATH = "/user/onboarding/health-constraints";
const OPPOSITE_FIELD = null;
const OPPOSITE_CUSTOM_FIELD = null;
const CONFLICT_I18N_KEY = null;
const tone = ONBOARDING_ACCENTS.green;
const EMPTY_ARRAY = Object.freeze([]);

const extractOptions = (response) =>
  normalizeOnboardingOptionsResponse(response, OPTIONS_KEY);

const mergeOptions = (...groups) => {
  const seen = new Set();
  return groups.flat().filter((item) => {
    const id = Number(item?.id);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

const optionLabel = (option, fallback, t) =>
  getDietRequirementLabel(option, fallback, t);

const ensureEllipsis = (value) => {
  const label = String(value ?? "").trim();
  if (!label) return "";
  return label.endsWith("…") ? label : `${label.replace(/\.\.\.$/, "")}…`;
};

const getOptionBadgeKey = (option) => {
  if (option?.isOnboarding === false) {
    return "onboarding.chipSelect.nonOnboarding";
  }
  if (OPTIONS_KEY === "allergies" && option?.isAllergic) {
    return "onboarding.chipSelect.allergicBadge";
  }
  return "onboarding.chipSelect.recommendedBadge";
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selected = useOnboardingStore((state) => state[FIELD]);
  const legacySelected = useOnboardingStore((state) =>
    LEGACY_FIELD ? state[LEGACY_FIELD] : EMPTY_ARRAY,
  );
  const customValues = useOnboardingStore((state) => state[CUSTOM_FIELD]);
  const oppositeSelected = useOnboardingStore((state) =>
    OPPOSITE_FIELD ? state[OPPOSITE_FIELD] : EMPTY_ARRAY,
  );
  const oppositeCustomValues = useOnboardingStore((state) =>
    OPPOSITE_CUSTOM_FIELD ? state[OPPOSITE_CUSTOM_FIELD] : EMPTY_ARRAY,
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);
  const [search, setSearch] = React.useState("");
  const [otherOpen, setOtherOpen] = React.useState(false);
  const deferredSearch = React.useDeferredValue(search);

  useOnboardingAutoSave("user", STEP);

  const selectedIds = React.useMemo(
    () => normalizeSelectedIds(selected?.length ? selected : legacySelected),
    [legacySelected, selected],
  );
  const customChips = React.useMemo(
    () => normalizeCustomChips(customValues),
    [customValues],
  );
  const oppositeIds = React.useMemo(
    () => normalizeSelectedIds(oppositeSelected),
    [oppositeSelected],
  );
  const oppositeCustomChips = React.useMemo(
    () => normalizeCustomChips(oppositeCustomValues),
    [oppositeCustomValues],
  );
  const searchLabel = normalizeChipLabel(deferredSearch);
  const searchKey = normalizeChipKey(searchLabel);

  const { data, isLoading, isError } = useGetQuery({
    url: getOnboardingOptionsPath(OPTIONS_KEY),
    queryProps: {
      queryKey: getOnboardingOptionsQueryKey(OPTIONS_KEY, STEP),
      staleTime: 60000,
    },
  });
  const otherQueryParams = React.useMemo(
    () => ({
      isOnboarding: false,
      ...(searchLabel.length >= 2 ? { q: searchLabel } : {}),
    }),
    [searchLabel],
  );
  const { data: otherData, isFetching } = useGetQuery({
    url: getOnboardingOptionsPath(OPTIONS_KEY),
    params: otherQueryParams,
    queryProps: {
      queryKey: getOnboardingOptionsQueryKey(
        OPTIONS_KEY,
        STEP,
        "other",
        searchLabel.length >= 2 ? searchLabel : "",
      ),
      enabled: otherOpen,
      staleTime: 15000,
    },
  });

  const baseOptions = React.useMemo(() => extractOptions(data), [data]);
  const otherOptions = React.useMemo(
    () => extractOptions(otherData),
    [otherData],
  );
  const allOptions = React.useMemo(
    () => mergeOptions(baseOptions, otherOptions),
    [baseOptions, otherOptions],
  );
  const optionMap = React.useMemo(
    () => new Map(allOptions.map((item) => [Number(item.id), item])),
    [allOptions],
  );
  const selectedIdSet = React.useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );
  const oppositeIdSet = React.useMemo(
    () => new Set(oppositeIds),
    [oppositeIds],
  );
  const oppositeCustomKeySet = React.useMemo(
    () => new Set(oppositeCustomChips.map((value) => normalizeChipKey(value))),
    [oppositeCustomChips],
  );
  const cardOptions = React.useMemo(
    () => baseOptions.filter((item) => !oppositeIdSet.has(Number(item.id))),
    [baseOptions, oppositeIdSet],
  );
  const drawerOptions = React.useMemo(
    () => otherOptions.filter((item) => !oppositeIdSet.has(Number(item.id))),
    [oppositeIdSet, otherOptions],
  );
  const exactMatch = allOptions.some(
    (item) => normalizeChipKey(item.name) === searchKey,
  );
  const conflictsWithOppositeId = allOptions.some(
    (item) =>
      oppositeIdSet.has(Number(item.id)) &&
      normalizeChipKey(item.name) === searchKey,
  );
  const hasOppositeConflict =
    searchLabel.length >= 2 &&
    (conflictsWithOppositeId || oppositeCustomKeySet.has(searchKey));
  const canAddCustom =
    searchLabel.length >= 2 &&
    !exactMatch &&
    !hasChipLabel(customChips, searchLabel) &&
    !hasOppositeConflict;
  const selectedCount = selectedIds.length + customChips.length;

  const commitFields = React.useCallback(
    (nextIds, nextCustom = customChips) => {
      const normalizedIds = normalizeSelectedIds(nextIds).filter(
        (id) => !oppositeIdSet.has(id),
      );
      const normalizedCustom = normalizeCustomChips(nextCustom).filter(
        (label) => !oppositeCustomKeySet.has(normalizeChipKey(label)),
      );
      const fields = {
        [FIELD]: normalizedIds,
        [CUSTOM_FIELD]: normalizedCustom,
      };

      if (LEGACY_FIELD) {
        fields[LEGACY_FIELD] = normalizedIds;
      }

      setFields(fields);
    },
    [customChips, oppositeCustomKeySet, oppositeIdSet, setFields],
  );

  const toggleOption = React.useCallback(
    (item) => {
      const id = Number(item?.id);
      if (!Number.isInteger(id) || id <= 0 || oppositeIdSet.has(id)) {
        return;
      }

      commitFields(
        selectedIdSet.has(id)
          ? selectedIds.filter((value) => value !== id)
          : [...selectedIds, id],
      );
    },
    [commitFields, oppositeIdSet, selectedIdSet, selectedIds],
  );

  const addCustom = React.useCallback(() => {
    if (!canAddCustom) return;
    commitFields(selectedIds, [...customChips, searchLabel]);
    setSearch("");
  }, [canAddCustom, commitFields, customChips, searchLabel, selectedIds]);

  const removeCustom = React.useCallback(
    (label) => {
      const key = normalizeChipKey(label);
      commitFields(
        selectedIds,
        customChips.filter((value) => normalizeChipKey(value) !== key),
      );
    },
    [commitFields, customChips, selectedIds],
  );

  const drawerSelectedItems = React.useMemo(
    () => [
      ...selectedIds.map((id) => {
        const option = optionMap.get(id);
        return {
          key: `catalog-${id}`,
          label: optionLabel(option, `#${id}`, t),
          onRemove: () =>
            commitFields(selectedIds.filter((value) => value !== id)),
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
    [commitFields, customChips, optionMap, removeCustom, selectedIds, t],
  );

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), STEP]),
      ),
    });
  }, [completedSteps, setFields]);

  const goNext = React.useCallback(() => {
    markCompleted();
    navigate(NEXT_PATH);
  }, [markCompleted, navigate]);

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
          onClick={goNext}
        >
          {t("onboarding.skipForNow")}
        </Button>
        <Button
          type="button"
          className={cn(
            "h-12 w-full border-transparent bg-gradient-to-r",
            tone.buttonTone,
          )}
          size="lg"
          onClick={goNext}
        >
          {t("onboarding.next")}
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    ),
    [goNext, t],
  );
  useOnboardingFooter(footerContent);

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-2xl">
        <OnboardingQuestion question={t(`${I18N_KEY}.title`)} />
        {selectedCount > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const option = optionMap.get(id);
              return (
                <button
                  key={`selected-${id}`}
                  type="button"
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() =>
                    commitFields(selectedIds.filter((value) => value !== id))
                  }
                >
                  <span className="truncate">
                    {optionLabel(option, `#${id}`, t)}
                  </span>
                  <XIcon className="size-3.5 shrink-0" aria-hidden="true" />
                </button>
              );
            })}
            {customChips.map((label) => (
              <button
                key={`custom-${label}`}
                type="button"
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                onClick={() => removeCustom(label)}
              >
                <span className="truncate">{label}</span>
                <XIcon className="size-3.5 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : null}

        <div className={cn(ONBOARDING_GRID_SCROLL_AREA_CLASS, "gap-2")}>
          <OtherSelectionCard
            open={otherOpen}
            tone={tone}
            title={t("onboarding.chipSelect.otherTitle")}
            description={t("onboarding.chipSelect.otherDescription")}
            onClick={() => handleOtherOpenChange(true)}
          />

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
            <CatalogOptionList
              options={cardOptions}
              selectedIdSet={selectedIdSet}
            >
              {(item) => {
                const id = Number(item.id);
                const isActive = selectedIdSet.has(id);

                return (
                  <OnboardingSelectCard
                    key={id}
                    active={isActive}
                    badge={optionLabel(item, `#${id}`, t).slice(0, 1)}
                    imageAlt=""
                    imageUrl={item.imageUrl}
                    metaBadge={t(getOptionBadgeKey(item))}
                    onClick={() => toggleOption(item)}
                    selectionMode="multi"
                    title={optionLabel(item, `#${id}`, t)}
                    tone={tone}
                  />
                );
              }}
            </CatalogOptionList>
          )}
        </div>
      </div>
      <OtherSelectionDrawer
        open={otherOpen}
        onOpenChange={handleOtherOpenChange}
        title={t("onboarding.chipSelect.otherTitle")}
        description={t("onboarding.chipSelect.otherDescription")}
        searchId={`${STEP}-other-search`}
        searchLabel={t("onboarding.chipSelect.searchLabel")}
        search={search}
        onSearchChange={setSearch}
        placeholder={ensureEllipsis(t(`${I18N_KEY}.placeholder`))}
        doneLabel={t("common.done", { defaultValue: "Tayyor" })}
      >
        <OtherSelectionSelectedItems
          items={drawerSelectedItems}
          title={t("onboarding.chipSelect.selectedCount", {
            count: selectedCount,
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
            const id = Number(item.id);
            const isActive = selectedIdSet.has(id);

            return (
              <OnboardingSelectCard
                key={`search-${id}`}
                active={isActive}
                metaBadge={
                  item.isOnboarding === false
                    ? t("onboarding.chipSelect.nonOnboarding")
                    : null
                }
                onClick={() => toggleOption(item)}
                selectionMode="multi"
                title={optionLabel(item, `#${id}`, t)}
                tone={tone}
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
          <OnboardingSelectCard
            description={null}
            icon={PlusIcon}
            onClick={addCustom}
            title={t("onboarding.chipSelect.addCustom", {
              value: searchLabel,
            })}
            tone={tone}
            variant="drawer"
          />
        ) : null}

        {hasOppositeConflict && CONFLICT_I18N_KEY ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
            {t(CONFLICT_I18N_KEY)}
          </div>
        ) : null}
      </OtherSelectionDrawer>
    </div>
  );
};

export default Index;
