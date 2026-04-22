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
import TextAddDrawer from "./text-add-drawer.jsx";
import ManualAddDrawer from "./manual-add-drawer.jsx";
import AiMealDraftDrawer from "./ai-meal-draft-drawer.jsx";
import { useFoodAudioTranscriptHistory } from "@/hooks/app/use-food-catalog";

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
}) => {
  const [activeNested, setActiveNested] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(mealType);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [transcriptConfidenceScores, setTranscriptConfidenceScores] = useState([]);
  const [textAddVariant, setTextAddVariant] = useState("text");
  const [audioLoggedAtHint, setAudioLoggedAtHint] = useState(null);
  const [audioTargetDateKey, setAudioTargetDateKey] = useState(null);
  const [inputSource, setInputSource] = useState("manual");
  const isRootDrawerOpen = open && !activeNested;

  const {
    items: audioTranscriptHistory,
    saveHistoryItem,
    removeHistoryItem,
    clearHistory,
  } = useFoodAudioTranscriptHistory();

  useLayoutEffect(() => {
    if (open && initialNested) {
      setActiveNested(initialNested);
    }
    if (!open) {
      setActiveNested(null);
    }
  }, [open, initialNested]);

  useEffect(() => {
    if (mealType) setSelectedMealType(mealType);
  }, [mealType]);

  const resetTranscriptState = useCallback(() => {
    setTranscriptText("");
    setTranscriptSegments([]);
    setTranscriptConfidenceScores([]);
    setTextAddVariant("text");
    setAudioLoggedAtHint(null);
    setAudioTargetDateKey(null);
    setInputSource("manual");
  }, []);

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
  }, []);

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
  }, []);

  const handleRemoveHistoryItem = useCallback(
    async (historyId) => {
      await removeHistoryItem(historyId);
    },
    [removeHistoryItem],
  );

  const handleClearHistory = useCallback(async () => {
    await clearHistory();
  }, [clearHistory]);

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
              Ovqatni kamera, audio, matn yoki katalog orqali qo&apos;shishingiz
              mumkin.
            </DrawerDescription>
          </DrawerHeader>
          <NutritionDrawerBody className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-16 rounded-2xl justify-start items-center px-4 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-[15px] text-foreground border-border/50 group"
              onClick={() => setActiveNested("camera")}
            >
              <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <CameraIcon className="size-5 text-blue-500" />
              </div>
              Kamera orqali
            </Button>

            <Button
              type="button"
              variant="outline"
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
        dateKey={dateKey}
        mealType={mealType}
        onOpenText={() => {
          resetTranscriptState();
          setTextAddVariant("text");
          setInputSource("text");
          setActiveNested("text");
        }}
        onClose={() => {
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
                dateKey,
                suggestedTimeHint,
              );
              const resolvedTargetDateKey =
                typeof suggestedDateHint?.offsetDays === "number"
                  ? shiftDateKeyByDays(dateKey, suggestedDateHint.offsetDays)
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

      {/* TextAddDrawer */}
      <Drawer
        open={activeNested === "text"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <TextAddDrawer
            value={transcriptText}
            onChange={setTranscriptText}
            variant={textAddVariant}
            suggestedMealType={
              textAddVariant === "audio" ? selectedMealType : null
            }
            suggestedLoggedAt={
              textAddVariant === "audio" ? audioLoggedAtHint : null
            }
            transcriptConfidence={
              textAddVariant === "audio" ? transcriptConfidence : null
            }
            suggestedDateLabel={
              textAddVariant === "audio" && audioTargetDateKey
                ? formatDateKeyLabel(audioTargetDateKey)
                : null
            }
            transcriptSegments={transcriptSegments}
            transcriptHistory={
              textAddVariant === "audio" ? audioTranscriptHistory : []
            }
            onMealTypeChange={
              textAddVariant === "audio" ? setSelectedMealType : undefined
            }
            onRemoveSegment={
              textAddVariant === "audio"
                ? handleRemoveAudioTranscriptSegment
                : undefined
            }
            onAppendAudio={
              textAddVariant === "audio"
                ? () => {
                    setActiveNested(null);
                    setTimeout(() => setActiveNested("audio"), 450);
                  }
                : undefined
            }
            onUseHistory={
              textAddVariant === "audio"
                ? handleUseAudioTranscriptHistory
                : undefined
            }
            onRemoveHistoryItem={
              textAddVariant === "audio" ? handleRemoveHistoryItem : undefined
            }
            onClearHistory={
              textAddVariant === "audio" ? handleClearHistory : undefined
            }
            onClose={() => {
              setActiveNested(null);
              resetTranscriptState();
            }}
            onContinue={() => {
              setInputSource(textAddVariant === "audio" ? "audio" : "text");
              setTranscriptSegments([]);
              setTranscriptConfidenceScores([]);
              setTextAddVariant("text");
              setActiveNested(null);
              setTimeout(() => setActiveNested("ai-draft"), 0);
            }}
          />
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
            dateKey={dateKey}
            mealType={mealType}
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
        open={activeNested === "ai-draft"}
        onOpenChange={(value) => !value && setActiveNested(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="lg">
          <AiMealDraftDrawer
            dateKey={audioTargetDateKey || dateKey}
            mealType={selectedMealType}
            initialText={transcriptText}
            inputSource={inputSource}
            loggedAtHint={inputSource === "audio" ? audioLoggedAtHint : null}
            targetDateKey={inputSource === "audio" ? audioTargetDateKey : null}
            onClose={() => {
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
