import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  BarcodeIcon,
  CalendarClockIcon,
  CameraIcon,
  ChefHatIcon,
  KeyboardIcon,
  MicIcon,
  SearchIcon,
} from "lucide-react";
import {
  NutritionDrawerBody,
  NutritionDrawerContent,
} from "./nutrition-drawer-layout.jsx";
import CameraDrawer from "./camera-drawer.jsx";
import AudioAddDrawer from "./audio-add-drawer.jsx";
import AudioTranscriptDrawer from "./audio-transcript-drawer.jsx";
import TextAddDrawer from "./text-add-drawer.jsx";
import ManualAddDrawer from "./manual-add-drawer.jsx";
import AiMealDraftDrawer from "./ai-meal-draft-drawer.jsx";
import { useFoodAudioTranscriptHistory } from "@/hooks/app/use-food-catalog";
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

const toIsoByDateKeyAndTimeHint = (dateKey, timeHint) => {
  if (!dateKey || !timeHint || timeHint.hour == null || timeHint.minute == null) {
    return null;
  }
  const safeHour = Math.max(0, Math.min(23, Number(timeHint.hour) || 0));
  const safeMinute = Math.max(0, Math.min(59, Number(timeHint.minute) || 0));
  return new Date(
    `${dateKey}T${String(safeHour).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}:00`,
  ).toISOString();
};

const shiftDateKeyByDays = (dateKey, offsetDays) => {
  if (!dateKey || typeof offsetDays !== "number") return dateKey;
  const baseDate = new Date(`${dateKey}T12:00:00`);
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate.toISOString().split("T")[0];
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
  const [mealTimeOpen, setMealTimeOpen] = useState(false);
  const [selectedMealTime, setSelectedMealTime] = useState(() => ({
    dateKey: clampMealDateKey(dateKey || getDateKey(new Date()), mealDateMinKey),
    ...getTimePartsFromDate(),
  }));
  const isRootDrawerOpen = open && !activeNested;
  const isCameraTextFlow = activeNested === "camera" && cameraTextOpen;
  const isCameraAiDraftFlow = activeNested === "camera" && cameraAiDraftOpen;
  const selectedDateKey = selectedMealTime.dateKey || dateKey;
  const selectedLoggedAt = toMealDateTimeIso(selectedMealTime);
  const shouldLoadAudioTranscriptHistory =
    open &&
    (activeNested === "audio" ||
      activeNested === "text" ||
      textAddVariant === "audio" ||
      cameraTextOpen);

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
    const total = transcriptConfidenceScores.reduce(
      (sum, v) => sum + (Number(v) || 0),
      0,
    );
    return Number((total / transcriptConfidenceScores.length).toFixed(2));
  }, [transcriptConfidenceScores]);

  const pushAudioTranscriptHistory = useCallback(
    async (transcript, mealTypeVal, loggedAt) => {
      const safe = String(transcript || "").trim();
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
      const next = current.filter((_, i) => i !== index);
      setTranscriptText(next.join("\n"));
      return next;
    });
    setTranscriptConfidenceScores((current) =>
      current.filter((_, i) => i !== index),
    );
  }, [
    setTranscriptConfidenceScores,
    setTranscriptSegments,
    setTranscriptText,
  ]);

  const handleUseAudioTranscriptHistory = useCallback((historyItem) => {
    const transcript = String(historyItem?.transcript || "").trim();
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
    const transcript = String(historyItem?.transcript || "").trim();
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

  return (
    <div>
      <Drawer
        direction="bottom"
        open={isRootDrawerOpen}
        onOpenChange={onOpenChange}
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader>
            <DrawerTitle>Ovqat qo'shish</DrawerTitle>
            <DrawerDescription>
              Ovqatni kamera, barcode, audio, matn yoki katalog orqali qo&apos;shishingiz
              mumkin.
            </DrawerDescription>
          </DrawerHeader>
          <NutritionDrawerBody className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-14 w-full justify-start rounded-2xl border-dashed px-4 text-left"
              onClick={() => setMealTimeOpen(true)}
            >
              <div className="mr-3 flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CalendarClockIcon className="size-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">Sana va vaqt</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatMealTime(selectedMealTime, dayjsLocale)}
                </p>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => {
                setCameraInitialMode("camera");
                setActiveNested("camera");
              }}
            >
              <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <CameraIcon className="size-5 text-blue-500" />
              </div>
              Kamera orqali
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => {
                setCameraInitialMode("barcode");
                setActiveNested("camera");
              }}
            >
              <div className="size-10 rounded-full bg-cyan-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <BarcodeIcon className="size-5 text-cyan-500" />
              </div>
              Barcode orqali
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => {
                resetTranscriptState();
                setTextAddVariant("text");
                setInputSource("text");
                setActiveNested("text");
              }}
            >
              <div className="size-10 rounded-full bg-violet-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <KeyboardIcon className="size-5 text-violet-500" />
              </div>
              Matn orqali
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => setActiveNested("catalog")}
            >
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <SearchIcon className="size-5 text-primary" />
              </div>
              Katalogdan tanlash
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => {
                resetTranscriptState();
                setActiveNested("audio");
              }}
            >
              <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <MicIcon className="size-5 text-emerald-500" />
              </div>
              Audio orqali
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => onOpenSavedMeals?.()}
            >
              <div className="size-10 rounded-full bg-orange-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <ChefHatIcon className="size-5 text-orange-500" />
              </div>
              Mening taomlarim
            </Button>
          </NutritionDrawerBody>
        </NutritionDrawerContent>
      </Drawer>

      {/* CameraDrawer — has its own Drawer wrapper */}
      <CameraDrawer
        open={activeNested === "camera"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        dateKey={selectedDateKey}
        loggedAt={selectedLoggedAt}
        mealType={mealType}
        initialMode={cameraInitialMode}
        onInlineCapture={(dataUrl) => {
          onInlineCameraCapture?.(dataUrl, selectedMealType || mealType);
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
              const safeTranscript = String(transcript || "").trim();
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
                [String(current || "").trim(), safeTranscript]
                  .filter(Boolean)
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
                const safeTranscript = String(transcriptText || "").trim();
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
        onOpenChange={(value) => !value && setActiveNested(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="lg">
          <ManualAddDrawer
            dateKey={selectedDateKey}
            mealType={mealType}
            loggedAt={selectedLoggedAt}
            initialSearch=""
            onClose={() => {
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
