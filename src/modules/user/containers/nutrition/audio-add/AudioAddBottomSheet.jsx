import React from "react";
import {
  AlertCircleIcon,
  CheckIcon,
  Loader2Icon,
  MicIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import filter from "lodash/filter";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import { toast } from "sonner";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Input } from "@/components/ui/input.jsx";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking.js";
import { cn } from "@/lib/utils";
import { NutritionDrawerContent } from "../nutrition-drawer-layout.jsx";
import {
  MealDraftCard,
  MealDraftSummaryCard,
} from "../meal-draft-review.jsx";
import {
  buildMealPayloadFromDraft,
  getDraftImageUrl,
} from "../meal-draft-review-utils.js";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "../meal-ingredients.js";
import { useLiveKitVoiceAgentSession } from "./useLiveKitVoiceAgentSession.js";

const stateLabels = {
  connecting: "Ulanmoqda",
  listening: "Tinglayapti",
  thinking: "O'ylayapti",
  speaking: "Gapiryapti",
  reviewing: "Tekshiruv",
  error: "Xatolik",
};

const auraStateByAgentState = {
  connecting: "connecting",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  reviewing: "thinking",
  error: "failed",
};

const moodOptions = [
  { value: "amazing", label: "Ajoyib" },
  { value: "good", label: "Yaxshi" },
  { value: "neutral", label: "O'rtacha" },
  { value: "tired", label: "Charchagan" },
  { value: "bad", label: "Yomon" },
];

const todayKey = () => new Date().toISOString().split("T")[0];

const getTargetDate = (dateKey) => dateKey || todayKey();

const toPositiveInteger = (value, fallback = 0) => {
  const next = Math.round(toNumber(value, fallback));

  return Number.isFinite(next) && next > 0 ? next : fallback;
};

const getDraftKindLabel = (kind) => {
  if (kind === "meal") return "Ovqat";
  if (kind === "water") return "Suv";
  if (kind === "workout") return "Mashq";
  if (kind === "mood") return "Kayfiyat";
  return "Natija";
};

const normalizeMood = (value) => {
  const normalized = trim(String(value || "")).toLowerCase();

  if (["amazing", "super", "zor", "zo'r", "excellent"].includes(normalized)) {
    return "amazing";
  }
  if (["good", "yaxshi", "хорошо"].includes(normalized)) return "good";
  if (["tired", "charchagan", "устал"].includes(normalized)) return "tired";
  if (["bad", "yomon", "плохо"].includes(normalized)) return "bad";
  return "neutral";
};

const getInitialReview = (draft) => {
  if (!draft) {
    return null;
  }

  if (draft.kind === "water") {
    return {
      amountMl: toPositiveInteger(draft.payload?.amountMl, 0),
      time: trim(String(draft.payload?.time || "")),
    };
  }

  if (draft.kind === "workout") {
    return {
      activity: trim(String(draft.payload?.activity || "Mashq")),
      minutes: toPositiveInteger(draft.payload?.minutes, 0),
      kcal: toPositiveInteger(draft.payload?.kcal, 0),
      time: trim(String(draft.payload?.time || "")),
    };
  }

  if (draft.kind === "mood") {
    return {
      mood: normalizeMood(draft.payload?.mood),
      note: trim(String(draft.payload?.note || draft.transcript || "")),
      time: trim(String(draft.payload?.time || "")),
    };
  }

  return null;
};

