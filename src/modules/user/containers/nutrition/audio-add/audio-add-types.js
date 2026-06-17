/**
 * @typedef {"permission_required" | "idle" | "recording" | "recorded" | "analyzing" | "analyzed" | "error"} AudioAddState
 */

/**
 * @typedef {{
 *   partialText: string;
 *   finalText: string;
 *   durationSeconds: number;
 * }} TranscriptState
 */

/**
 * @typedef {"water" | "meal" | "calorie" | "workout" | "mood" | "unknown"} DetectedAudioResultType
 */

/**
 * @typedef {"ml" | "l" | "kcal" | "g" | "kg" | "pcs" | "min"} DetectedAudioResultUnit
 */

/**
 * @typedef {{
 *   category: string;
 *   name?: string | null;
 *   amount?: number | null;
 *   unit?: DetectedAudioResultUnit | null;
 * }} DetectedAudioResultItem
 */

/**
 * @typedef {{
 *   type: DetectedAudioResultType;
 *   originalText: string;
 *   confidence: number;
 *   items: DetectedAudioResultItem[];
 * }} DetectedAudioResult
 */

export const AUDIO_ADD_STATES = {
  permissionRequired: "permission_required",
  idle: "idle",
  recording: "recording",
  recorded: "recorded",
  analyzing: "analyzing",
  analyzed: "analyzed",
  error: "error",
};

export const EMPTY_TRANSCRIPT_STATE = {
  partialText: "",
  finalText: "",
  durationSeconds: 0,
};
