import React from "react";
import { ChevronRightIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OnboardingQuestion } from "@/modules/user-onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/user-onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { getDietRequirementLabel } from "@/modules/user-onboarding/lib/onboarding-labels";
import { useOnboardingOptions } from "@/modules/user-onboarding/lib/use-onboarding-options";
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
} from "./other-drawer.jsx";
import { CatalogOptionList } from "../catalog-option-list.jsx";
import { ONBOARDING_GRID_SCROLL_AREA_CLASS } from "../onboarding-scroll-area.js";
import OnboardingOption from "./option.jsx";

import {
  filter,
  first,
  flatten,
  map,
  some,
  toArray,
  toNumber,
  trim,
  uniq,
} from "lodash";

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

const mergeOptions = (...groups) => {
  const seen = new Set();
  return filter(flatten(groups), (item) => {
    const id = toNumber(item?.id);
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
  const label = trim(String(value ?? ""));
  if (!label) return "";
  return label.endsWith("…") ? label : `${label.replace(/\.\.\.$/, "")}…`;
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

  const {
    options: baseOptions,
    isLoading,
    isError,
  } = useOnboardingOptions({
    resource: OPTIONS_KEY,
    step: STEP,
  });
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
    resource: OPTIONS_KEY,
    staleTime: 15000,
    step: STEP,
  });

  const allOptions = React.useMemo(
    () => mergeOptions(baseOptions, otherOptions),
    [baseOptions, otherOptions],
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
    () => new Set(map(oppositeCustomChips, (value) => normalizeChipKey(value))),
    [oppositeCustomChips],
  );
  const cardOptions = React.useMemo(
    () =>
      filter(
        mergeOptions(
          baseOptions,
          filter(otherOptions, (item) => selectedIdSet.has(toNumber(item.id))),
        ),
        (item) => !oppositeIdSet.has(toNumber(item.id)),
      ),
    [baseOptions, oppositeIdSet, otherOptions, selectedIdSet],
  );
  const drawerOptions = React.useMemo(
    () => filter(otherOptions, (item) => !oppositeIdSet.has(toNumber(item.id))),
    [oppositeIdSet, otherOptions],
  );
  const exactMatch = some(
    allOptions,
    (item) => normalizeChipKey(item.name) === searchKey,
  );
  const conflictsWithOppositeId = some(
    allOptions,
    (item) =>
      oppositeIdSet.has(toNumber(item.id)) &&
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
  const commitFields = React.useCallback(
    (nextIds, nextCustom = customChips) => {
      const normalizedIds = filter(
        normalizeSelectedIds(nextIds),
        (id) => !oppositeIdSet.has(id),
      );
      const normalizedCustom = filter(
        normalizeCustomChips(nextCustom),
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
      const id = toNumber(item?.id);
      if (!Number.isInteger(id) || id <= 0 || oppositeIdSet.has(id)) {
        return;
      }

      commitFields(
        selectedIdSet.has(id)
          ? filter(selectedIds, (value) => value !== id)
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

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: uniq([...(completedSteps ?? []), STEP]),
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
    ),
    [goNext, t],
  );
  useOnboardingFooter(footerContent);

  return (
    <div className="relative flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col md:mx-auto md:max-w-2xl">
        <OnboardingQuestion question={t(`${I18N_KEY}.title`)} />

        <div
          data-diet-requirements-options="true"
          className={cn(ONBOARDING_GRID_SCROLL_AREA_CLASS, "gap-2")}
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
            <CatalogOptionList
              options={cardOptions}
              selectedIdSet={selectedIdSet}
            >
              {(item) => {
                const id = toNumber(item.id);
                const isActive = selectedIdSet.has(id);

                return (
                  <OnboardingOption
                    key={id}
                    active={isActive}
                    badge={first(toArray(optionLabel(item, `#${id}`, t))) || ""}
                    imageAlt=""
                    imageUrl={item.imageUrl}
                    onClick={() => toggleOption(item)}
                    selectionMode="multi"
                    title={optionLabel(item, `#${id}`, t)}
                    tone={tone}
                    variant="compact"
                  />
                );
              }}
            </CatalogOptionList>
          )}

          <OtherSelectionCard
            open={otherOpen}
            tone={tone}
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
        searchId={`${STEP}-other-search`}
        searchLabel={t("onboarding.chipSelect.searchLabel")}
        search={search}
        onSearchChange={setSearch}
        placeholder={ensureEllipsis(t(`${I18N_KEY}.placeholder`))}
        doneLabel={t("common.done")}
      >
        {isFetching ? (
          <div className="flex min-h-16 items-center justify-center">
            <Loader2Icon
              className="size-5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : drawerOptions.length ? (
          map(drawerOptions, (item) => {
            const id = toNumber(item.id);
            const isActive = selectedIdSet.has(id);

            return (
              <OnboardingOption
                key={`search-${id}`}
                active={isActive}
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
          <OnboardingOption
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
