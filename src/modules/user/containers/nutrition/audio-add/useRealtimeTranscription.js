import React from "react";
import { createAudioSession } from "./audioAnalysisApi.js";

const OPENAI_REALTIME_WEBRTC_CALLS_URL =
  "https://api.openai.com/v1/realtime/calls";
const STOP_GRACE_MS = 1200;

const getEventText = (event) =>
  event?.delta ||
  event?.text ||
  event?.transcript ||
  event?.item?.content?.[0]?.transcript ||
  event?.response?.output_text ||
  "";

const isTranscriptDeltaEvent = (type) =>
  [
    "conversation.item.input_audio_transcription.delta",
    "input_audio_buffer.transcription.delta",
    "response.audio_transcript.delta",
    "response.output_text.delta",
  ].includes(type);

const isTranscriptCompletedEvent = (type) =>
  [
    "conversation.item.input_audio_transcription.completed",
    "input_audio_buffer.transcription.completed",
    "response.audio_transcript.done",
    "response.output_text.done",
  ].includes(type);

const getClientSecret = (session) =>
  session?.clientSecret ||
  session?.client_secret?.value ||
  session?.client_secret ||
  session?.session?.client_secret?.value ||
  session?.session?.client_secret ||
  null;

export const useRealtimeTranscription = () => {
  const [partialText, setPartialText] = React.useState("");
  const [finalText, setFinalText] = React.useState("");
  const [error, setError] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);

  const peerRef = React.useRef(null);
  const channelRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);
  const connectionIdRef = React.useRef(0);
  const partialRef = React.useRef("");
  const finalRef = React.useRef("");
  const stopResolverRef = React.useRef(null);
  const stopTimerRef = React.useRef(null);

  const closeConnection = React.useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    try {
      abortControllerRef.current?.abort?.();
    } catch {
      // no-op
    }
    try {
      channelRef.current?.close?.();
    } catch {
      // no-op
    }
    try {
      peerRef.current?.getSenders?.().forEach((sender) => {
        try {
          sender.track?.stop?.();
        } catch {
          // no-op
        }
      });
      peerRef.current?.close?.();
    } catch {
      // no-op
    }

    channelRef.current = null;
    peerRef.current = null;
    abortControllerRef.current = null;
    setConnecting(false);
  }, []);

  const finishStop = React.useCallback(() => {
    const text = (finalRef.current || partialRef.current || "").trim();
    if (text) {
      finalRef.current = text;
      setFinalText(text);
    }
    closeConnection();
    stopResolverRef.current?.(text);
    stopResolverRef.current = null;
    return text;
  }, [closeConnection]);

  const appendPartial = React.useCallback((chunk) => {
    const nextChunk = String(chunk || "");
    if (!nextChunk) return;
    partialRef.current = `${partialRef.current}${nextChunk}`;
    setPartialText(partialRef.current);
  }, []);

  const setFinalTranscript = React.useCallback(
    (text) => {
      const next = String(text || partialRef.current || "").trim();
      if (!next) return;
      finalRef.current = next;
      setFinalText(next);
      setPartialText(next);
      if (stopResolverRef.current) {
        finishStop();
      }
    },
    [finishStop],
  );

  const handleRealtimeEvent = React.useCallback(
    (message) => {
      let payload;
      try {
        payload = JSON.parse(message.data);
      } catch {
        return;
      }

      if (payload?.type === "error") {
        setError(
          payload?.error?.message ||
            "Transkript qilishda xatolik yuz berdi.",
        );
        return;
      }

      if (isTranscriptDeltaEvent(payload?.type)) {
        appendPartial(getEventText(payload));
        return;
      }

      if (isTranscriptCompletedEvent(payload?.type)) {
        setFinalTranscript(getEventText(payload));
      }
    },
    [appendPartial, setFinalTranscript],
  );

  const reset = React.useCallback(() => {
    partialRef.current = "";
    finalRef.current = "";
    setPartialText("");
    setFinalText("");
    setError("");
  }, []);

  const start = React.useCallback(
    async ({ stream }) => {
      const connectionId = connectionIdRef.current + 1;
      connectionIdRef.current = connectionId;
      reset();

      if (typeof RTCPeerConnection === "undefined") {
        throw new Error("Bu brauzer ovoz yozishni qo'llab-quvvatlamaydi.");
      }

      if (!stream) {
        throw new Error("Audio stream topilmadi.");
      }

      setConnecting(true);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const isStaleConnection = () =>
        connectionIdRef.current !== connectionId ||
        abortController.signal.aborted;

      try {
        const session = await createAudioSession();

        if (isStaleConnection()) {
          return;
        }

        const clientSecret = getClientSecret(session);

        if (!clientSecret) {
          throw new Error("Realtime session client secret topilmadi.");
        }

        const peer = new RTCPeerConnection();
        peerRef.current = peer;

        stream.getAudioTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        const channel = peer.createDataChannel("oai-events");
        channelRef.current = channel;
        channel.onmessage = handleRealtimeEvent;
        channel.onerror = () => {
          setError("Transkript qilishda xatolik yuz berdi.");
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        if (isStaleConnection()) {
          return;
        }

        const response = await fetch(OPENAI_REALTIME_WEBRTC_CALLS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
          signal: abortController.signal,
        });

        if (isStaleConnection()) {
          return;
        }

        if (!response.ok) {
          throw new Error("Realtime transkript ulanishi ochilmadi.");
        }

        const answer = await response.text();

        if (
          isStaleConnection() ||
          peerRef.current !== peer ||
          peer.signalingState === "closed"
        ) {
          return;
        }

        await peer.setRemoteDescription({
          type: "answer",
          sdp: answer,
        });
      } catch (nextError) {
        if (
          isStaleConnection() ||
          nextError?.name === "AbortError" ||
          String(nextError?.message || "").includes("signalingState is 'closed'")
        ) {
          return;
        }

        closeConnection();
        const message =
          nextError instanceof Error &&
          !String(nextError.message || "").includes("RTCPeerConnection")
            ? nextError.message
            : "Transkript qilishda xatolik yuz berdi.";
        setError(message);
        throw nextError;
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        if (connectionIdRef.current === connectionId) {
          setConnecting(false);
        }
      }
    },
    [closeConnection, handleRealtimeEvent, reset],
  );

  const stop = React.useCallback(async () => {
    connectionIdRef.current += 1;
    try {
      abortControllerRef.current?.abort?.();
    } catch {
      // no-op
    }

    if (!peerRef.current) {
      closeConnection();
      return (finalRef.current || partialRef.current || "").trim();
    }

    try {
      if (channelRef.current?.readyState === "open") {
        channelRef.current.send(
          JSON.stringify({ type: "input_audio_buffer.commit" }),
        );
      }
    } catch {
      // Some realtime transports do not accept manual commit over WebRTC.
    }

    return new Promise((resolve) => {
      stopResolverRef.current = resolve;
      stopTimerRef.current = window.setTimeout(finishStop, STOP_GRACE_MS);
    });
  }, [finishStop]);

  React.useEffect(
    () => () => {
      closeConnection();
    },
    [closeConnection],
  );

  return {
    partialText,
    finalText,
    error,
    connecting,
    start,
    stop,
    reset,
  };
};
