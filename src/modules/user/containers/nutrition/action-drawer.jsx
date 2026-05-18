import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Drawer,
} from "@/components/ui/drawer.jsx";
import {
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";
import CameraDrawer from "./camera-drawer.jsx";
import AudioAddDrawer from "./audio-add-drawer.jsx";
import AudioTranscriptDrawer from "./audio-transcript-drawer.jsx";
import TextAddDrawer from "./text-add-drawer.jsx";
import ManualAddDrawer from "./manual-add-drawer.jsx";
import AiMealDraftDrawer from "./ai-meal-draft-drawer.jsx";
import useFoodCatalog, {
  useFoodAudioTranscriptHistory,
} from "@/hooks/app/use-food-catalog";
import { useDailyTrackingActions } from "@/hooks/app/use-daily-tracking";
import { useSavedMeals } from "@/hooks/app/use-saved-meals";
import { toast } from "sonner";
import MealDateTimeDrawer from "./meal-date-time-drawer.jsx";
import {
  clampMealDateKey,
  formatMealTime,
  getDateKey,
  getMealDateStartKey,
  getTimePartsFromDate,
  resolveDayjsLocale,
  toMealDateTimeIso,
} from "./meal-date-time-utils.js";
import useLanguageStore from "@/store/language-store";
import { useAuthStore } from "@/store";
import { getMealConfig } from "@/modules/user/lib/meal-config";
import SmartAddSheet from "./smart-add-sheet.jsx";
import { buildNutritionQuickAdds } from "./nutrition-quick-adds.js";

import { filter, reduce, split, toNumber, trim } from "lodash";

const toIsoByDateKeyAndTimeHint = (dateKey, timeHint) => {
  if (!dateKey || !timeHint || timeHint.hour == null || timeHint.minute == null) {
    return null;
  }
  const safeHour = Math.max(0, Math.min(23, toNumber(timeHint.hour) || 0));
  const safeMinute = Math.max(0, Math.min(59, toNumber(timeHint.minute) || 0));
  return new Date(
    `${dateKey}T${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}:00`,
  ).toISOString();
};

const shiftDateKeyByDays = (dateKey, offsetDays) => {
  if (!dateKey || typeof offsetDays !== "number") return dateKey;
  const baseDate = new Date(`${dateKey}T12:00:00`);
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return split(baseDate.toISOString(), "T")[0];
};

const formatDateKeyLabel = (dateKey) => {
  if (!dateKey) return null;
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const ActionDrawer = ({
  open,
  onOpenChange,
  dateKey,
  mealType,
  initialNested,
  onOpenSavedMeals,
  onCloseAll,
  disabled = false,
  onInlineCameraCapture,
}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const user = useAuthStore((state) => state.user);
  const dayjsLocale = resolveDayjsLocale(currentLanguage);
  const mealDateMinKey = getMealDateStartKey(user, dateKey);
  const [activeNested, setActiveNested] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(mealType);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [transcriptConfidenceScores, setTranscriptConfidenceScores] = useState([]);
  const [textAddVariant, setTextAddVariant] = useState("text");
  const [audioLoggedAtHint, setAudioLoggedAtHint] = useState(null);
  const [audioTargetDateKey, setAudioTargetDateKey] = useState(null);
  const [inputSource, setInputSource] = useState("manual");
  const [cameraTextOpen, setCameraTextOpen] = useState(false);
  const [cameraAiDraftOpen, setCameraAiDraftOpen] = useState(false);
  const [cameraInitialMode, setCameraInitialMode] = useState("camera");
  const [catalogInitialFood, setCatalogInitialFood] = useState(null);
  const [mealTimeOpen, setMealTimeOpen] = useState(false);
  const [quickAddingId, setQuickAddingId] = useState(null);
  const [selectedMealTime, setSelectedMealTime] = useState(() => ({
    dateKey: clampMealDateKey(dateKey || getDateKey(new Date()), mealDateMinKey),
    ...getTimePartsFromDate(),
  }));
  const isRootDrawerOpen = open && !activeNested;
  const isCameraTextFlow = activeNested === "camera" && cameraTextOpen;
  const isCameraAiDraftFlow = activeNested === "camera" && cameraAiDraftOpen;
  const selectedDateKey = selectedMealTime.dateKey || dateKey;
  const selectedLoggedAt = toMealDateTimeIso(selectedMealTime);
  const activeMealType = selectedMealType || mealType || "breakfast";
  const shouldLoadAudioTranscriptHistory =
    open &&
    (activeNested === "audio" ||
      activeNested === "text" ||
      textAddVariant === "audio" ||
      cameraTextOpen);
  const { addMeal: addQuickMealAction } = useDailyTrackingActions();
  const { recentFoods } = useFoodCatalog();
  const { items: savedMeals } = useSavedMeals({ enabled: open });
  const quickItems = useMemo(
    () =>
      buildNutritionQuickAdds({
        savedMeals,
        recentFoods,
        limit: 6,
      }),
    [recentFoods, savedMeals],
  );
  const activeMealConfig = getMealConfig(activeMealType, {
    label: "Ovqat",
    emoji: "🍽️",
  });

  const {
    items: audioTranscriptHistory,
    saveHistoryItem,
    removeHistoryItem,
    clearHistory,
  } = useFoodAudioTranscriptHistory({
    enabled: shouldLoadAudioTranscriptHistory,
  });

  // Drawer open/close intentionally resets the nested flow state.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (open && initialNested) {
      setActiveNested(initialNested);
    }
    if (!open) {
      setActiveNested(null);
      setCameraTextOpen(false);
      setCameraAiDraftOpen(false);
      setCameraInitialMode("camera");
      setCatalogInitialFood(null);
      setMealTimeOpen(false);
    }
  }, [open, initialNested]);

  useEffect(() => {
    if (mealType) setSelectedMealType(mealType);
  }, [mealType]);

  useEffect(() => {
    if (!open) return;
    setSelectedMealTime({
      dateKey: clampMealDateKey(
        dateKey || getDateKey(new Date()),
        mealDateMinKey,
      ),
      ...getTimePartsFromDate(),
    });
  }, [dateKey, mealDateMinKey, open]);

  useEffect(() => {
    setSelectedMealTime((current) => {
      const nextDateKey = clampMealDateKey(current.dateKey, mealDateMinKey);
      if (nextDateKey === current.dateKey) return current;
      return { ...current, dateKey: nextDateKey };
    });
  }, [mealDateMinKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const resetTranscriptState = useCallback(() => {
    setTranscriptText("");
    setTranscriptSegments([]);
    setTranscriptConfidenceScores([]);
    setTextAddVariant("text");
    setAudioLoggedAtHint(null);
    setAudioTargetDateKey(null);
    setInputSource("manual");
  }, [
    setAudioLoggedAtHint,
    setAudioTargetDateKey,
    setInputSource,
    setTextAddVariant,
    setTranscriptConfidenceScores,
    setTranscriptSegments,
    setTranscriptText,
  ]);

  const transcriptConfidence = useMemo(() => {
    if (!transcriptConfidenceScores.length) return null;
    const total = reduce(transcriptConfidenceScores, (sum, v) => sum + (toNumber(v) || 0), 0);
    return toNumber((total / transcriptConfidenceScores.length).toFixed(2));
  }, [transcriptConfidenceScores]);

  const pushAudioTranscriptHistory = useCallback(
    async (transcript, mealTypeVal, loggedAt) => {
      const safe = trim(String(transcript || ""));
      if (!safe) return;
      await saveHistoryItem({
        transcript: safe,
        mealType: mealTypeVal || "breakfast",
        loggedAt: loggedAt || undefined,
      });
    },
    [saveHistoryItem],
  );

  const handleRemoveAudioTranscriptSegment = useCallback((index) => {
    setTranscriptSegments((current) => {
      const next = filter(current, (_, i) => i !== index);
      setTranscriptText(next.join("\n"));
      return next;
    });
    setTranscriptConfidenceScores((current) =>
      filter(current, (_, i) => i !== index),
    );
  }, [
    setTranscriptConfidenceScores,
    setTranscriptSegments,
    setTranscriptText,
  ]);

  const handleUseAudioTranscriptHistory = useCallback((historyItem) => {
    const transcript = trim(String(historyItem?.transcript || ""));
    if (!transcript) return;
    setTranscriptText(transcript);
    setTranscriptSegments([transcript]);
    setTextAddVariant("audio");
    setInputSource("audio");
    setSelectedMealType(historyItem?.mealType || "breakfast");
    setAudioLoggedAtHint(historyItem?.loggedAt || null);
    setAudioTargetDateKey(null);
    setTranscriptConfidenceScores([]);
  }, [
    setAudioLoggedAtHint,
    setAudioTargetDateKey,
    setInputSource,
    setSelectedMealType,
    setTextAddVariant,
    setTranscriptConfidenceScores,
    setTranscriptSegments,
    setTranscriptText,
  ]);

  const handleUseTextTranscriptHistory = useCallback((historyItem) => {
    const transcript = trim(String(historyItem?.transcript || ""));
    if (!transcript) return;
    setTranscriptText(transcript);
    setTranscriptSegments([]);
    setTextAddVariant("text");
    setInputSource("text");
    setSelectedMealType(historyItem?.mealType || mealType || "breakfast");
    setAudioLoggedAtHint(null);
    setAudioTargetDateKey(null);
    setTranscriptConfidenceScores([]);
  }, [
    mealType,
    setAudioLoggedAtHint,
    setAudioTargetDateKey,
    setInputSource,
    setSelectedMealType,
    setTextAddVariant,
    setTranscriptConfidenceScores,
    setTranscriptSegments,
    setTranscriptText,
  ]);

  const handleRemoveHistoryItem = useCallback(
    async (historyId) => {
      await removeHistoryItem(historyId);
    },
    [removeHistoryItem],
  );

  const handleClearHistory = useCallback(async () => {
    await clearHistory();
  }, [clearHistory]);

  const closeStackedCameraText = useCallback(() => {
    setCameraTextOpen(false);
    setCameraAiDraftOpen(false);
    resetTranscriptState();
  }, [resetTranscriptState, setCameraAiDraftOpen, setCameraTextOpen]);

  const handleOpenSavedMeals = useCallback(() => {
    onOpenSavedMeals?.();
    onCloseAll?.();
  }, [onCloseAll, onOpenSavedMeals]);

  const handleOpenCatalog = useCallback(() => {
    setCatalogInitialFood(null);
    setActiveNested("catalog");
  }, [setActiveNested, setCatalogInitialFood]);

  const handleOpenText = useCallback(() => {
    resetTranscriptState();
    setTextAddVariant("text");
    setInputSource("text");
    setActiveNested("text");
  }, [
    resetTranscriptState,
    setActiveNested,
    setInputSource,
    setTextAddVariant,
  ]);

  const handleOpenAudio = useCallback(() => {
    resetTranscriptState();
    setActiveNested("audio");
  }, [resetTranscriptState, setActiveNested]);

  const handleOpenCamera = useCallback(() => {
    setCameraInitialMode("camera");
    setActiveNested("camera");
  }, [setActiveNested, setCameraInitialMode]);

  const handleQuickAdd = useCallback(
    async (item) => {
      if (disabled || !item?.payload || !selectedDateKey) {
        return;
      }

      setQuickAddingId(item.id);
      try {
        await addQuickMealAction(selectedDateKey, activeMealType, {
          ...item.payload,
          addedAt: selectedLoggedAt || undefined,
        });
        toast.success(`${item.title} qo'shildi`);
      } catch {
        toast.error("Ovqatni qo'shib bo'lmadi");
      } finally {
        setQuickAddingId(null);
      }
    },
    [
      activeMealType,
      addQuickMealAction,
      disabled,
      selectedDateKey,
      selectedLoggedAt,
    ],
  );

  const handleEditQuickAdd = useCallback(
    (item) => {
      if (disabled || !item) {
        return;
      }

      if (item.type === "catalog") {
        setCatalogInitialFood(item.sourceItem || null);
        setActiveNested("catalog");
        return;
      }

      handleOpenSavedMeals();
    },
    [disabled, handleOpenSavedMeals, setActiveNested, setCatalogInitialFood],
  );

  return (
    <div>
      <Drawer
        direction="bottom"
        open={isRootDrawerOpen}
        onOpenChange={onOpenChange}
      >
        <NutritionDrawerContent size="sm">
          <SmartAddSheet
            disabled={disabled}
            formattedTime={formatMealTime(selectedMealTime, dayjsLocale)}
            isQuickAddingId={quickAddingId}
            mealLabel={activeMealConfig.label}
            onEditQuickAdd={handleEditQuickAdd}
            onOpenAudio={handleOpenAudio}
            onOpenCamera={handleOpenCamera}
            onOpenCatalog={handleOpenCatalog}
            onOpenSavedMeals={handleOpenSavedMeals}
            onOpenText={handleOpenText}
            onOpenTime={() => setMealTimeOpen(true)}
            onQuickAdd={handleQuickAdd}
            quickItems={quickItems}
          />
        </NutritionDrawerContent>
      </Drawer>
      {/* CameraDrawer — has its own Drawer wrapper */}
      <CameraDrawer
        open={activeNested === "camera"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        dateKey={selectedDateKey}
        loggedAt={selectedLoggedAt}
        mealType={activeMealType}
        initialMode={cameraInitialMode}
        onInlineCapture={(dataUrl) => {
          onInlineCameraCapture?.(dataUrl, activeMealType);
          closeStackedCameraText();
          setActiveNested(null);
          onCloseAll?.();
        }}
        isStackedChildOpen={cameraTextOpen || cameraAiDraftOpen}
        onOpenText={() => {
          resetTranscriptState();
          setTextAddVariant("text");
          setInputSource("text");
          setCameraAiDraftOpen(false);
          setCameraTextOpen(true);
        }}
        onClose={() => {
          closeStackedCameraText();
          setActiveNested(null);
          onCloseAll?.();
        }}
      />
      {/* AudioAddDrawer */}
      <Drawer
        open={activeNested === "audio"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <AudioAddDrawer
            onClose={() => setActiveNested(null)}
            onTranscriptReady={(
              transcript,
              suggestedMealType,
              suggestedTimeHint,
              suggestedDateHint,
              transcriptConfidenceValue,
            ) => {
              const safeTranscript = trim(String(transcript || ""));
              const resolvedMealType = suggestedMealType || selectedMealType;
              const resolvedLoggedAt = toIsoByDateKeyAndTimeHint(
                selectedDateKey,
                suggestedTimeHint,
              );
              const resolvedTargetDateKey =
                typeof suggestedDateHint?.offsetDays === "number"
                  ? shiftDateKeyByDays(selectedDateKey, suggestedDateHint.offsetDays)
                  : null;
              setTranscriptText((current) =>
                filter([trim(String(current || "")), safeTranscript], Boolean)
                  .join("\n"),
              );
              setInputSource("audio");
              setTranscriptSegments((current) => [
                ...(current || []),
                safeTranscript,
              ]);
              setTranscriptConfidenceScores((current) =>
                typeof transcriptConfidenceValue === "number"
                  ? [...(current || []), transcriptConfidenceValue]
                  : current,
              );
              setAudioLoggedAtHint((current) => resolvedLoggedAt || current);
              setAudioTargetDateKey(
                (current) => resolvedTargetDateKey || current,
              );
              setTextAddVariant("audio");
              setSelectedMealType(resolvedMealType);
              void pushAudioTranscriptHistory(
                safeTranscript,
                resolvedMealType,
                resolvedLoggedAt,
              );
              setActiveNested(null);
              setTimeout(() => setActiveNested("text"), 450);
            }}
          />
        </NutritionDrawerContent>
      </Drawer>
      {/* Transcript drawers */}
      <Drawer
        open={activeNested === "text" || isCameraTextFlow}
        onOpenChange={(value) => {
          if (value) return;
          if (isCameraTextFlow) {
            closeStackedCameraText();
            return;
          }
          setActiveNested(null);
        }}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          {textAddVariant === "audio" ? (
            <AudioTranscriptDrawer
              value={transcriptText}
              onChange={setTranscriptText}
              suggestedMealType={selectedMealType}
              suggestedLoggedAt={audioLoggedAtHint}
              transcriptConfidence={transcriptConfidence}
              suggestedDateLabel={
                audioTargetDateKey
                  ? formatDateKeyLabel(audioTargetDateKey)
                  : null
              }
              transcriptSegments={transcriptSegments}
              transcriptHistory={audioTranscriptHistory}
              onMealTypeChange={setSelectedMealType}
              onRemoveSegment={handleRemoveAudioTranscriptSegment}
              onAppendAudio={() => {
                setActiveNested(null);
                setTimeout(() => setActiveNested("audio"), 450);
              }}
              onUseHistory={handleUseAudioTranscriptHistory}
              onRemoveHistoryItem={handleRemoveHistoryItem}
              onClearHistory={handleClearHistory}
              onClose={() => {
                setActiveNested(null);
                resetTranscriptState();
              }}
              onContinue={() => {
                setInputSource("audio");
                setTranscriptSegments([]);
                setTranscriptConfidenceScores([]);
                setTextAddVariant("text");
                setActiveNested(null);
                setTimeout(() => setActiveNested("ai-draft"), 0);
              }}
            />
          ) : (
            <TextAddDrawer
              value={transcriptText}
              onChange={setTranscriptText}
              transcriptHistory={audioTranscriptHistory}
              onUseHistory={handleUseTextTranscriptHistory}
              onContinue={() => {
                const safeTranscript = trim(String(transcriptText || ""));
                if (safeTranscript) {
                  void pushAudioTranscriptHistory(
                    safeTranscript,
                    selectedMealType || mealType || "breakfast",
                    null,
                  );
                }
                setInputSource("text");
                setTranscriptSegments([]);
                setTranscriptConfidenceScores([]);
                setTextAddVariant("text");
                if (isCameraTextFlow) {
                  setCameraTextOpen(false);
                  setTimeout(() => setCameraAiDraftOpen(true), 0);
                  return;
                }
                setActiveNested(null);
                setTimeout(() => setActiveNested("ai-draft"), 0);
              }}
            />
          )}
        </NutritionDrawerContent>
      </Drawer>
      {/* ManualAddDrawer (Catalog) */}
      <Drawer
        open={activeNested === "catalog"}
        onOpenChange={(value) => {
          if (value) return;
          setCatalogInitialFood(null);
          setActiveNested(null);
        }}
        direction="bottom"
      >
        <NutritionDrawerContent size="lg">
          <ManualAddDrawer
            dateKey={selectedDateKey}
            initialFood={catalogInitialFood}
            mealType={activeMealType}
            loggedAt={selectedLoggedAt}
            initialSearch={catalogInitialFood?.name || ""}
            onClose={() => {
              setCatalogInitialFood(null);
              setActiveNested(null);
              onCloseAll?.();
            }}
          />
        </NutritionDrawerContent>
      </Drawer>
      {/* AiMealDraftDrawer */}
      <Drawer
        open={activeNested === "ai-draft" || isCameraAiDraftFlow}
        onOpenChange={(value) => {
          if (value) return;
          if (isCameraAiDraftFlow) {
            setCameraAiDraftOpen(false);
            resetTranscriptState();
            return;
          }
          setActiveNested(null);
        }}
        direction="bottom"
      >
        <NutritionDrawerContent size="lg">
          <AiMealDraftDrawer
            dateKey={audioTargetDateKey || selectedDateKey}
            mealType={selectedMealType}
            initialText={transcriptText}
            inputSource={inputSource}
            loggedAtHint={
              inputSource === "audio"
                ? audioLoggedAtHint || selectedLoggedAt
                : selectedLoggedAt
            }
            targetDateKey={
              inputSource === "audio"
                ? audioTargetDateKey || selectedDateKey
                : selectedDateKey
            }
            onClose={() => {
              if (isCameraAiDraftFlow) {
                closeStackedCameraText();
                setActiveNested(null);
                onCloseAll?.();
                return;
              }
              setActiveNested(null);
              resetTranscriptState();
              onCloseAll?.();
            }}
          />
        </NutritionDrawerContent>
      </Drawer>
      <MealDateTimeDrawer
        open={mealTimeOpen}
        onOpenChange={setMealTimeOpen}
        value={selectedMealTime}
        onChange={setSelectedMealTime}
        onDone={() => setMealTimeOpen(false)}
        locale={dayjsLocale}
        minDateKey={mealDateMinKey}
      />
    </div>
  );
};

export default ActionDrawer;
