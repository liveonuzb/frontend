import React from "react";
import { motion } from "framer-motion";
import { CheckIcon, ChevronRightIcon, Loader2Icon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
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

const OnboardingChipSuggestionStep = ({
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
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selected = useOnboardingStore((state) => state[field]);
  const legacySelected = useOnboardingStore((state) =>
    legacyField ? state[legacyField] : EMPTY_ARRAY,
  );
  const customValues = useOnboardingStore((state) => state[customField]);
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);
  const [search, setSearch] = React.useState("");
  const selectedIds = normalizeSelectedIds(
    selected?.length ? selected : legacySelected,
  );
  const customChips = normalizeCustomChips(customValues);
  const searchLabel = normalizeChipLabel(search);
  const searchKey = normalizeChipKey(searchLabel);

  useOnboardingAutoSave("user", step);

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
  const options = React.useMemo(
    () => mergeOptions(baseOptions, searchOptions),
    [baseOptions, searchOptions],
  );
  const visibleOptions = searchLabel.length >= 2 ? searchOptions : baseOptions;
  const selectedOptionMap = React.useMemo(
    () => new Map(options.map((item) => [Number(item.id), item])),
    [options],
  );
  const selectedIdSet = React.useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );
  const exactActiveMatch = options.some(
    (item) => normalizeChipKey(item.name) === searchKey,
  );
  const canAddCustom =
    searchLabel.length >= 2 &&
    !exactActiveMatch &&
    !hasChipLabel(customChips, searchLabel);

  const commitFields = React.useCallback(
    (nextIds, nextCustom = customChips) => {
      const normalizedIds = normalizeSelectedIds(nextIds);
      const fields = {
        [field]: normalizedIds,
        [customField]: normalizeCustomChips(nextCustom),
      };

      if (legacyField) {
        fields[legacyField] = normalizedIds;
      }

      setFields(fields);
    },
    [customChips, customField, field, legacyField, setFields],
  );

  const toggleOption = React.useCallback(
    (item) => {
      const id = Number(item.id);
      if (!Number.isInteger(id) || id <= 0) return;

      commitFields(
        selectedIdSet.has(id)
          ? selectedIds.filter((value) => value !== id)
          : [...selectedIds, id],
      );
    },
    [commitFields, selectedIdSet, selectedIds],
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

  const handleNext = React.useCallback(async () => {
    markCompleted();
    if (onNext) {
      await onNext();
      return;
    }
    navigate(nextPath);
  }, [markCompleted, navigate, nextPath, onNext]);

  const handleSkip = React.useCallback(async () => {
    markCompleted();
    if (onNext) {
      await onNext();
      return;
    }
    navigate(nextPath);
  }, [markCompleted, navigate, nextPath, onNext]);

  const selectedCount = selectedIds.length + customChips.length;

  const footerContent = React.useMemo(
    () => (
      <div className="grid grid-cols-[0.42fr_1fr] gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-12"
          onClick={handleSkip}
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
          onClick={handleNext}
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
    [handleNext, handleSkip, isPending, nextLabel, t],
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">{t(`${i18nKey}.description`)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("onboarding.chipSelect.selectedCount", { count: selectedCount })}
          </p>
        </motion.div>

        <div className="rounded-2xl border bg-background/90 p-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(`${i18nKey}.placeholder`)}
              className="h-11 pl-9"
            />
          </div>

          {selectedCount > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const option = selectedOptionMap.get(id);
                return (
                  <button
                    key={`selected-${id}`}
                    type="button"
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    onClick={() =>
                      commitFields(selectedIds.filter((value) => value !== id))
                    }
                  >
                    <span className="truncate">{option?.name ?? `#${id}`}</span>
                    <XIcon className="size-3.5 shrink-0" />
                  </button>
                );
              })}
              {customChips.map((label) => (
                <button
                  key={`custom-${label}`}
                  type="button"
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                  onClick={() => removeCustom(label)}
                >
                  <span className="truncate">{label}</span>
                  <XIcon className="size-3.5 shrink-0" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid flex-1 content-start gap-2 overflow-y-auto pb-5">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            visibleOptions.map((item) => {
              const id = Number(item.id);
              const isActive = selectedIdSet.has(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleOption(item)}
                  className={cn(
                    "flex min-h-[58px] items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-all",
                    isActive
                      ? `bg-gradient-to-br ${tone.cardTone} ${tone.border}`
                      : "border-border/70 bg-background/90 hover:border-primary/30",
                  )}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className={cn("size-10 shrink-0 rounded-xl", tone.badgeTone)} />
                  )}
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    {item.name}
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isActive ? "bg-background/70" : "bg-background",
                    )}
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

          {searchLabel.length >= 2 && isFetching ? (
            <div className="flex justify-center py-2">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {canAddCustom ? (
            <button
              type="button"
              onClick={addCustom}
              className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-left text-sm font-semibold text-primary"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <PlusIcon className="size-4" />
              </span>
              {t("onboarding.chipSelect.addCustom", { value: searchLabel })}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OnboardingChipSuggestionStep;
