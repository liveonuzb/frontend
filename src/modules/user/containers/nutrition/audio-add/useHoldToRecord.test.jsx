import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIO_ADD_STATES } from "./audio-add-types.js";
import { useHoldToRecord } from "./useHoldToRecord.js";

const mocks = vi.hoisted(() => ({
  analyzeAudioTranscript: vi.fn(),
  transcribeAudioBlob: vi.fn(),
  realtime: {
    partialText: "",
    finalText: "",
    error: "",
    connecting: false,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock("./audioAnalysisApi.js", () => ({
  analyzeAudioTranscript: mocks.analyzeAudioTranscript,
  transcribeAudioBlob: mocks.transcribeAudioBlob,
}));

vi.mock("./useRealtimeTranscription.js", () => ({
  useRealtimeTranscription: () => mocks.realtime,
}));

class MockMediaRecorder {
  constructor(_stream, options = {}) {
    this.mimeType = options.mimeType || "audio/webm";
    this.state = "inactive";
    this.ondataavailable = null;
    this.onstop = null;
  }

  start() {
    this.state = "recording";
  }

  requestData() {
    this.ondataavailable?.({
      data: new Blob(["audio"], { type: this.mimeType }),
    });
  }

  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}

MockMediaRecorder.isTypeSupported = vi.fn(() => true);

const createStream = () => {
  const tracks = [{ stop: vi.fn() }];
  return {
    getTracks: () => tracks,
    getAudioTracks: () => tracks,
  };
};

describe("useHoldToRecord", () => {
  let originalMediaRecorder;
  let originalMediaDevices;

  beforeEach(() => {
    originalMediaRecorder = globalThis.MediaRecorder;
    originalMediaDevices = navigator.mediaDevices;
    globalThis.MediaRecorder = MockMediaRecorder;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(createStream()),
      },
    });
    mocks.realtime.partialText = "";
    mocks.realtime.finalText = "";
    mocks.realtime.error = "";
    mocks.realtime.connecting = false;
    mocks.realtime.start.mockReset().mockResolvedValue(undefined);
    mocks.realtime.stop.mockReset().mockResolvedValue("");
    mocks.realtime.reset.mockReset();
    mocks.analyzeAudioTranscript.mockReset();
    mocks.transcribeAudioBlob.mockReset().mockResolvedValue({
      transcript: "Bugun 850 ml suv ichdim",
      confidence: 0.9,
    });
  });

  afterEach(() => {
    globalThis.MediaRecorder = originalMediaRecorder;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
    vi.clearAllMocks();
  });

  it("uses recorded audio fallback when realtime transcription returns no text", async () => {
    const { result } = renderHook(() => useHoldToRecord());

    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      await result.current.stopRecording();
    });

    expect(mocks.realtime.start).toHaveBeenCalledTimes(1);
    expect(mocks.realtime.stop).toHaveBeenCalledTimes(1);
    expect(mocks.transcribeAudioBlob).toHaveBeenCalledWith(expect.any(Blob));
    expect(result.current.audioState).toBe(AUDIO_ADD_STATES.recorded);
    expect(result.current.transcriptState.finalText).toBe(
      "Bugun 850 ml suv ichdim",
    );
    expect(result.current.canAnalyze).toBe(true);
  });
});
