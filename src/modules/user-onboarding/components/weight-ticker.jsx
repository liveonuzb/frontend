import React from "react";
import clamp from "lodash/clamp";
import includes from "lodash/includes";
import map from "lodash/map";
import split from "lodash/split";
import toNumber from "lodash/toNumber";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

const NOTCH_SIZE = 12; // px per notch along the axis of motion
const SPRING_CONFIG = { stiffness: 340, damping: 36, mass: 0.5 };
const DEFAULT_ACCENT = "var(--color-primary)";
const LABEL_SLOT = 18; // reserved slot (perpendicular axis) for number labels
const NOTCH_AREA = 40; // reserved slot for the notch itself
const WHEEL_SNAP_DEBOUNCE = 140;
const SLIDER_KEY_SHORTCUTS =
  "ArrowUp ArrowDown ArrowLeft ArrowRight PageUp PageDown Home End";

const getDecimals = (step) => split(step.toString(), ".")[1]?.length ?? 0;

const toStepValue = (value, min, max, step) => {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric)) return min;
  const clamped = clamp(numeric, min, max);
  const snapped = Math.round((clamped - min) / step) * step + min;
  const decimals = getDecimals(step);
  return toNumber(snapped.toFixed(decimals));
};

const isMultipleOf = (value, base) => {
  if (!base || base <= 0) return false;
  const ratio = value / base;
  return Math.abs(ratio - Math.round(ratio)) < 1e-6;
};

/**
 * Ticker-style slider. Supports horizontal (default) or vertical orientation,
 * drag + wheel/trackpad scroll, and shows a big value display.
 */
