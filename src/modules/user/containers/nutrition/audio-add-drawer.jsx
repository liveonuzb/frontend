import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { entries, find, includes, some } from "lodash";
import {
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Loader2Icon, SquareIcon, MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFoodScan } from "@/hooks/app/use-food-catalog";
import { LiveWaveform } from "@/components/ui/live-waveform.jsx";

/* ───────── constants ───────── */
const MEAL_TYPE_HINTS = {
  breakfast: ["nonushta", "ertalab", "breakfast", "утром", "zavtrak"],
  lunch: ["tushlik", "obed", "lunch", "kunduzi", "днем"],
  dinner: ["kechki", "kechqurun", "dinner", "ужин", "вечером"],
  snack: ["snack", "tamaddi", "perekus", "перекус", "oraliq"],
};

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const detectMeal = (v) => {
  const n = String(v || "").toLowerCase();
  if (!n.trim()) return null;
  return find(entries(MEAL_TYPE_HINTS), ([, kw]) => some(kw, (k) => includes(n, k)))?.[0] || null;
};

const detectTimeHint = (value) => {
  const text = String(value || "").toLowerCase();

  if (!text.trim()) {
    return null;
  }

  const colonMatch = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (colonMatch) {
    return {
      hour: Number(colonMatch[1]),
      minute: Number(colonMatch[2]),
      label: `${String(colonMatch[1]).padStart(2, "0")}:${colonMatch[2]}`,
    };
  }

  const explicitHourMatch = text.match(
    /\b(?:soat|saat|час)\s*([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\b/,
  );
  if (explicitHourMatch) {
    const minute = explicitHourMatch[2] ? Number(explicitHourMatch[2]) : 0;
    return {
      hour: Number(explicitHourMatch[1]),
      minute,
      label: `${String(explicitHourMatch[1]).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    };
  }

  return null;
};

const detectDateHint = (value) => {
  const text = String(value || "").toLowerCase();

  if (!text.trim()) {
    return null;
  }

  if (
    text.includes("kecha") ||
    text.includes("yesterday") ||
    text.includes("вчера")
  ) {
    return {
      offsetDays: -1,
      label: "Kecha",
    };
  }

  if (
    text.includes("bugun") ||
    text.includes("today") ||
    text.includes("сегодня")
  ) {
    return {
      offsetDays: 0,
      label: "Bugun",
    };
  }

  return null;
};

const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return AUDIO_MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || "";
};

/* ───────── Custom Native Hook ───────── */
function useNativeAudioRecorder(options = {}) {
  const { onRecordingComplete } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeStream, setActiveStream] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const callbackRef = useRef(onRecordingComplete);
  callbackRef.current = onRecordingComplete;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setActiveStream(null);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActiveStream(stream);

      const mime = getSupportedMimeType();
      
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      recorder.onstop = () => {
        setIsRecording(false);
        cleanup();

        setTimeout(() => {
          const mimeType = recorder.mimeType || mime || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          if (callbackRef.current) {
             callbackRef.current(blob);
          }
        }, 50);
      };

      recorder.start(200); 
    } catch (err) {
      cleanup();
      setError("Mikrofon bilan bog'lanib bo'lmadi yoki ruxsat yo'q.");
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.requestData(); 
      } catch (e) {
      }
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
      cleanup();
    };
  }, [stopRecording, cleanup]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,
    activeStream,
    error,
    setError,
  };
}

/* ───────── component ───────── */
const AudioAddDrawer = ({ onClose, onTranscriptReady }) => {
  const { transcribeMealAudio, isTranscribingAudio } = useFoodScan();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState("");

  const deadRef = useRef(false);

  // always-fresh refs for callbacks
  const fnTranscribe = useRef(transcribeMealAudio);
  fnTranscribe.current = transcribeMealAudio;
  const fnReady = useRef(onTranscriptReady);
  fnReady.current = onTranscriptReady;

  const handleRecordingComplete = useCallback(async (blob) => {
    if (!blob || blob.size <= 0) {
      setLocalError("Nutq aniqlanmadi. Qayta urinib ko'ring.");
      return;
    }

    setIsProcessing(true);
    setLocalError("");

    try {
      const mime = blob.type || "audio/webm";
      const ext = mime.includes("mp4")
        ? "mp4"
        : mime.includes("ogg")
        ? "ogg"
        : "webm";
      const file = new File([blob], `meal-note.${ext}`, {
        type: mime,
      });

      const result = await fnTranscribe.current(file);
      const transcript =
        typeof result === "string"
          ? String(result).trim()
          : String(result?.transcript || "").trim();
      const confidence = Number.isFinite(Number(result?.confidence))
        ? Number(result.confidence)
        : null;

      if (deadRef.current) {
        return;
      }

      setIsProcessing(false);

      if (!transcript) {
        setLocalError("Nutq aniqlanmadi. Qayta urinib ko'ring.");
        return;
      }

      fnReady.current?.(
        transcript,
        detectMeal(transcript) || null,
        detectTimeHint(transcript),
        detectDateHint(transcript),
        confidence,
      );
    } catch (err) {
      if (!deadRef.current) {
        setLocalError(
          err?.response?.data?.message ||
            err?.message ||
            "Audio matnga aylantirib bo'lmadi."
        );
        setIsProcessing(false);
      }
    }
  }, []);

  const {
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,
    activeStream,
    error: recorderError,
    setError: setRecorderError,
  } = useNativeAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
  });

  useEffect(() => {
    deadRef.current = false;
    return () => {
      deadRef.current = true;
    };
  }, []);

  // Sync recorder errors
  useEffect(() => {
    if (recorderError) setLocalError(recorderError);
  }, [recorderError]);

  const handleStart = () => {
    setLocalError("");
    setRecorderError("");
    startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  /* ── derived ── */
  const isBusy = isTranscribingAudio || isProcessing;
  const error = localError;

  const label = useMemo(() => {
    if (isRecording)
      return {
        t: "Yozilyapti",
        d: "Gapiring. Tugatgach ⏹ bosing.",
        c: "bg-destructive/10 text-destructive",
      };
    if (isBusy)
      return {
        t: "Matnga aylantirilmoqda",
        d: "Server transcript tayyorlayapti...",
        c: "bg-primary/10 text-primary",
      };
    if (error)
      return {
        t: "Xatolik",
        d: error,
        c: "bg-destructive/10 text-destructive",
      };
    return {
      t: "Mikrofon tayyor",
      d: "Mic tugmasini bosing va gapiring.",
      c: "bg-muted text-muted-foreground",
    };
  }, [isRecording, isBusy, error]);

  /* ── render ── */
  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Audio orqali qo&apos;shish</DrawerTitle>
        <DrawerDescription>
          Yozishni boshlang, gapiring va to&apos;xtating.
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="space-y-4">
        <div className="flex flex-col gap-6 rounded-3xl border bg-muted/15 p-6 pb-2 text-center">
          <div className="space-y-2">
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                label.c
              )}
            >
              {label.t}
            </span>
            <p className="text-sm text-muted-foreground">{label.d}</p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={isRecording ? handleStop : handleStart}
              disabled={isBusy}
              aria-label={isRecording ? "To'xtatish" : "Boshlash"}
              className={cn(
                "flex size-24 items-center justify-center rounded-full border transition-all active:scale-95 disabled:opacity-50",
                isRecording
                  ? "border-destructive/20 bg-destructive/10 text-destructive animate-pulse"
                  : isBusy
                  ? "border-muted bg-muted/30 text-muted-foreground"
                  : "border-primary/15 bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {isRecording ? (
                <SquareIcon className="size-10" />
              ) : isBusy ? (
                <Loader2Icon className="size-10 animate-spin" />
              ) : (
                <MicIcon className="size-10" />
              )}
            </button>
          </div>

          <div className="w-full h-32 mt-2">
            {isRecording && activeStream ? (
              <LiveWaveform
                active={true}
                processing={false}
                barColor="hsl(var(--destructive))"
                mode="static"
                height={128}
                barHeight={6}
                barWidth={4}
                stream={activeStream}
              />
            ) : isBusy ? (
              <LiveWaveform
                active={false}
                processing={true}
                barColor="hsl(var(--primary))"
                mode="static"
                height={128}
                barHeight={6}
                barWidth={4}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-center border-t py-3 text-sm">
            <span className="font-semibold tabular-nums tracking-wider text-xl">
              {isBusy ? "..." : fmt(recordingTime)}
            </span>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </DrawerBody>

      <DrawerFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isRecording || isBusy}
        >
          Bekor qilish
        </Button>
      </DrawerFooter>
    </>
  );
};

export default AudioAddDrawer;
