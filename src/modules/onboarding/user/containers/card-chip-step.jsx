import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const extractOptions = (response, optionsKey) => {
  const body = response?.data?.data ?? response?.data ?? {};
  const values = body?.[optionsKey];
  return Array.isArray(values) ? values : [];
};

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

const optionLabel = (option, fallback) => option?.name ?? fallback;

const ensureEllipsis = (value) => {
  const label = String(value ?? "").trim();
  if (!label) return "";
  return label.endsWith("…") ? label : `${label.replace(/\.\.\.$/, "")}…`;
};

const getOptionBadgeKey = (option, optionsKey) => {
  if (option?.isOnboarding === false)
    return "onboarding.chipSelect.nonOnboarding";
  if (optionsKey === "allergies" && option?.isAllergic) {
    return "onboarding.chipSelect.allergicBadge";
  }
  return "onboarding.chipSelect.recommendedBadge";
};

const OnboardingCardChipStep = ({
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
  const [search, setSearch] = React.useState("");
  const [otherOpen, setOtherOpen] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const deferredSearch = React.useDeferredValue(search);

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

  const { data, isLoading, isError } = useGetQuery({
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
    () => new Set(oppositeCustomChips.map((value) => normalizeChipKey(value))),
    [oppositeCustomChips],
  );

  const cardOptions = React.useMemo(
    () => baseOptions.filter((item) => !oppositeIdSet.has(Number(item.id))),
    [baseOptions, oppositeIdSet],
  );
  const searchResults = React.useMemo(
    () =>
      (searchLabel.length >= 2 ? searchOptions : []).filter(
        (item) => !oppositeIdSet.has(Number(item.id)),
      ),
    [oppositeIdSet, searchLabel.length, searchOptions],
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
              <Loader2Icon
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
              {t("onboarding.saving")}
            </>
          ) : (
            <>
              {nextLabel ?? t("onboarding.next")}
              <ChevronRightIcon className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    ),
    [goNext, isPending, nextLabel, t],
  );
  useOnboardingFooter(footerContent);

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
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        >
          <p className="text-sm font-semibold">{t(`${i18nKey}.description`)}</p>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {t("onboarding.chipSelect.selectedCount", { count: selectedCount })}
          </p>
        </motion.div>

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
                    {optionLabel(option, `#${id}`)}
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

        <div className="grid flex-1 content-start gap-2 overflow-y-auto pb-5">
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
            cardOptions.map((item) => {
              const id = Number(item.id);
              const isActive = selectedIdSet.has(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleOption(item)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex min-h-[72px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:min-h-[84px] md:px-4",
                    isActive
                      ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                      : "border-border/70 bg-background/90",
                  )}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      width="44"
                      height="44"
                      className="size-11 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                        isActive
                          ? tone.badgeTone
                          : "bg-muted text-muted-foreground",
                      )}
                      aria-hidden="true"
                    >
                      <CheckIcon
                        className={cn(
                          "size-5",
                          isActive ? tone.textTone : "text-transparent",
                        )}
                      />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-bold leading-snug">
                      {optionLabel(item, `#${id}`)}
                    </span>
                    <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {t(getOptionBadgeKey(item, optionsKey))}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isActive
                        ? `${tone.border} bg-background/70`
                        : "border-border bg-background",
                    )}
                    aria-hidden="true"
                  >
                    <CheckIcon
                      className={cn(
                        "size-4",
                        isActive ? tone.textTone : "text-transparent",
                      )}
                    />
                  </span>
                </button>
              );
            })
          )}

          <section
            className={cn(
              "rounded-2xl border border-dashed bg-background/90 p-3",
              otherOpen ? tone.border : "border-border/70",
            )}
          >
            <button
              type="button"
              onClick={() => setOtherOpen((value) => !value)}
              aria-expanded={otherOpen}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-xl text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:min-h-[64px]"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  tone.badgeTone,
                )}
              >
                <PlusIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">
                  {t("onboarding.chipSelect.otherTitle")}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("onboarding.chipSelect.otherDescription")}
                </span>
              </span>
            </button>

            {otherOpen ? (
              <div className="mt-3 border-t pt-3">
                <label
                  htmlFor={`${step}-other-search`}
                  className="mb-2 block text-xs font-semibold text-muted-foreground"
                >
                  {t("onboarding.chipSelect.searchLabel")}
                </label>
                <div className="relative">
                  <SearchIcon
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id={`${step}-other-search`}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    name={`${step}-other-search`}
                    autoComplete="off"
                    placeholder={ensureEllipsis(t(`${i18nKey}.placeholder`))}
                    className="h-12 pl-9"
                  />
                </div>

                <div className="mt-3 grid gap-2">
                  {searchLabel.length < 2 ? (
                    <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                      {t("onboarding.chipSelect.searchHint")}
                    </p>
                  ) : isFetching ? (
                    <div className="flex min-h-16 items-center justify-center">
                      <Loader2Icon
                        className="size-5 animate-spin text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  ) : searchResults.length ? (
                    searchResults.map((item) => {
                      const id = Number(item.id);
                      const isActive = selectedIdSet.has(id);

                      return (
                        <button
                          key={`search-${id}`}
                          type="button"
                          onClick={() => toggleOption(item)}
                          aria-pressed={isActive}
                          className={cn(
                            "flex min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            isActive
                              ? `${tone.border} ${tone.badgeTone}`
                              : "border-border/70 bg-background",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {optionLabel(item, `#${id}`)}
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

                  {hasOppositeConflict && conflictI18nKey ? (
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
                      {t(conflictI18nKey)}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCardChipStep;