export const WeightTicker = ({
  value,
  onChange,
  min = 30,
  max = 250,
  step = 0.5,
  unit = "kg",
  majorStep = 1,
  labelStep = 5,
  valueDecimals,
  accentColor = DEFAULT_ACCENT,
  ariaLabel,
  className,
  orientation = "horizontal",
  showValue = true,
  verticalHeight = 260,
}) => {
  const isVertical = orientation === "vertical";
  const shouldReduceMotion = useReducedMotion();
  const containerRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const wheelTimerRef = React.useRef(null);

  const decimals = getDecimals(step);
  const displayDecimals = valueDecimals ?? decimals;
  const stepsCount = Math.round((max - min) / step) + 1;
  const minOffset = -(stepsCount - 1) * NOTCH_SIZE;
  const maxOffset = 0;

  const resolvedValue = React.useMemo(
    () => toStepValue(value ?? min, min, max, step),
    [value, min, max, step],
  );
  const resolvedIndex = Math.round((resolvedValue - min) / step);

  const rawOffset = useMotionValue(-resolvedIndex * NOTCH_SIZE);
  const springOffset = useSpring(rawOffset, SPRING_CONFIG);
  const offset = shouldReduceMotion ? rawOffset : springOffset;

  React.useEffect(() => {
    if (isDragging.current) return;
    rawOffset.set(-resolvedIndex * NOTCH_SIZE);
  }, [resolvedIndex, rawOffset]);

  const displayValue = useTransform(offset, (latest) => {
    const idx = clamp(Math.round(-latest / NOTCH_SIZE), 0, stepsCount - 1);
    return (idx * step + min).toFixed(displayDecimals);
  });

  const emitFromOffset = React.useCallback(
    (nextOffset) => {
      const idx = clamp(
        Math.round(-nextOffset / NOTCH_SIZE),
        0,
        stepsCount - 1,
      );
      const next = toNumber((idx * step + min).toFixed(decimals));
      onChange?.(String(next));
    },
    [decimals, min, onChange, step, stepsCount],
  );

  const setValueFromKeyboard = React.useCallback(
    (nextValue) => {
      const next = toStepValue(nextValue, min, max, step);
      const nextIndex = Math.round((next - min) / step);
      rawOffset.set(-nextIndex * NOTCH_SIZE);
      onChange?.(String(next));
    },
    [max, min, onChange, rawOffset, step],
  );

  const handleKeyDown = React.useCallback(
    (event) => {
      const incrementKeys = isVertical
        ? ["ArrowUp", "ArrowRight"]
        : ["ArrowRight", "ArrowUp"];
      const decrementKeys = isVertical
        ? ["ArrowDown", "ArrowLeft"]
        : ["ArrowLeft", "ArrowDown"];
      let nextValue = null;

      if (includes(incrementKeys, event.key)) {
        nextValue = resolvedValue + step;
      } else if (includes(decrementKeys, event.key)) {
        nextValue = resolvedValue - step;
      } else if (event.key === "PageUp") {
        nextValue = resolvedValue + majorStep;
      } else if (event.key === "PageDown") {
        nextValue = resolvedValue - majorStep;
      } else if (event.key === "Home") {
        nextValue = min;
      } else if (event.key === "End") {
        nextValue = max;
      }

      if (nextValue === null) {
        return;
      }

      event.preventDefault();
      setValueFromKeyboard(nextValue);
    },
    [
      isVertical,
      majorStep,
      max,
      min,
      resolvedValue,
      setValueFromKeyboard,
      step,
    ],
  );

  const snapToNearest = React.useCallback(() => {
    const current = rawOffset.get();
    const snapped =
      clamp(Math.round(current / NOTCH_SIZE), -(stepsCount - 1), 0) *
      NOTCH_SIZE;
    rawOffset.set(snapped);
    emitFromOffset(snapped);
  }, [emitFromOffset, rawOffset, stepsCount]);
  const emitFromOffsetEvent = React.useEffectEvent(emitFromOffset);
  const snapToNearestEvent = React.useEffectEvent(snapToNearest);

  const handlePointerDown = React.useCallback(
    (event) => {
      isDragging.current = true;
      const startPos = isVertical ? event.clientY : event.clientX;
      const startOffset = rawOffset.get();

      const handleMove = (moveEvent) => {
        const pos = isVertical ? moveEvent.clientY : moveEvent.clientX;
        const delta = pos - startPos;
        const nextOffset = clamp(startOffset + delta, minOffset, maxOffset);
        rawOffset.set(nextOffset);
        emitFromOffset(nextOffset);
      };

      const handleUp = () => {
        isDragging.current = false;
        snapToNearest();
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    },
    [
      emitFromOffset,
      isVertical,
      maxOffset,
      minOffset,
      rawOffset,
      snapToNearest,
    ],
  );

  // Wheel / trackpad scroll
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const handleWheel = (event) => {
      const delta = event.deltaX + event.deltaY;
      if (!delta) return;
      event.preventDefault();
      const next = clamp(rawOffset.get() - delta, minOffset, maxOffset);
      rawOffset.set(next);
      emitFromOffsetEvent(next);

      if (wheelTimerRef.current) {
        window.clearTimeout(wheelTimerRef.current);
      }
      wheelTimerRef.current = window.setTimeout(() => {
        snapToNearestEvent();
      }, WHEEL_SNAP_DEBOUNCE);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (wheelTimerRef.current) {
        window.clearTimeout(wheelTimerRef.current);
      }
    };
  }, [maxOffset, minOffset, rawOffset]);

  const items = React.useMemo(
    () => Array.from({ length: stepsCount }, (_, i) => i),
    [stepsCount],
  );

  // ==================== Vertical orientation ====================
  if (isVertical) {
    const trackSize = verticalHeight;

    return (
      <div
        className={cn(
          "flex shrink-0 flex-col items-end gap-2 text-foreground",
          className,
        )}
        style={{ "--ticker-accent": accentColor }}
      >
        {showValue ? (
          <div className="flex items-baseline justify-center gap-1.5 pr-2">
            <motion.span className="text-2xl font-black leading-none tabular-nums md:text-5xl">
              {displayValue}
            </motion.span>
            <span className="text-base font-bold text-muted-foreground md:text-lg">
              {unit}
            </span>
          </div>
        ) : null}
        <div
          className="relative"
          style={{
            height: trackSize,
            width: LABEL_SLOT + NOTCH_AREA + 16,
          }}
        >
          {/* Center pointer sits on the same 12px row as the active tick. */}
          <div
            aria-hidden
            data-testid="ticker-center-pointer"
            className="pointer-events-none absolute z-10 flex items-center"
            style={{
              top: `calc(50% - ${NOTCH_SIZE / 2}px)`,
              right: NOTCH_AREA + LABEL_SLOT + 2,
              height: NOTCH_SIZE,
            }}
          >
            <span
              className="block size-0"
              style={{
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderLeft: `7px solid ${accentColor}`,
                filter: `drop-shadow(-1px 0 2px ${accentColor}55)`,
              }}
            />
          </div>

          <div
            className="relative size-full overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
            }}
          >
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onKeyDown={handleKeyDown}
              role="slider"
              tabIndex={0}
              aria-label={ariaLabel || unit}
              aria-keyshortcuts={SLIDER_KEY_SHORTCUTS}
              aria-orientation="vertical"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={resolvedValue}
              aria-valuetext={`${resolvedValue} ${unit}`}
              className="relative size-full cursor-grab select-none touch-none active:cursor-grabbing"
              style={{
                padding: `calc(50% - ${NOTCH_SIZE / 2}px) 0`,
              }}
            >
              <motion.ul
                className="relative m-0 flex w-full list-none flex-col items-stretch p-0"
                style={{ y: offset }}
              >
                {map(items, (i) => (
                  <TickCell
                    key={i}
                    index={i}
                    step={step}
                    min={min}
                    majorStep={majorStep}
                    labelStep={labelStep}
                    offset={offset}
                    accentColor={accentColor}
                    orientation="vertical"
                  />
                ))}
              </motion.ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Horizontal orientation ====================
  return (
    <div
      className={cn(
        "flex w-full max-w-[560px] flex-col items-center gap-2 text-foreground",
        className,
      )}
      style={{ "--ticker-accent": accentColor }}
    >
      {showValue ? (
        <div className="flex items-baseline justify-center gap-1.5">
          <motion.span className="text-5xl font-black leading-none tabular-nums md:text-6xl">
            {displayValue}
          </motion.span>
          <span className="text-lg font-bold text-muted-foreground md:text-xl">
            {unit}
          </span>
        </div>
      ) : null}
      <div
        className="relative w-full"
        style={{ height: LABEL_SLOT + NOTCH_AREA + 8 }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
          style={{ top: LABEL_SLOT + 2 }}
        >
          <span
            className="block size-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `7px solid ${accentColor}`,
              filter: `drop-shadow(0 1px 2px ${accentColor}55)`,
            }}
          />
        </div>

        <div
          className="relative size-full overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)",
          }}
        >
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            role="slider"
            tabIndex={0}
            aria-label={ariaLabel || unit}
            aria-keyshortcuts={SLIDER_KEY_SHORTCUTS}
            aria-orientation="horizontal"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={resolvedValue}
            aria-valuetext={`${resolvedValue} ${unit}`}
            className="relative size-full cursor-grab select-none touch-none active:cursor-grabbing"
            style={{
              padding: `0 calc(50% - ${NOTCH_SIZE / 2}px)`,
            }}
          >
            <motion.ul
              className="relative m-0 flex h-full list-none items-stretch p-0"
              style={{ x: offset }}
            >
              {map(items, (i) => (
                <TickCell
                  key={i}
                  index={i}
                  step={step}
                  min={min}
                  majorStep={majorStep}
                  labelStep={labelStep}
                  offset={offset}
                  accentColor={accentColor}
                  orientation="horizontal"
                />
              ))}
            </motion.ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const TickCell = ({
  index,
  step,
  min,
  majorStep,
  labelStep,
  offset,
  accentColor,
  orientation,
}) => {
  const isVertical = orientation === "vertical";

  const distance = useTransform(offset, (latest) => {
    const currentCenter = -latest / NOTCH_SIZE;
    return Math.abs(index - currentCenter);
  });

  const opacity = useTransform(distance, [0, 1, 4, 8], [1, 0.7, 0.4, 0.18]);
  const bg = useTransform(distance, (d) =>
    d < 0.5 ? accentColor : "currentColor",
  );

  const value = index * step + min;
  const isMajor = isMultipleOf(value, majorStep);
  const isMedium = !isMajor && isMultipleOf(value, majorStep / 2);
  const hasLabel = isMultipleOf(value, labelStep);

  const notchLong = isMajor ? 26 : isMedium ? 18 : 11;
  const notchShort = isMajor ? 2.5 : 2;

  if (isVertical) {
    return (
      <li
        className="relative shrink-0"
        style={{ width: "100%", height: NOTCH_SIZE }}
      >
        <div className="flex size-full items-center justify-end gap-1.5">
          {/* Label slot (left of notch) */}
          <div
            className="flex items-center justify-end"
            style={{ width: LABEL_SLOT, height: "100%" }}
          >
            {hasLabel ? (
              <span className="text-[10px] font-semibold leading-none tabular-nums text-muted-foreground">
                {Math.round(value)}
              </span>
            ) : null}
          </div>
          {/* Notch (horizontal bar) */}
          <div
            className="flex items-center justify-end"
            style={{ width: NOTCH_AREA, height: "100%" }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: notchLong,
                height: notchShort,
                backgroundColor: bg,
                opacity,
                willChange: "opacity, background-color",
              }}
            />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className="relative shrink-0"
      style={{ width: NOTCH_SIZE, height: "100%" }}
    >
      <div className="flex size-full flex-col items-center">
        <div
          className="flex w-full items-end justify-center"
          style={{ height: LABEL_SLOT }}
        >
          {hasLabel ? (
            <span className="text-[10px] font-semibold leading-none tabular-nums text-muted-foreground">
              {Math.round(value)}
            </span>
          ) : null}
        </div>
        <div
          className="flex w-full items-start justify-center"
          style={{ height: NOTCH_AREA }}
        >
          <motion.div
            className="rounded-full"
            style={{
              width: notchShort,
              height: notchLong,
              backgroundColor: bg,
              opacity,
              willChange: "opacity, background-color",
            }}
          />
        </div>
      </div>
    </li>
  );
};

export default WeightTicker;
