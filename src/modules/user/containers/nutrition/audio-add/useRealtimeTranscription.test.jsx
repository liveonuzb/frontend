import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeTranscription } from "./useRealtimeTranscription.js";

const mocks = vi.hoisted(() => ({
  createAudioSession: vi.fn(),
}));

vi.mock("./audioAnalysisApi.js", () => ({
  createAudioSession: mocks.createAudioSession,
}));

class MockRTCPeerConnection {
  constructor() {
    this.signalingState = "stable";
    this.senders = [];
    this.createDataChannel = vi.fn(() => ({
      readyState: "connecting",
      close: vi.fn(),
      send: vi.fn(),
    }));
    this.createOffer = vi.fn().mockResolvedValue({
      type: "offer",
      sdp: "offer-sdp",
    });
    this.setLocalDescription = vi.fn().mockResolvedValue(undefined);
    this.setRemoteDescription = vi.fn().mockImplementation(() => {
      if (this.signalingState === "closed") {
        throw new Error(
          "Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': The RTCPeerConnection's signalingState is 'closed'.",
        );
      }
      this.signalingState = "stable";
      return Promise.resolve();
    });
    this.close = vi.fn(() => {
      this.signalingState = "closed";
    });
    MockRTCPeerConnection.instances.push(this);
  }

  addTrack(track) {
    this.senders.push({ track });
  }

  getSenders() {
    return this.senders;
  }
}

MockRTCPeerConnection.instances = [];

const createStream = () => ({
  getAudioTracks: () => [{ stop: vi.fn() }],
});

const flushPromises = async (times = 1) => {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve();
  }
};

describe("useRealtimeTranscription", () => {
  let originalRTCPeerConnection;
  let originalFetch;
  let resolveRealtimeFetch;

  beforeEach(() => {
    vi.useFakeTimers();
    MockRTCPeerConnection.instances = [];
    mocks.createAudioSession.mockReset().mockResolvedValue({
      clientSecret: "ephemeral-secret",
    });
    originalRTCPeerConnection = globalThis.RTCPeerConnection;
    originalFetch = globalThis.fetch;
    globalThis.RTCPeerConnection = MockRTCPeerConnection;
    globalThis.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRealtimeFetch = resolve;
        }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.RTCPeerConnection = originalRTCPeerConnection;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("ignores a realtime SDP answer that arrives after the user releases the hold button", async () => {
    const { result } = renderHook(() => useRealtimeTranscription());
    let startPromise;

    await act(async () => {
      startPromise = result.current.start({ stream: createStream() });
      await flushPromises(6);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const peer = MockRTCPeerConnection.instances[0];
    let stopPromise;

    act(() => {
      stopPromise = result.current.stop();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300);
    });

    resolveRealtimeFetch({
      ok: true,
      text: vi.fn().mockResolvedValue("answer-sdp"),
    });

    await act(async () => {
      await flushPromises(3);
      await startPromise;
      await stopPromise;
    });

    expect(peer.close).toHaveBeenCalledTimes(1);
    expect(peer.signalingState).toBe("closed");
    expect(peer.setRemoteDescription).not.toHaveBeenCalled();
    expect(result.current.error).toBe("");
  });
});
