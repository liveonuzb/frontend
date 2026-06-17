import React from "react";
import { MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const HoldToRecordButton = ({
  recording = false,
  disabled = false,
  level = 0,
  onPressStart,
  onPressEnd,
}) => {
  const glowScale = 1 + Math.min(0.18, level * 0.22);

  return (
    <button
      type="button"
      aria-label="Mikrofonni bosib turing"
      aria-pressed={recording}
      disabled={disabled}
      onPointerDown={onPressStart}
      onPointerUp={onPressEnd}
      onPointerLeave={recording ? onPressEnd : undefined}
      onPointerCancel={onPressEnd}
      onMouseDown={onPressStart}
      onMouseUp={onPressEnd}
      onTouchStart={onPressStart}
      onTouchEnd={onPressEnd}
      onKeyDown={(event) => {
        if (event.code !== "Space") return;
        event.preventDefault();
        onPressStart?.(event);
      }}
      onKeyUp={(event) => {
        if (event.code !== "Space") return;
        event.preventDefault();
        onPressEnd?.(event);
      }}
      className={cn(
        "group relative grid size-28 place-items-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-[0_20px_55px_rgba(22,101,52,0.14)] outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-emerald-500/45 disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none",
        recording && "scale-[1.04] border-emerald-300 bg-emerald-50 text-emerald-700",
      )}
      style={{
        transform: recording ? `scale(${glowScale})` : undefined,
      }}
    >
      {recording ? (
        <>
          <span className="absolute inset-0 rounded-full bg-emerald-400/15 blur-xl" />
          <span className="absolute inset-[-8px] rounded-full border border-emerald-300/55 animate-ping motion-reduce:animate-none" />
          <span className="absolute inset-[-18px] rounded-full border border-emerald-300/35 animate-pulse motion-reduce:animate-none" />
          <span className="absolute inset-[-30px] rounded-full border border-emerald-200/45 animate-pulse motion-reduce:animate-none" />
        </>
      ) : null}
      <span className="relative grid size-16 place-items-center rounded-full bg-emerald-100">
        <MicIcon className="size-8" strokeWidth={2.4} />
      </span>
    </button>
  );
};

export default HoldToRecordButton;
