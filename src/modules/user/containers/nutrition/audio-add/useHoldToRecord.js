import React from "react";
import {
  analyzeAudioTranscript,
  transcribeAudioBlob,
} from "./audioAnalysisApi.js";
import {
  AUDIO_ADD_STATES,
  EMPTY_TRANSCRIPT_STATE,
} from "./audio-add-types.js";
import { useRealtimeTranscription } from "./useRealtimeTranscription.js";

const ERROR_MESSAGES = {
  permission: "Brauzer yoki qurilma sozlamalarida mikrofon ruxsatini yoqing.",
  empty: "Ovoz aniqlanmadi. Mikrofonni bosib turib qayta gapiring.",
  unsupported: "Bu brauzer ovoz yozishni qo'llab-quvvatlamaydi.",
  transcription: "Transkript qilishda xatolik yuz berdi. Qayta urinib ko'ring.",
  analysis: "Ma'lumot tahlil qilinmadi. Qayta urinib ko'ring.",
};

const getMediaDevices = () => {
  if (typeof navigator === "undefined") return null;
  return navigator.mediaDevices || null;
};

const stopStream = (stream) => {
  stream?.getTracks?.().forEach((track) => {
    try {
      track.stop();
    } catch {
      // no-op
    }
  });
};

const recorderMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

const getSupportedRecorderMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return (
    recorderMimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported?.(mimeType),
    ) || ""
  );
};

const createAudioBlob = (chunks, mimeType) => {
  const validChunks = chunks.filter((chunk) => chunk?.size > 0);
  if (!validChunks.length) return null;
  return new Blob(validChunks, {
    type: mimeType || validChunks[0]?.type || "audio/webm",
  });
};

