import React from "react";

const BAR_COUNT = 18;
const makeIdleBars = () =>
  Array.from({ length: BAR_COUNT }, (_, index) => {
    const center = Math.abs(index - (BAR_COUNT - 1) / 2);
    return Math.max(0.16, 0.54 - center * 0.045);
  });

export const useAudioLevel = ({ stream, active }) => {
  const [level, setLevel] = React.useState(0);
  const [levels, setLevels] = React.useState(makeIdleBars);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (!active || !stream) {
      let isCancelled = false;
      queueMicrotask(() => {
        if (isCancelled) return;
        setLevel(0);
        setLevels(makeIdleBars());
      });

      return () => {
        isCancelled = true;
      };
    }

    if (typeof window === "undefined") {
      let isCancelled = false;
      queueMicrotask(() => {
        if (!isCancelled) {
          setSupported(false);
        }
      });

      return () => {
        isCancelled = true;
      };
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
      let isCancelled = false;
      queueMicrotask(() => {
        if (!isCancelled) {
          setSupported(false);
        }
      });

      return () => {
        isCancelled = true;
      };
    }

    let rafId = 0;
    let audioContext;
    let source;
    let analyser;
    let dataArray;
    let cancelled = false;

    try {
      audioContext = new AudioContextCtor();
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.72;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      queueMicrotask(() => {
        if (!cancelled) {
          setSupported(true);
        }
      });
    } catch {
      queueMicrotask(() => {
        if (!cancelled) {
          setSupported(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }

    const tick = () => {
      if (cancelled) return;
      analyser.getByteFrequencyData(dataArray);
      const nextLevel =
        dataArray.reduce((sum, value) => sum + value, 0) /
        (dataArray.length * 255);
      const safeLevel = Math.min(1, Math.max(0, nextLevel));
      setLevel(safeLevel);
      setLevels((current) =>
        current.map((bar, index) => {
          const raw = dataArray[index % dataArray.length] / 255;
          const animated = Math.max(0.12, raw * 0.88 + safeLevel * 0.42);
          return bar * 0.35 + Math.min(1, animated) * 0.65;
        }),
      );
      rafId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      try {
        source?.disconnect();
      } catch {
        // no-op
      }
      try {
        analyser?.disconnect();
      } catch {
        // no-op
      }
      if (audioContext?.state !== "closed") {
        void audioContext?.close?.();
      }
    };
  }, [active, stream]);

  return {
    level,
    levels,
    supported,
  };
};
