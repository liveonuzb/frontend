import get from "lodash/get";
import { api } from "@/hooks/api/use-api.js";

const unwrapApiData = (response, fallback = null) =>
  get(response, "data.data", get(response, "data", fallback));

export const createAudioSession = async () => {
  const response = await api.post("/user/ai/audio/session");
  return unwrapApiData(response, {});
};

export const createLiveKitSession = async () => {
  const response = await api.post("/user/ai/audio/livekit-session");
  return unwrapApiData(response, {});
};

export const analyzeAudioTranscript = async (transcript) => {
  const response = await api.post("/user/ai/audio/analyze", { transcript });
  return unwrapApiData(response, null);
};

const audioExtensionByMimeType = {
  "audio/aac": "aac",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/wav": "wav",
  "audio/x-m4a": "m4a",
  "audio/x-wav": "wav",
};

const getAudioFilename = (mimeType = "") => {
  const normalizedMimeType = String(mimeType).split(";")[0]?.trim();
  const extension = audioExtensionByMimeType[normalizedMimeType] || "webm";
  return `audio-note.${extension}`;
};

export const transcribeAudioBlob = async (audioBlob) => {
  if (!audioBlob?.size) {
    return {
      transcript: "",
      confidence: 0,
    };
  }

  const formData = new FormData();
  formData.append("file", audioBlob, getAudioFilename(audioBlob.type));

  const response = await api.post(
    "/user/nutrition/foods/transcribe-meal-audio",
    formData,
  );
  const payload = unwrapApiData(response, {});

  return {
    transcript: String(get(payload, "transcript", "")).trim(),
    confidence: Number(get(payload, "confidence", 0)) || 0,
  };
};
