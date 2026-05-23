import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Drawer } from "@/components/ui/drawer.jsx";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import CameraDrawer from "./camera-drawer.jsx";
import AudioAddDrawer from "./audio-add-drawer.jsx";
import AudioTranscriptDrawer from "./audio-transcript-drawer.jsx";
import TextAddDrawer from "./text-add-drawer.jsx";
import ManualAddDrawer from "./manual-add-drawer.jsx";
import AiMealDraftDrawer from "./ai-meal-draft-drawer.jsx";
import { useFoodAudioTranscriptHistory } from "@/hooks/app/use-food-catalog";
import {
  clampMealDateKey,
  getDateKey,
  getMealDateStartKey,
  getTimePartsFromDate,
  toMealDateTimeIso,
} from "./meal-date-time-utils.js";
import { useAuthStore } from "@/store";
import { useAiAccessStatus } from "@/hooks/app/use-ai-access";
import { getMealConfig } from "@/modules/user/lib/meal-config";
import SmartAddSheet from "./smart-add-sheet.jsx";

import { filter, reduce, split, toNumber, trim } from "lodash";

const toIsoByDateKeyAndTimeHint = (dateKey, timeHint) => {
  if (
    !dateKey ||
    !timeHint ||
    timeHint.hour == null ||
    timeHint.minute == null
  ) {
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
}) => {
  const user = useAuthStore((state) => state.user);
  const { wallet: aiAccessWallet } = useAiAccessStatus({ enabled: open });
  const aiAccessCosts = {};
  const mealDateMinKey = getMealDateStartKey(user, dateKey);
  const [activeNested, setActiveNested] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(mealType);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [transcriptConfidenceScores, setTranscriptConfidenceScores] = useState(
    [],
  );
  const [textAddVariant, setTextAddVariant] = useState("text");
  const [audioLoggedAtHint, setAudioLoggedAtHint] = useState(null);
  const [audioTargetDateKey, setAudioTargetDateKey] = useState(null);
  const [inputSource, setInputSource] = useState("manual");
  const [cameraTextOpen, setCameraTextOpen] = useState(false);
  const [cameraAiDraftOpen, setCameraAiDraftOpen] = useState(false);
  const [cameraInitialMode, setCameraInitialMode] = useState("camera");
  const [catalogInitialFood, setCatalogInitialFood] = useState(null);
  const [selectedMealTime, setSelectedMealTime] = useState(() => ({
    dateKey: clampMealDateKey(
      dateKey || getDateKey(new Date()),
      mealDateMinKey,
    ),
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
    const total = reduce(
      transcriptConfidenceScores,
      (sum, v) => sum + (toNumber(v) || 0),
      0,
    );
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

  const handleRemoveAudioTranscriptSegment = useCallback(
    (index) => {
      setTranscriptSegments((current) => {
        const next = filter(current, (_, i) => i !== index);
        setTranscriptText(next.join("\n"));
        return next;
      });
      setTranscriptConfidenceScores((current) =>
        filter(current, (_, i) => i !== index),
      );
    },
    [setTranscriptConfidenceScores, setTranscriptSegments, setTranscriptText],
  );

  const handleUseAudioTranscriptHistory = useCallback(
    (historyItem) => {
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
    },
    [
      setAudioLoggedAtHint,
      setAudioTargetDateKey,
      setInputSource,
      setSelectedMealType,
      setTextAddVariant,
      setTranscriptConfidenceScores,
      setTranscriptSegments,
      setTranscriptText,
    ],
  );

  const handleUseTextTranscriptHistory = useCallback(
    (historyItem) => {
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
    },
    [
      mealType,
      setAudioLoggedAtHint,
      setAudioTargetDateKey,
      setInputSource,
      setSelectedMealType,
      setTextAddVariant,
      setTranscriptConfidenceScores,
      setTranscriptSegments,
      setTranscriptText,
    ],
  );

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

  return (
    <div>
      <Drawer
        direction="bottom"
        open={isRootDrawerOpen}
        onOpenChange={onOpenChange}
      >
        <NutritionDrawerContent size="sm">
          <SmartAddSheet
            aiAccessCosts={aiAccessCosts}
            aiAccessWallet={aiAccessWallet}
            disabled={disabled}
            mealLabel={activeMealConfig.label}
            onOpenAudio={handleOpenAudio}
            onOpenCamera={handleOpenCamera}
            onOpenCatalog={handleOpenCatalog}
            onOpenSavedMeals={handleOpenSavedMeals}
            onOpenText={handleOpenText}
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
                  ? shiftDateKeyByDays(
                      selectedDateKey,
                      suggestedDateHint.offsetDays,
                    )
                  : null;
              setTranscriptText((current) =>
                filter(
                  [trim(String(current || "")), safeTranscript],
                  Boolean,
                ).join("\n"),
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
        <NutritionDrawerContent size="lg" className="no-scrollbar">
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
    </div>
  );
};

export default ActionDrawer;
