import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AudioAddBottomSheet from "./AudioAddBottomSheet.jsx";

const encodeMessage = (message) =>
  new TextEncoder().encode(JSON.stringify(message));

const mocks = vi.hoisted(() => ({
  rooms: [],
  createLiveKitSession: vi.fn(),
  auraProps: [],
  actions: {
    addWaterCup: vi.fn(),
    addMeal: vi.fn(),
    addWorkout: vi.fn(),
    setMood: vi.fn(),
  },
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("livekit-client", () => {
  class MockRoom {
    constructor() {
      this.handlers = {};
      this.connect = vi.fn().mockResolvedValue(undefined);
      this.disconnect = vi.fn();
      this.localParticipant = {
        setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
      };
      mocks.rooms.push(this);
    }

    on(event, handler) {
      this.handlers[event] = [...(this.handlers[event] || []), handler];
      return this;
    }

    off(event, handler) {
      this.handlers[event] = (this.handlers[event] || []).filter(
        (item) => item !== handler,
      );
      return this;
    }

    emit(event, ...args) {
      for (const handler of this.handlers[event] || []) {
        handler(...args);
      }
    }
  }

  return {
    Room: MockRoom,
    RoomEvent: {
      DataReceived: "dataReceived",
      Disconnected: "disconnected",
      ParticipantConnected: "participantConnected",
      TrackSubscribed: "trackSubscribed",
      TrackUnsubscribed: "trackUnsubscribed",
    },
  };
});

vi.mock("@/components/agents-ui/agent-audio-visualizer-aura.jsx", () => ({
  AgentAudioVisualizerAura: (props) => {
    mocks.auraProps.push(props);

    return <div data-testid="agents-ui-aura" data-lk-state={props.state} />;
  },
}));

vi.mock("./audioAnalysisApi.js", () => ({
  createLiveKitSession: mocks.createLiveKitSession,
}));

vi.mock("@/hooks/app/use-daily-tracking.js", () => ({
  useDailyTrackingActions: () => mocks.actions,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock("../meal-draft-review.jsx", () => ({
  MealDraftSummaryCard: ({ items }) => (
    <div data-testid="meal-summary">{items.length} meal drafts</div>
  ),
  MealDraftCard: ({ item }) => <div>{item.title}</div>,
}));

beforeEach(() => {
  mocks.rooms.length = 0;
  mocks.auraProps.length = 0;
  mocks.createLiveKitSession.mockReset().mockResolvedValue({
    liveKitUrl: "wss://livekit.example.test",
    token: "livekit-token",
    roomName: "liveon-nutrition-voice-1",
    participantIdentity: "user-abc",
    agentName: "liveon-nutrition-agent",
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  });
  mocks.actions.addWaterCup.mockReset().mockResolvedValue({});
  mocks.actions.addMeal.mockReset().mockResolvedValue({});
  mocks.actions.addWorkout.mockReset().mockResolvedValue({});
  mocks.actions.setMood.mockReset().mockResolvedValue({});
  mocks.toastSuccess.mockReset();
  mocks.toastError.mockReset();
});

describe("AudioAddBottomSheet LiveKit voice agent", () => {
  it("renders through the shared bottom drawer shell", async () => {
    render(<AudioAddBottomSheet onClose={vi.fn()} />);

    expect(await screen.findByText("Ovozli agent")).toBeInTheDocument();
    expect(
      document.body.querySelector('[data-slot="drawer-content"]'),
    ).toBeInTheDocument();
  });

  it("opens a fullscreen LiveKit session and reflects agent state messages", async () => {
    render(<AudioAddBottomSheet onClose={vi.fn()} />);

    expect(await screen.findByText("Ovozli agent")).toBeInTheDocument();
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));
    const room = mocks.rooms[0];

    await waitFor(() => {
      expect(room.connect).toHaveBeenCalledWith(
        "wss://livekit.example.test",
        "livekit-token",
      );
      expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(
        true,
      );
    });

    act(() => {
      room.emit(
        "dataReceived",
        encodeMessage({ type: "agent_state", state: "thinking" }),
        null,
        null,
        "liveon.voice_agent",
      );
    });

    await waitFor(() => {
      expect(screen.getByText("O'ylayapti")).toBeInTheDocument();
    });
  });

  it("passes the subscribed LiveKit agent audio track into Agents UI Aura", async () => {
    render(<AudioAddBottomSheet onClose={vi.fn()} />);
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    const agentAudioTrack = { kind: "audio", sid: "track-1" };

    act(() => {
      mocks.rooms[0].emit(
        "trackSubscribed",
        agentAudioTrack,
        { kind: "audio", source: "microphone" },
        { identity: "liveon-nutrition-agent" },
      );
    });

    await waitFor(() => {
      expect(mocks.auraProps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            audioTrack: agentAudioTrack,
            color: "#1FD5F9",
            colorShift: 0.1,
            size: "lg",
          }),
        ]),
      );
    });
  });

  it("renders a water draft editor and saves through water tracking", async () => {
    const onClose = vi.fn();

    render(<AudioAddBottomSheet dateKey="2026-05-24" onClose={onClose} />);
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    act(() => {
      mocks.rooms[0].emit(
        "dataReceived",
        encodeMessage({
          type: "draft_result",
          result: {
            kind: "water",
            transcript: "1.5 litr suv ichdim",
            confidence: 0.9,
            payload: { amountMl: 1500, unit: "ml", time: "08:30" },
          },
        }),
        null,
        null,
        "liveon.voice_agent",
      );
    });

    const amountInput = await screen.findByLabelText("Suv miqdori");
    fireEvent.change(amountInput, { target: { value: "800" } });
    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.actions.addWaterCup).toHaveBeenCalledWith(
        "2026-05-24",
        800,
      );
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Audio natija saqlandi.");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders meal review and saves meal drafts through existing addMeal action", async () => {
    render(
      <AudioAddBottomSheet
        dateKey="2026-05-24"
        mealType="lunch"
        loggedAt="2026-05-24T12:00:00.000Z"
      />,
    );
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    act(() => {
      mocks.rooms[0].emit(
        "dataReceived",
        encodeMessage({
          type: "draft_result",
          result: {
            kind: "meal",
            transcript: "Tovuq va guruch yedim",
            confidence: 0.84,
            payload: {
              items: [
                {
                  id: "meal-1",
                  title: "Tovuq va guruch",
                  grams: 320,
                  confidence: 0.84,
                  reviewNeeded: true,
                  nutrition: {
                    calories: 560,
                    protein: 38,
                    carbs: 58,
                    fat: 16,
                    fiber: 3,
                  },
                  ingredients: [],
                },
              ],
            },
          },
        }),
        null,
        null,
        "liveon.voice_agent",
      );
    });

    expect(await screen.findByText("Tovuq va guruch")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mocks.actions.addMeal).toHaveBeenCalledWith(
        "2026-05-24",
        "lunch",
        expect.objectContaining({
          name: "Tovuq va guruch",
          source: "audio",
          cal: 560,
          protein: 38,
        }),
      );
    });
  });

  it("disconnects when cancelled", async () => {
    const onClose = vi.fn();

    render(<AudioAddBottomSheet onClose={onClose} />);
    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    fireEvent.click(screen.getByRole("button", { name: /Bekor qilish/i }));

    expect(mocks.rooms[0].disconnect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the backend setup error when LiveKit session config is missing", async () => {
    mocks.createLiveKitSession.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            statusCode: 400,
            message: "LiveKit audio session sozlanmagan.",
          },
        },
      },
    });

    render(<AudioAddBottomSheet onClose={vi.fn()} />);

    expect(
      await screen.findByText("LiveKit audio session sozlanmagan."),
    ).toBeInTheDocument();
  });

  it("shows an actionable error when the LiveKit room connects but no agent worker responds", async () => {
    render(<AudioAddBottomSheet agentReadyTimeoutMs={5} onClose={vi.fn()} />);

    await waitFor(() => expect(mocks.rooms).toHaveLength(1));

    expect(
      await screen.findByText(
        "Ovozli agent hozircha ulanmagan. Voice agent servisini tekshiring.",
      ),
    ).toBeInTheDocument();
  });
});