export const useHoldToRecord = () => {
  const {
    partialText,
    finalText,
    error: realtimeError,
    connecting,
    start: startRealtimeTranscription,
    stop: stopRealtimeTranscription,
    reset: resetRealtimeTranscription,
  } = useRealtimeTranscription();
  const [audioState, setAudioState] = React.useState(AUDIO_ADD_STATES.idle);
  const [transcriptState, setTranscriptState] = React.useState(
    EMPTY_TRANSCRIPT_STATE,
  );
  const [detectedResult, setDetectedResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [stream, setStream] = React.useState(null);

  const streamRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const recordedChunksRef = React.useRef([]);
  const timerRef = React.useRef(null);
  const startLockedRef = React.useRef(false);
  const pressActiveRef = React.useRef(false);
  const recordingRef = React.useRef(false);
  const startedAtRef = React.useRef(0);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cleanupStream = React.useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const startLocalRecorder = React.useCallback((nextStream) => {
    recordedChunksRef.current = [];

    if (typeof MediaRecorder === "undefined") {
      mediaRecorderRef.current = null;
      return;
    }

    try {
      const mimeType = getSupportedRecorderMimeType();
      const recorder = new MediaRecorder(
        nextStream,
        mimeType ? { mimeType } : undefined,
      );

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
    } catch {
      mediaRecorderRef.current = null;
    }
  }, []);

  const stopLocalRecorder = React.useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = mediaRecorderRef.current;
        mediaRecorderRef.current = null;

        if (!recorder) {
          resolve(createAudioBlob(recordedChunksRef.current, "audio/webm"));
          return;
        }

        const resolveRecordedBlob = () => {
          resolve(createAudioBlob(recordedChunksRef.current, recorder.mimeType));
        };

        if (recorder.state === "inactive") {
          resolveRecordedBlob();
          return;
        }

        recorder.onstop = resolveRecordedBlob;

        try {
          recorder.requestData?.();
        } catch {
          // no-op
        }

        try {
          recorder.stop();
        } catch {
          resolveRecordedBlob();
        }
      }),
    [],
  );

  const setDurationFromStart = React.useCallback(() => {
    const startedAt = startedAtRef.current;
    if (!startedAt) return;
    const durationSeconds = Math.max(
      0,
      Math.floor((Date.now() - startedAt) / 1000),
    );
    setTranscriptState((current) => ({
      ...current,
      durationSeconds,
    }));
  }, []);

  const startRecording = React.useCallback(async () => {
    if (startLockedRef.current || recordingRef.current) return;
    startLockedRef.current = true;
    pressActiveRef.current = true;

    setError("");
    setDetectedResult(null);

    const mediaDevices = getMediaDevices();
    if (!mediaDevices?.getUserMedia) {
      setAudioState(AUDIO_ADD_STATES.error);
      setError(ERROR_MESSAGES.unsupported);
      startLockedRef.current = false;
      return;
    }

    try {
      const nextStream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!pressActiveRef.current) {
        stopStream(nextStream);
        return;
      }

      streamRef.current = nextStream;
      setStream(nextStream);
      startLocalRecorder(nextStream);
      recordingRef.current = true;
      startedAtRef.current = Date.now();
      setTranscriptState(EMPTY_TRANSCRIPT_STATE);
      setAudioState(AUDIO_ADD_STATES.recording);

      timerRef.current = window.setInterval(setDurationFromStart, 1000);
      await startRealtimeTranscription({ stream: nextStream });
    } catch (nextError) {
      cleanupStream();
      clearTimer();
      recordingRef.current = false;

      const name = nextError?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setAudioState(AUDIO_ADD_STATES.permissionRequired);
        setError(ERROR_MESSAGES.permission);
      } else {
        setAudioState(AUDIO_ADD_STATES.error);
        setError(
          nextError instanceof Error && nextError.message
            ? nextError.message
            : ERROR_MESSAGES.transcription,
        );
      }
    } finally {
      startLockedRef.current = false;
    }
  }, [
    cleanupStream,
    clearTimer,
    setDurationFromStart,
    startLocalRecorder,
    startRealtimeTranscription,
  ]);

  const stopRecording = React.useCallback(async () => {
    pressActiveRef.current = false;
    if (!recordingRef.current) return;
    recordingRef.current = false;
    clearTimer();
    setDurationFromStart();
    const recordedAudioPromise = stopLocalRecorder();
    cleanupStream();

    const stoppedText = (await stopRealtimeTranscription()).trim();
    let fallbackText = (
      stoppedText ||
      finalText ||
      partialText ||
      ""
    ).trim();
    let fallbackErrorMessage = "";

    if (!fallbackText) {
      const recordedAudio = await recordedAudioPromise;
      if (recordedAudio?.size > 0) {
        try {
          const fallbackTranscript = await transcribeAudioBlob(recordedAudio);
          fallbackText = (fallbackTranscript?.transcript || "").trim();
        } catch (nextError) {
          fallbackErrorMessage =
            nextError?.response?.data?.message ||
            nextError?.message ||
            ERROR_MESSAGES.transcription;
        }
      }
    }

    setTranscriptState((current) => ({
      partialText: fallbackText || partialText,
      finalText: fallbackText,
      durationSeconds: current.durationSeconds,
    }));

    if (!fallbackText) {
      setAudioState(AUDIO_ADD_STATES.error);
      setError(realtimeError || fallbackErrorMessage || ERROR_MESSAGES.empty);
      return;
    }

    setAudioState(AUDIO_ADD_STATES.recorded);
  }, [
    cleanupStream,
    clearTimer,
    finalText,
    partialText,
    realtimeError,
    setDurationFromStart,
    stopLocalRecorder,
    stopRealtimeTranscription,
  ]);

  const analyze = React.useCallback(async () => {
    const transcript = (
      transcriptState.finalText ||
      transcriptState.partialText ||
      ""
    ).trim();

    if (!transcript || audioState === AUDIO_ADD_STATES.recording) return null;

    setAudioState(AUDIO_ADD_STATES.analyzing);
    setError("");

    try {
      const result = await analyzeAudioTranscript(transcript);
      setDetectedResult(result);
      setAudioState(AUDIO_ADD_STATES.analyzed);
      return result;
    } catch (nextError) {
      setDetectedResult(null);
      setAudioState(AUDIO_ADD_STATES.error);
      setError(
        nextError?.response?.data?.message ||
          nextError?.message ||
          ERROR_MESSAGES.analysis,
      );
      return null;
    }
  }, [audioState, transcriptState.finalText, transcriptState.partialText]);

  const reset = React.useCallback(() => {
    void stopLocalRecorder();
    void stopRealtimeTranscription();
    cleanupStream();
    clearTimer();
    pressActiveRef.current = false;
    recordingRef.current = false;
    startedAtRef.current = 0;
    setTranscriptState(EMPTY_TRANSCRIPT_STATE);
    setDetectedResult(null);
    setError("");
    resetRealtimeTranscription();
    setAudioState(AUDIO_ADD_STATES.idle);
  }, [
    cleanupStream,
    clearTimer,
    resetRealtimeTranscription,
    stopLocalRecorder,
    stopRealtimeTranscription,
  ]);

  const cancel = React.useCallback(() => {
    reset();
  }, [reset]);

  React.useEffect(() => {
    if (audioState !== AUDIO_ADD_STATES.recording) return undefined;

    let isCancelled = false;
    queueMicrotask(() => {
      if (isCancelled) return;
      setTranscriptState((current) => ({
        ...current,
        partialText,
        finalText: finalText || current.finalText,
      }));
    });

    return () => {
      isCancelled = true;
    };
  }, [audioState, finalText, partialText]);

  React.useEffect(
    () => () => {
      void stopLocalRecorder();
      cleanupStream();
      clearTimer();
      void stopRealtimeTranscription();
    },
    [cleanupStream, clearTimer, stopLocalRecorder, stopRealtimeTranscription],
  );

  return {
    audioState,
    transcriptState,
    detectedResult,
    error: error || realtimeError,
    stream,
    connecting,
    isRecording: audioState === AUDIO_ADD_STATES.recording,
    canAnalyze:
      Boolean(
        (transcriptState.finalText || transcriptState.partialText || "").trim(),
      ) &&
      audioState !== AUDIO_ADD_STATES.recording &&
      audioState !== AUDIO_ADD_STATES.analyzing,
    startRecording,
    stopRecording,
    analyze,
    reset,
    cancel,
    handlePressStart: startRecording,
    handlePressEnd: stopRecording,
  };
};
