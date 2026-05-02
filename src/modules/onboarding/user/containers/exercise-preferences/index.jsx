import React from "react";
import { motion } from "framer-motion";
import {
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGetQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store";
import { OnboardingQuestion } from "@/modules/onboarding/components/onboarding-question";
import { useOnboardingAutoSave } from "@/modules/onboarding/lib/use-auto-save";
import { useOnboardingFooter } from "@/modules/onboarding/lib/onboarding-footer-context";
import PageAura from "../../components/page-aura.jsx";
import { ONBOARDING_ACCENTS } from "../../lib/tones.js";
import {
  hasChipLabel,
  normalizeChipKey,
  normalizeChipLabel,
  normalizeCustomChips,
  normalizeSelectedIds,
} from "../../lib/chip-selection.js";

const tone = ONBOARDING_ACCENTS.green;

const EMPTY_ARRAY = Object.freeze([]);

const MODES = [
  {
    key: "preferred",
    icon: ThumbsUpIcon,
    idsField: "preferredExerciseIds",
    customField: "customPreferredExercises",
  },
  {
    key: "disliked",
    icon: ThumbsDownIcon,
    idsField: "dislikedExerciseIds",
    customField: "customDislikedExercises",
  },
];

const extractOptions = (response) => {
  const body = response?.data?.data ?? response?.data ?? {};
  return Array.isArray(body?.exercises) ? body.exercises : [];
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

const selectedClass = {
  preferred:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  disliked: "border-rose-500/25 bg-rose-500/10 text-rose-700",
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState("preferred");
  const [search, setSearch] = React.useState("");
  const preferredIdsRaw = useOnboardingStore(
    (state) => state.preferredExerciseIds ?? EMPTY_ARRAY,
  );
  const dislikedIdsRaw = useOnboardingStore(
    (state) => state.dislikedExerciseIds ?? EMPTY_ARRAY,
  );
  const preferredCustomRaw = useOnboardingStore(
    (state) => state.customPreferredExercises ?? EMPTY_ARRAY,
  );
  const dislikedCustomRaw = useOnboardingStore(
    (state) => state.customDislikedExercises ?? EMPTY_ARRAY,
  );
  const completedSteps = useOnboardingStore(
    (state) => state.completedUserOnboardingSteps,
  );
  const setFields = useOnboardingStore((state) => state.setFields);

  useOnboardingAutoSave("user", "exercise-preferences");

  const preferredIds = React.useMemo(
    () => normalizeSelectedIds(preferredIdsRaw),
    [preferredIdsRaw],
  );
  const dislikedIds = React.useMemo(
    () => normalizeSelectedIds(dislikedIdsRaw),
    [dislikedIdsRaw],
  );
  const preferredCustom = React.useMemo(
    () => normalizeCustomChips(preferredCustomRaw),
    [preferredCustomRaw],
  );
  const dislikedCustom = React.useMemo(
    () => normalizeCustomChips(dislikedCustomRaw),
    [dislikedCustomRaw],
  );
  const activeMeta = MODES.find((item) => item.key === mode) ?? MODES[0];
  const activeIds = mode === "preferred" ? preferredIds : dislikedIds;
  const activeCustom = mode === "preferred" ? preferredCustom : dislikedCustom;
  const oppositeIds = mode === "preferred" ? dislikedIds : preferredIds;
  const oppositeCustom =
    mode === "preferred" ? dislikedCustom : preferredCustom;
  const searchLabel = normalizeChipLabel(search);
  const searchKey = normalizeChipKey(searchLabel);

  const { data, isLoading } = useGetQuery({
    url: "/user/onboarding/options",
    queryProps: {
      queryKey: ["onboarding", "options", "exercise-preferences", "exercises"],
      staleTime: 60000,
    },
  });
  const { data: searchData, isFetching } = useGetQuery({
    url: "/user/onboarding/options",
    params: { q: searchLabel },
    queryProps: {
      queryKey: [
        "onboarding",
        "options",
        "exercise-preferences",
        "exercises",
        searchLabel,
      ],
      enabled: searchLabel.length >= 2,
      staleTime: 15000,
    },
  });

  const baseOptions = React.useMemo(() => extractOptions(data), [data]);
  const searchOptions = React.useMemo(
    () => extractOptions(searchData),
    [searchData],
  );
  const options = React.useMemo(
    () => mergeOptions(baseOptions, searchOptions),
    [baseOptions, searchOptions],
  );
  const oppositeIdSet = React.useMemo(() => new Set(oppositeIds), [oppositeIds]);
  const visibleOptions = React.useMemo(
    () =>
      (searchLabel.length >= 2 ? searchOptions : baseOptions).filter(
        (item) => !oppositeIdSet.has(Number(item.id)),
      ),
    [baseOptions, oppositeIdSet, searchLabel.length, searchOptions],
  );
  const selectedOptionMap = React.useMemo(
    () => new Map(options.map((item) => [Number(item.id), item])),
    [options],
  );
  const activeIdSet = React.useMemo(() => new Set(activeIds), [activeIds]);
  const oppositeCustomKeySet = React.useMemo(
    () => new Set(oppositeCustom.map((value) => normalizeChipKey(value))),
    [oppositeCustom],
  );
  const exactActiveMatch = options.some(
    (item) => normalizeChipKey(item.name) === searchKey,
  );
  const conflictsWithOppositeId = options.some(
    (item) =>
      oppositeIdSet.has(Number(item.id)) &&
      normalizeChipKey(item.name) === searchKey,
  );
  const conflictsWithOppositeCustom = oppositeCustomKeySet.has(searchKey);
  const hasOppositeConflict =
    searchLabel.length >= 2 &&
    (conflictsWithOppositeId || conflictsWithOppositeCustom);
  const canAddCustom =
    searchLabel.length >= 2 &&
    !exactActiveMatch &&
    !hasChipLabel(activeCustom, searchLabel) &&
    !hasOppositeConflict;

  const commit = React.useCallback(
    (next) => {
      setFields({
        preferredExerciseIds: normalizeSelectedIds(
          next.preferredExerciseIds ?? preferredIds,
        ),
        dislikedExerciseIds: normalizeSelectedIds(
          next.dislikedExerciseIds ?? dislikedIds,
        ),
        customPreferredExercises: normalizeCustomChips(
          next.customPreferredExercises ?? preferredCustom,
        ),
        customDislikedExercises: normalizeCustomChips(
          next.customDislikedExercises ?? dislikedCustom,
        ),
      });
    },
    [dislikedCustom, dislikedIds, preferredCustom, preferredIds, setFields],
  );

  const toggleOption = React.useCallback(
    (item) => {
      const id = Number(item.id);
      if (!Number.isInteger(id) || id <= 0) return;
      if (oppositeIdSet.has(id)) return;

      if (mode === "preferred") {
        const nextPreferred = activeIdSet.has(id)
          ? preferredIds.filter((value) => value !== id)
          : [...preferredIds, id];
        commit({
          preferredExerciseIds: nextPreferred,
        });
        return;
      }

      const nextDisliked = activeIdSet.has(id)
        ? dislikedIds.filter((value) => value !== id)
        : [...dislikedIds, id];
      commit({
        dislikedExerciseIds: nextDisliked,
      });
    },
    [activeIdSet, commit, dislikedIds, mode, oppositeIdSet, preferredIds],
  );

  const addCustom = React.useCallback(() => {
    if (!canAddCustom) return;

    if (mode === "preferred") {
      commit({
        customPreferredExercises: [...preferredCustom, searchLabel],
      });
    } else {
      commit({
        customDislikedExercises: [...dislikedCustom, searchLabel],
      });
    }

    setSearch("");
  }, [
    canAddCustom,
    commit,
    dislikedCustom,
    mode,
    preferredCustom,
    searchLabel,
  ]);

  const removeId = React.useCallback(
    (targetMode, id) => {
      commit(
        targetMode === "preferred"
          ? { preferredExerciseIds: preferredIds.filter((value) => value !== id) }
          : { dislikedExerciseIds: dislikedIds.filter((value) => value !== id) },
      );
    },
    [commit, dislikedIds, preferredIds],
  );

  const removeCustom = React.useCallback(
    (targetMode, label) => {
      const key = normalizeChipKey(label);
      commit(
        targetMode === "preferred"
          ? {
              customPreferredExercises: preferredCustom.filter(
                (value) => normalizeChipKey(value) !== key,
              ),
            }
          : {
              customDislikedExercises: dislikedCustom.filter(
                (value) => normalizeChipKey(value) !== key,
              ),
            },
      );
    },
    [commit, dislikedCustom, preferredCustom],
  );

  const markCompleted = React.useCallback(() => {
    setFields({
      completedUserOnboardingSteps: Array.from(
        new Set([...(completedSteps ?? []), "exercise-preferences"]),
      ),
    });
  }, [completedSteps, setFields]);

  React.useEffect(() => {
    const preferredIdSet = new Set(preferredIds);
    const nextDislikedIds = dislikedIds.filter((id) => !preferredIdSet.has(id));
    const preferredCustomKeySet = new Set(
      preferredCustom.map((value) => normalizeChipKey(value)),
    );
    const nextDislikedCustom = dislikedCustom.filter(
      (value) => !preferredCustomKeySet.has(normalizeChipKey(value)),
    );

    if (
      nextDislikedIds.length !== dislikedIds.length ||
      nextDislikedCustom.length !== dislikedCustom.length
    ) {
      setFields({
        dislikedExerciseIds: nextDislikedIds,
        customDislikedExercises: nextDislikedCustom,
      });
    }
  }, [dislikedCustom, dislikedIds, preferredCustom, preferredIds, setFields]);

  const goNext = React.useCallback(() => {
    markCompleted();
    navigate("/user/onboarding/meal-frequency");
  }, [markCompleted, navigate]);

  useOnboardingFooter(
    <div className="grid grid-cols-[0.42fr_1fr] gap-2">
      <Button type="button" variant="outline" className="h-12" onClick={goNext}>
        {t("onboarding.skip")}
      </Button>
      <Button
        type="button"
        className={cn("h-12 border-transparent bg-gradient-to-r", tone.buttonTone)}
        onClick={goNext}
      >
        {t("onboarding.next")}
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>,
  );

  const selectedCount =
    preferredIds.length +
    dislikedIds.length +
    preferredCustom.length +
    dislikedCustom.length;

  return (
    <div className="relative flex h-full max-h-full flex-1 flex-col overflow-hidden px-5 pt-3 md:pt-8">
      <PageAura tone={tone} />
      <div className="relative z-10 flex h-full w-full flex-1 flex-col md:mx-auto md:max-w-4xl">
        <OnboardingQuestion question={t("onboarding.workoutSteps.exercises.title")} />

        <motion.div
          className={cn(
            "mx-auto mb-3 w-full rounded-2xl border bg-background/90 px-3 py-3 backdrop-blur",
            tone.border,
          )}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold">
            {t("onboarding.workoutSteps.exercises.description")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("onboarding.chipSelect.selectedCount", { count: selectedCount })}
          </p>
        </motion.div>

        <div className="rounded-2xl border bg-background/90 p-3">
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((item) => {
              const Icon = item.icon;
              const isActive = mode === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-colors",
                    isActive
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {t(`onboarding.workoutSteps.exercises.modes.${item.key}`)}
                </button>
              );
            })}
          </div>

          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("onboarding.workoutSteps.exercises.placeholder")}
              className="h-11 pl-9"
            />
          </div>

          {selectedCount > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["preferred", preferredIds, preferredCustom],
                ["disliked", dislikedIds, dislikedCustom],
              ].flatMap(([targetMode, ids, custom]) => [
                ...ids.map((id) => (
                  <button
                    key={`${targetMode}-${id}`}
                    type="button"
                    className={cn(
                      "inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      selectedClass[targetMode],
                    )}
                    onClick={() => removeId(targetMode, id)}
                  >
                    <span className="truncate">
                      {selectedOptionMap.get(id)?.name ?? `#${id}`}
                    </span>
                    <XIcon className="size-3.5 shrink-0" />
                  </button>
                )),
                ...custom.map((label) => (
                  <button
                    key={`${targetMode}-${label}`}
                    type="button"
                    className={cn(
                      "inline-flex max-w-full items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      selectedClass[targetMode],
                    )}
                    onClick={() => removeCustom(targetMode, label)}
                  >
                    <span className="truncate">{label}</span>
                    <XIcon className="size-3.5 shrink-0" />
                  </button>
                )),
              ])}
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
              const isActive = activeIdSet.has(id);

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
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.name}</span>
                    {item.categories?.length ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.categories.map((category) => category.name).join(", ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background">
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

          {hasOppositeConflict ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700">
              {t("onboarding.workoutSteps.exercises.conflict")}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Index;