const AudioAddBottomSheet = ({
  open = true,
  dateKey,
  mealType = "breakfast",
  loggedAt,
  agentReadyTimeoutMs,
  onOpenChange,
  onClose,
  onSubmitted,
}) => {
  const actions = useDailyTrackingActions();
  const {
    agentState,
    connected,
    agentAudioTrack,
    transcript,
    draftResult,
    error,
    retry,
    disconnect,
  } = useLiveKitVoiceAgentSession({ autoStart: open, agentReadyTimeoutMs });
  const [review, setReview] = React.useState(null);
  const [mealItems, setMealItems] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setReview(getInitialReview(draftResult));
    setMealItems(draftResult?.kind === "meal" ? draftResult.payload.items : []);
  }, [draftResult]);

  const updateReview = React.useCallback((field, value) => {
    setReview((current) => ({ ...(current || {}), [field]: value }));
  }, []);

  const handleCancel = React.useCallback(() => {
    disconnect();
    onClose?.();
    onOpenChange?.(false);
  }, [disconnect, onClose, onOpenChange]);

  const handleDrawerOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        onOpenChange?.(true);
        return;
      }

      handleCancel();
    },
    [handleCancel, onOpenChange],
  );

  const handleIngredientUpdate = React.useCallback(
    (draftId, ingredientId, patch) => {
      setMealItems((current) =>
        map(current, (item) =>
          item.id === draftId
            ? {
                ...item,
                ingredients: updateMealIngredient(
                  item.ingredients,
                  ingredientId,
                  patch,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleIngredientRemove = React.useCallback((draftId, ingredientId) => {
    setMealItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: removeMealIngredient(item.ingredients, ingredientId),
            }
          : item,
      ),
    );
  }, []);

  const handleIngredientAdd = React.useCallback((draftId, ingredient) => {
    setMealItems((current) =>
      map(current, (item) =>
        item.id === draftId
          ? {
              ...item,
              ingredients: addMealIngredient(item.ingredients, ingredient),
            }
          : item,
      ),
    );
  }, []);

  const handleRemoveMealItem = React.useCallback((draftId) => {
    setMealItems((current) => filter(current, (item) => item.id !== draftId));
  }, []);

  const saveDraft = React.useCallback(async () => {
    if (!draftResult || saving) {
      return;
    }

    const targetDate = getTargetDate(dateKey);
    setSaving(true);

    try {
      if (draftResult.kind === "meal") {
        if (!mealItems.length) {
          throw new Error("Ovqat topilmadi.");
        }

        for (const item of mealItems) {
          await actions.addMeal(targetDate, mealType || "breakfast", {
            ...buildMealPayloadFromDraft(item, {
              source: "audio",
              image: getDraftImageUrl(item),
              addedAt: loggedAt || undefined,
            }),
            addedFromPlan: false,
          });
        }
      }

      if (draftResult.kind === "water") {
        const amountMl = toPositiveInteger(review?.amountMl, 0);
        if (!amountMl) {
          throw new Error("Suv miqdorini kiriting.");
        }
        await actions.addWaterCup(targetDate, amountMl);
      }

      if (draftResult.kind === "workout") {
        const minutes = toPositiveInteger(review?.minutes, 0);
        const kcal = toPositiveInteger(review?.kcal, 0);
        if (!minutes && !kcal) {
          throw new Error("Mashq davomiyligi yoki kaloriyasini kiriting.");
        }
        await actions.addWorkout(targetDate, minutes, kcal);
      }

      if (draftResult.kind === "mood") {
        await actions.setMood(targetDate, normalizeMood(review?.mood));
      }

      toast.success("Audio natija saqlandi.");
      disconnect();
      onSubmitted?.({
        ...draftResult,
        payload: draftResult.kind === "meal" ? { items: mealItems } : review,
      });
      onClose?.();
      onOpenChange?.(false);
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Audio natija saqlanmadi.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    actions,
    dateKey,
    draftResult,
    loggedAt,
    mealItems,
    mealType,
    disconnect,
    onClose,
    onOpenChange,
    onSubmitted,
    review,
    saving,
  ]);

  const transcriptText = transcript.finalText || transcript.partialText;
  const showSave = Boolean(draftResult);

  return (
    <Drawer
      open={open}
      onOpenChange={handleDrawerOpenChange}
      direction="bottom"
    >
      <NutritionDrawerContent size="lg">
        <DrawerHeader className="shrink-0 border-b border-border/40 px-4 py-3 text-left sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MicIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <DrawerTitle className="truncate text-left text-lg font-bold">
                  Ovozli agent
                </DrawerTitle>
                <DrawerDescription className="sr-only">
                  LiveKit Agents UI Aura bilan ovozli nutrition agent sessiyasi.
                </DrawerDescription>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full",
                      agentState === "error" && "bg-red-50 text-red-700",
                      agentState === "reviewing" &&
                        "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {agentState === "error" ? (
                      <AlertCircleIcon className="size-3.5" />
                    ) : null}
                    {stateLabels[agentState] || stateLabels.connecting}
                  </Badge>
                  {connected ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      LiveKit
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={retry}
                aria-label="Qayta urinish"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                aria-label="Yopish"
              >
                <XIcon className="size-5" />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="px-0 pb-0" data-vaul-no-drag>
          <main className="grid min-h-[58vh] grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-1">
            <section className="flex flex-col items-center justify-center gap-5 px-5 py-6 sm:px-8 lg:border-r">
              <AgentAudioVisualizerAura
                size="lg"
                color="#1FD5F9"
                colorShift={0.1}
                state={
                  auraStateByAgentState[agentState] ||
                  auraStateByAgentState.connecting
                }
                audioTrack={agentAudioTrack}
                className="max-h-[18rem] w-full max-w-[18rem]"
              />

              <div className="w-full max-w-xl rounded-2xl border bg-muted/20 p-4">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Transcript
                </div>
                <p className="mt-2 min-h-12 text-base font-medium leading-relaxed">
                  {transcriptText || "Gapirishni boshlang..."}
                </p>
                {error ? (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {error}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="min-h-0 overflow-y-auto px-5 py-5 sm:px-8">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Review
                  </div>
                  <h3 className="mt-1 text-2xl font-black">
                    {draftResult
                      ? `${getDraftKindLabel(draftResult.kind)} tekshiruvi`
                      : "Natija kutilmoqda"}
                  </h3>
                </div>

                {draftResult ? (
                  <ReviewEditor
                    draft={draftResult}
                    review={review}
                    mealItems={mealItems}
                    onReviewChange={updateReview}
                    onIngredientUpdate={handleIngredientUpdate}
                    onIngredientRemove={handleIngredientRemove}
                    onIngredientAdd={handleIngredientAdd}
                    onRemoveMealItem={handleRemoveMealItem}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed p-5 text-sm font-medium text-muted-foreground">
                    Meal, suv, mashq yoki kayfiyat haqida ayting.
                  </div>
                )}
              </div>
            </section>
          </main>
        </DrawerBody>

        <DrawerFooter className="grid grid-cols-2 gap-2 border-t p-4 sm:flex sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={saving}
          >
            <XIcon className="size-4" />
            Bekor qilish
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={saveDraft}
            disabled={!showSave || saving}
          >
            {saving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <CheckIcon className="size-4" />
            )}
            Saqlash
          </Button>
        </DrawerFooter>
      </NutritionDrawerContent>
    </Drawer>
  );
};

const ReviewEditor = ({
  draft,
  review,
  mealItems,
  onReviewChange,
  onIngredientUpdate,
  onIngredientRemove,
  onIngredientAdd,
  onRemoveMealItem,
}) => {
  if (draft.kind === "meal") {
    return (
      <div className="space-y-3">
        <MealDraftSummaryCard items={mealItems} />
        {map(mealItems, (item) => (
          <MealDraftCard
            key={item.id}
            item={item}
            onIngredientUpdate={(ingredientId, patch) =>
              onIngredientUpdate(item.id, ingredientId, patch)
            }
            onIngredientRemove={(ingredientId) =>
              onIngredientRemove(item.id, ingredientId)
            }
            onIngredientAdd={(ingredient) => onIngredientAdd(item.id, ingredient)}
            onRemove={() => onRemoveMealItem(item.id)}
          />
        ))}
      </div>
    );
  }

  if (draft.kind === "water") {
    return (
      <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
        <Field label="Suv miqdori">
          <Input
            aria-label="Suv miqdori"
            type="number"
            inputMode="numeric"
            min="1"
            value={review?.amountMl ?? ""}
            onChange={(event) => onReviewChange("amountMl", event.target.value)}
          />
        </Field>
        <Field label="Birlik">
          <Input value="ml" readOnly aria-label="Suv birligi" />
        </Field>
        <Field label="Vaqt">
          <Input
            aria-label="Suv vaqti"
            type="time"
            value={review?.time ?? ""}
            onChange={(event) => onReviewChange("time", event.target.value)}
          />
        </Field>
      </div>
    );
  }

  if (draft.kind === "workout") {
    return (
      <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
        <Field label="Mashq">
          <Input
            aria-label="Mashq nomi"
            value={review?.activity ?? ""}
            onChange={(event) => onReviewChange("activity", event.target.value)}
          />
        </Field>
        <Field label="Daqiqa">
          <Input
            aria-label="Mashq daqiqasi"
            type="number"
            min="0"
            value={review?.minutes ?? ""}
            onChange={(event) => onReviewChange("minutes", event.target.value)}
          />
        </Field>
        <Field label="Kcal">
          <Input
            aria-label="Mashq kaloriyasi"
            type="number"
            min="0"
            value={review?.kcal ?? ""}
            onChange={(event) => onReviewChange("kcal", event.target.value)}
          />
        </Field>
        <Field label="Vaqt">
          <Input
            aria-label="Mashq vaqti"
            type="time"
            value={review?.time ?? ""}
            onChange={(event) => onReviewChange("time", event.target.value)}
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
      <Field label="Kayfiyat">
        <select
          aria-label="Kayfiyat"
          className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus:border-primary"
          value={review?.mood ?? "neutral"}
          onChange={(event) => onReviewChange("mood", event.target.value)}
        >
          {map(moodOptions, (option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Vaqt">
        <Input
          aria-label="Kayfiyat vaqti"
          type="time"
          value={review?.time ?? ""}
          onChange={(event) => onReviewChange("time", event.target.value)}
        />
      </Field>
      <Field label="Izoh" className="sm:col-span-2">
        <textarea
          aria-label="Kayfiyat izohi"
          className="min-h-24 w-full rounded-3xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus:border-primary"
          value={review?.note ?? ""}
          onChange={(event) => onReviewChange("note", event.target.value)}
        />
      </Field>
    </div>
  );
};

const Field = ({ label, children, className }) => (
  <label className={cn("grid gap-1.5 text-sm font-semibold", className)}>
    <span>{label}</span>
    {children}
  </label>
);

export default AudioAddBottomSheet;
