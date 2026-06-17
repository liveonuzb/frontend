import React from "react";
import { Room, RoomEvent } from "livekit-client";
import get from "lodash/get";
import trim from "lodash/trim";
import { createLiveKitSession } from "./audioAnalysisApi.js";

export const LIVEKIT_VOICE_AGENT_TOPIC = "liveon.voice_agent";

const decoder = new TextDecoder();
const agentUnavailableMessage =
  "Ovozli agent hozircha ulanmagan. Voice agent servisini tekshiring.";
const defaultAgentReadyTimeoutMs = 12000;

const initialTranscript = {
  partialText: "",
  finalText: "",
};

const isAudioTrack = (track, publication) =>
  get(track, "kind") === "audio" ||
  get(publication, "kind") === "audio" ||
  get(publication, "source") === "microphone";

const hasRemoteParticipants = (room) =>
  Number(get(room, "remoteParticipants.size", 0)) > 0;

const getUserSafeError = (error) => {
  if (error?.name === "NotAllowedError") {
    return "Mikrofon ruxsati kerak.";
  }

  const responseMessage = trim(
    String(
      get(
        error,
        "response.data.error.message",
        get(error, "response.data.message", ""),
      ) || "",
    ),
  );
  const statusCode = Number(
    get(error, "response.status", get(error, "response.data.error.statusCode")),
  );

  if (
    responseMessage &&
    Number.isFinite(statusCode) &&
    statusCode >= 400 &&
    statusCode < 500
  ) {
    return responseMessage;
  }

  return "Ovozli agentga ulanishda xatolik yuz berdi.";
};

const parseDataMessage = (payload) => {
  try {
    const text =
      payload instanceof Uint8Array
        ? decoder.decode(payload)
        : decoder.decode(new Uint8Array(payload));
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const useLiveKitVoiceAgentSession = ({
  autoStart = true,
  agentReadyTimeoutMs = defaultAgentReadyTimeoutMs,
} = {}) => {
  const roomRef = React.useRef(null);
  const startingRef = React.useRef(false);
  const agentRespondedRef = React.useRef(false);
  const agentReadyTimeoutRef = React.useRef(null);
  const [agentState, setAgentState] = React.useState("connecting");
  const [transcript, setTranscript] = React.useState(initialTranscript);
  const [draftResult, setDraftResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [connected, setConnected] = React.useState(false);
  const [agentAudioTrack, setAgentAudioTrack] = React.useState(null);

  const clearAgentReadyTimeout = React.useCallback(() => {
    if (agentReadyTimeoutRef.current) {
      clearTimeout(agentReadyTimeoutRef.current);
      agentReadyTimeoutRef.current = null;
    }
  }, []);

  const markAgentResponded = React.useCallback(() => {
    agentRespondedRef.current = true;
    clearAgentReadyTimeout();
    setError((current) =>
      current === agentUnavailableMessage ? "" : current,
    );
  }, [clearAgentReadyTimeout]);

  const markAgentListening = React.useCallback(() => {
    markAgentResponded();
    setAgentState((current) =>
      current === "connecting" || current === "error" ? "listening" : current,
    );
  }, [markAgentResponded]);

  const startAgentReadyTimeout = React.useCallback(
    (room) => {
      clearAgentReadyTimeout();

      if (!Number.isFinite(agentReadyTimeoutMs) || agentReadyTimeoutMs <= 0) {
        return;
      }

      agentReadyTimeoutRef.current = setTimeout(() => {
        if (roomRef.current !== room || agentRespondedRef.current) {
          return;
        }

        setError(agentUnavailableMessage);
        setAgentState("error");
      }, agentReadyTimeoutMs);
    },
    [agentReadyTimeoutMs, clearAgentReadyTimeout],
  );

  const handleMessage = React.useCallback((message) => {
    if (!message || typeof message !== "object") {
      return;
    }

    if (message.type === "agent_state") {
      markAgentResponded();
      setAgentState(trim(String(message.state || "")) || "listening");
      return;
    }

    if (message.type === "transcript") {
      markAgentResponded();
      const text = trim(String(message.text || ""));
      setTranscript((current) =>
        message.final
          ? { partialText: "", finalText: text || current.finalText }
          : { ...current, partialText: text },
      );
      return;
    }

    if (message.type === "draft_result") {
      markAgentResponded();
      setDraftResult(message.result || null);
      setAgentState("reviewing");
      return;
    }

    if (message.type === "error") {
      markAgentResponded();
      setError(
        trim(String(message.message || "")) ||
          "Audio agentda xatolik yuz berdi.",
      );
      setAgentState("error");
    }
  }, [markAgentResponded]);

  const disconnect = React.useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    startingRef.current = false;

    if (room) {
      room.disconnect();
    }

    clearAgentReadyTimeout();
    setConnected(false);
    setAgentAudioTrack(null);
  }, [clearAgentReadyTimeout]);

  const start = React.useCallback(async () => {
    if (startingRef.current) {
      return;
    }

    startingRef.current = true;
    agentRespondedRef.current = false;
    clearAgentReadyTimeout();
    setAgentState("connecting");
    setTranscript(initialTranscript);
    setDraftResult(null);
    setError("");
    setAgentAudioTrack(null);

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    const onDataReceived = (payload, _participant, _kind, topic) => {
      if (topic && topic !== LIVEKIT_VOICE_AGENT_TOPIC) {
        return;
      }

      handleMessage(parseDataMessage(payload));
    };
    const onDisconnected = () => {
      clearAgentReadyTimeout();
      setConnected(false);
      setAgentAudioTrack(null);
    };
    const onParticipantConnected = () => {
      markAgentListening();
    };
    const onTrackSubscribed = (track, publication) => {
      if (isAudioTrack(track, publication)) {
        markAgentListening();
        setAgentAudioTrack(track);
      }
    };
    const onTrackUnsubscribed = (track) => {
      setAgentAudioTrack((current) => (current === track ? null : current));
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

    try {
      const session = await createLiveKitSession();
      await room.connect(session.liveKitUrl, session.token);
      await room.localParticipant?.setMicrophoneEnabled(true);
      setConnected(true);
      if (hasRemoteParticipants(room)) {
        markAgentListening();
      } else {
        startAgentReadyTimeout(room);
      }
    } catch (nextError) {
      clearAgentReadyTimeout();
      setError(getUserSafeError(nextError));
      setAgentState("error");
      room.disconnect();
    } finally {
      startingRef.current = false;
    }
  }, [
    clearAgentReadyTimeout,
    handleMessage,
    markAgentListening,
    startAgentReadyTimeout,
  ]);

  const retry = React.useCallback(() => {
    disconnect();
    void start();
  }, [disconnect, start]);

  React.useEffect(() => {
    if (autoStart) {
      void start();
    }

    return () => {
      disconnect();
    };
  }, [autoStart, disconnect, start]);

  return {
    agentState,
    connected,
    agentAudioTrack,
    transcript,
    draftResult,
    error,
    start,
    retry,
    disconnect,
  };
};
