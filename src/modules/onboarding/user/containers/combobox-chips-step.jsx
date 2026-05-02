import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import PageAura from "../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../lib/tones.js";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
  normalizeCustomChips,
  normalizeSelectedIds,
} from "../lib/chip-selection.js";

const tone = ONBOARDING_ACCENTS.green;
const EMPTY_ARRAY = Object.freeze([]);
const CATALOG_PREFIX = "catalog:";
const CUSTOM_PREFIX = "custom:";

const toCatalogValue = (id) => `${CATALOG_PREFIX}${id}`;
const toCustomValue = (label) => `${CUSTOM_PREFIX}${label}`;
const isCatalogValue = (value) => String(value).startsWith(CATALOG_PREFIX);
const isCustomValue = (value) => String(value).startsWith(CUSTOM_PREFIX);
const fromCatalogValue = (value) =>
  Number(String(value).slice(CATALOG_PREFIX.length));
const fromCustomValue = (value) => String(value).slice(CUSTOM_PREFIX.length);

const extractOptions = (response, optionsKey) => {
  const body = response?.data?.data ?? response?.data ?? {};
  const values = body?.[optionsKey];
  return Array.isArray(values) ? values : [];
};

const mergeOptions = (...groups) => {
  const seen = new Set();
  return groups.flat().filter((item) => {
    const id = Number(item?.id);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const optionLabel = (option, fallback) => option?.name ?? fallback;

const OnboardingComboboxChipsStep = ({
  step,
  i18nKey,
  optionsKey,
  field,
  legacyField,
  customField,
  nextPath,
  onNext,
  isPending = false,
  nextLabel,
  oppositeField,
  oppositeCustomField,
  conflictI18nKey,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);

  const selected = useOnboardingStore((state) => state[field]);
  const legacySelected = useOnboardingStore((state) =>
    legacyField ? state[legacyField] : EMPTY_ARRAY,
  );
  const customValues = useOnboardingStore((state) => state[customField]);
  const oppositeSelected = useOnboardingStore((state) =>
    oppositeField ? state[oppositeField] : EMPTY_ARRAY,
  );
  const oppositeCustomValues = useOnboardingStore((state) =>
    oppositeCustomField ? state[oppositeCustomField] : EMPTY_ARRAY,
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);

  useOnboardingAutoSave("user", step);

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

  const { data, isLoading } = useGetQuery({
    url: "/user/onboarding/options",
    queryProps: {
      queryKey: ["onboarding", "options", step, optionsKey],
      staleTime: 60000,
    },
  });
  const { data: searchData, isFetching } = useGetQuery({
    url: "/user/onboarding/options",
    params: { q: searchLabel },
    queryProps: {
      queryKey: ["onboarding", "options", step, optionsKey, searchLabel],
      enabled: searchLabel.length >= 2,
      staleTime: 15000,
    },
  });

  const baseOptions = React.useMemo(
    () => extractOptions(data, optionsKey),
    [data, optionsKey],
  );
  const searchOptions = React.useMemo(
    () => extractOptions(searchData, optionsKey),
    [searchData, optionsKey],
  );
  const allOptions = React.useMemo(
    () => mergeOptions(baseOptions, searchOptions),
    [baseOptions, searchOptions],
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
    () =>
      new Set(oppositeCustomChips.map((value) => normalizeChipKey(value))),
    [oppositeCustomChips],
  );

  const visibleOptions = React.useMemo(() => {
    const source = searchLabel.length >= 2 ? searchOptions : baseOptions;
    return source.filter((item) => !oppositeIdSet.has(Number(item.id)));
  }, [baseOptions, oppositeIdSet, searchLabel.length, searchOptions]);
  const featuredOptions = React.useMemo(() => {
    const isFeatured = (item) =>
      optionsKey === "allergies"
        ? item?.isAllergic === true
        : item?.isOnboarding !== false;

    return baseOptions
      .filter((item) => isFeatured(item) && !oppositeIdSet.has(Number(item.id)))
      .slice(0, 8);
  }, [baseOptions, oppositeIdSet, optionsKey]);

  const exactVisibleMatch = visibleOptions.some(
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
    !exactVisibleMatch &&
    !hasChipLabel(customChips, searchLabel) &&
    !hasOppositeConflict;

  const selectedValues = React.useMemo(
    () => [
      ...selectedIds.map(toCatalogValue),
      ...customChips.map(toCustomValue),
    ],
    [customChips, selectedIds],
  );
  const customAddValue = canAddCustom ? toCustomValue(searchLabel) : null;
  const filteredItems = React.useMemo(
    () => [
      ...visibleOptions.map((item) => toCatalogValue(item.id)),
      ...(customAddValue ? [customAddValue] : []),
    ],
    [customAddValue, visibleOptions],
  );
  const items = React.useMemo(
    () => Array.from(new Set([...selectedValues, ...filteredItems])),
    [filteredItems, selectedValues],
  );

  const commitFields = React.useCallback(
    (nextIds, nextCustom = customChips) => {
      const normalizedIds = normalizeSelectedIds(nextIds).filter(
        (id) => !oppositeIdSet.has(id),
      );
      const normalizedCustom = normalizeCustomChips(nextCustom).filter(
        (label) => !oppositeCustomKeySet.has(normalizeChipKey(label)),
      );
      const fields = {
        [field]: normalizedIds,
        [customField]: normalizedCustom,
      };

      if (legacyField) {
        fields[legacyField] = normalizedIds;
      }

      setFields(fields);
    },
    [
      customChips,
      customField,
      field,
      legacyField,
      oppositeCustomKeySet,
      oppositeIdSet,
      setFields,
    ],
  );

  const toggleFeaturedOption = React.useCallback(
    (option) => {
      const id = Number(option?.id);
      if (!Number.isInteger(id) || id <= 0 || oppositeIdSet.has(id)) {
        return;
      }

      const nextIds = selectedIdSet.has(id)
        ? selectedIds.filter((value) => value !== id)
        : [...selectedIds, id];

      commitFields(nextIds, customChips);
    },
    [
      commitFields,
      customChips,
      oppositeIdSet,
      selectedIdSet,
      selectedIds,
    ],
  );

  const handleValueChange = React.useCallback(
    (nextValue) => {
      const nextItems = Array.isArray(nextValue) ? nextValue : [];
      const nextIds = [];
      const nextCustom = [];
      let addedCustom = false;

      nextItems.forEach((value) => {
        if (isCatalogValue(value)) {
          const id = fromCatalogValue(value);
          if (Number.isInteger(id) && id > 0 && !oppositeIdSet.has(id)) {
            nextIds.push(id);
          }
          return;
        }

        if (isCustomValue(value)) {
          const label = normalizeChipLabel(fromCustomValue(value));
          if (
            label &&
            !oppositeCustomKeySet.has(normalizeChipKey(label))
          ) {
            nextCustom.push(label);
            if (label === searchLabel) {
              addedCustom = true;
            }
          }
        }
      });

      commitFields(nextIds, nextCustom);
      if (addedCustom) {
        setSearch("");
      }
    },
    [
      commitFields,
      oppositeCustomKeySet,
      oppositeIdSet,
      searchLabel,
    ],
  );

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), step]),
      ),
    });
  }, [completedSteps, setFields, step]);

  const goNext = React.useCallback(async () => {
    markCompleted();
    if (onNext) {
      await onNext();
      return;
    }
    navigate(nextPath);
  }, [markCompleted, navigate, nextPath, onNext]);

  const footerContent = React.useMemo(
    () => (
      <div className="grid grid-cols-[0.42fr_1fr] gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={goNext}
          disabled={isPending}
        >
          {t("onboarding.skip")}
        </Button>
        <Button
          type="button"
          className={cn(
            "h-12 border-transparent bg-gradient-to-r",
            tone.buttonTone,
          )}
          size="lg"
          onClick={goNext}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              {t("onboarding.saving")}
            </>
          ) : (
            <>
              {nextLabel ?? t("onboarding.next")}
              <ChevronRightIcon className="size-4" />
            </>
          )}
        </Button>
      </div>
    ),
    [goNext, isPending, nextLabel, t],
  );
  useOnboardingFooter(footerContent);

  const selectedCount = selectedIds.length + customChips.length;
  const valueToLabel = React.useCallback(
    (value) => {
      if (isCatalogValue(value)) {
        const id = fromCatalogValue(value);
        return optionLabel(optionMap.get(id), `#${id}`);
      }

      if (isCustomValue(value)) {
        return fromCustomValue(value);
      }

      return String(value);
    },
    [optionMap],
  );

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t(`${i18nKey}.title`)} />

        <motion.div
          className={cn(
            "mx-auto mb-3 w-full rounded-2xl border bg-background/90 px-3 py-3 backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">{t(`${i18nKey}.description`)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("onboarding.chipSelect.selectedCount", { count: selectedCount })}
          </p>
        </motion.div>

        {featuredOptions.length ? (
          <div className="mb-3 rounded-2xl border bg-background/90 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {t(
                    optionsKey === "allergies"
                      ? `${i18nKey}.featuredTitle`
                      : "onboarding.chipSelect.featuredTitle",
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("onboarding.chipSelect.featuredDescription")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {featuredOptions.map((option) => {
                const id = Number(option.id);
                const isSelected = selectedIdSet.has(id);

                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={isSelected}
                    className={cn(
                      "min-h-20 rounded-2xl border bg-background px-3 py-2 text-left transition",
                      "hover:border-primary/50 hover:bg-primary/5",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border",
                    )}
                    onClick={() => toggleFeaturedOption(option)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-sm font-semibold text-foreground">
                        {optionLabel(option, `#${id}`)}
                      </span>
                      {isSelected ? (
                        <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                      ) : null}
                    </div>
                    <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {option?.isAllergic
                        ? t("onboarding.chipSelect.allergicBadge")
                        : t("onboarding.chipSelect.recommendedBadge")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div
          ref={containerRef}
          className="rounded-2xl border bg-background/90 p-3"
          onFocusCapture={() => setIsOpen(true)}
          onBlurCapture={(event) => {
            if (!containerRef.current?.contains(event.relatedTarget)) {
              setIsOpen(false);
              setSearch("");
            }
          }}
        >
          <Combobox
            inline
            multiple
            autoHighlight
            items={items}
            filteredItems={filteredItems}
            value={selectedValues}
            inputValue={search}
            onInputValueChange={setSearch}
            isItemEqualToValue={(item, value) => item === value}
            itemToStringLabel={valueToLabel}
            onValueChange={handleValueChange}
          >
            <ComboboxChips className="min-h-14 w-full rounded-3xl bg-background px-3 py-2 text-base">
              <ComboboxValue>
                {(nextValues) => (
                  <>
                    {nextValues.map((item) => (
                      <ComboboxChip key={item} className="h-8 rounded-xl text-sm">
                        {valueToLabel(item)}
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput
                      placeholder={t(`${i18nKey}.placeholder`)}
                      className="min-h-8 text-base"
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>

            {isOpen ? (
              <div className="mt-3 rounded-2xl border bg-background shadow-sm">
                {isLoading ? (
                  <div className="flex min-h-24 items-center justify-center">
                    <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredItems.length ? (
                  <ComboboxList className="max-h-60 p-1">
                    {(item) => {
                      if (isCustomValue(item)) {
                        const label = fromCustomValue(item);
                        return (
                          <ComboboxItem key={item} value={item}>
                            <PlusIcon className="size-4 text-primary" />
                            <span className="font-semibold">
                              {t("onboarding.chipSelect.addCustom", {
                                value: label,
                              })}
                            </span>
                          </ComboboxItem>
                        );
                      }

                      const id = fromCatalogValue(item);
                      const option = optionMap.get(id);
                      const isSelected = selectedIdSet.has(id);

                      return (
                        <ComboboxItem key={item} value={item}>
                          {option?.imageUrl ? (
                            <img
                              src={option.imageUrl}
                              alt=""
                              className="size-8 rounded-lg object-cover"
                            />
                          ) : null}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {optionLabel(option, `#${id}`)}
                            </span>
                            {option && option.isOnboarding === false ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {t("onboarding.chipSelect.nonOnboarding")}
                              </span>
                            ) : isSelected ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {t("onboarding.chipSelect.selected")}
                              </span>
                            ) : null}
                          </span>
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    {t("onboarding.chipSelect.empty")}
                  </div>
                )}
              </div>
            ) : null}
          </Combobox>

          {searchLabel.length >= 2 && isFetching ? (
            <div className="mt-2 flex justify-center py-1">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {hasOppositeConflict && conflictI18nKey ? (
            <div className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
              {t(conflictI18nKey)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OnboardingComboboxChipsStep;
