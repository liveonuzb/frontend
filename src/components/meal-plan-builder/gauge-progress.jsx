import React, { memo } from "react";
import { clamp, times } from "lodash";
import { FlameIcon } from "lucide-react";

const GaugeProgress = memo(
  ({ value, min = 0, max = 2650, id = "default", label = "QO'SHILMOQDA" }) => {
    const vw = 280;
    const vh = 155;
    const cx = vw / 2;
    const cy = 135;
    const radius = 105;
    const strokeW = 13;

    const startAngle = 180;
    const totalSweep = 180;

    const pct = clamp((value - min) / (max - min), 0, 1);
    const filledAngle = startAngle - pct * totalSweep;

    // Green → sariq → qizil (pct 0→1)
    const hue = Math.round(120 * (1 - pct));
    const arcColor = `hsl(${hue}, 75%, 45%)`;
    const arcColorLight = `hsl(${hue}, 65%, 60%)`;
    const arcColorDark = `hsl(${hue}, 80%, 32%)`;

    const polarToCartesian = (angle) => {
      const rad = (angle * Math.PI) / 180;
      return {
        x: cx + radius * Math.cos(rad),
        y: cy - radius * Math.sin(rad),
      };
    };

    const arcPath = (fromAngle, toAngle) => {
      const start = polarToCartesian(fromAngle);
      const end = polarToCartesian(toAngle);
      const largeArc = Math.abs(fromAngle - toAngle) > 180 ? 1 : 0;
      return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    const bgArc = arcPath(startAngle, 0);
    const knobPos = polarToCartesian(filledAngle);

    // Kamida 5° sweep bo'lganda arc chiz (aks holda knob ostida "tayoq" chiqadi)
    const MIN_PCT = 5 / totalSweep; // 5° / 180° ≈ 0.028
    const filledArc = pct >= MIN_PCT ? arcPath(startAngle, filledAngle) : null;

    const tickCount = 30;
    const ticks = times(tickCount + 1, (i) => {
      const angle = startAngle - (i / tickCount) * totalSweep;
      const innerR = radius - strokeW / 2 - 4;
      const outerR = radius - strokeW / 2 - (i % 5 === 0 ? 13 : 8);
      const rad = (angle * Math.PI) / 180;
      const isFilled = angle >= filledAngle;
      return {
        x1: cx + innerR * Math.cos(rad),
        y1: cy - innerR * Math.sin(rad),
        x2: cx + outerR * Math.cos(rad),
        y2: cy - outerR * Math.sin(rad),
        major: i % 5 === 0,
        filled: isFilled,
      };
    });

    const gradientId = `gaugeGrad-${id}`;
    const knobShadowId = `knobShadow-${id}`;

    const formattedValue = Math.round(value).toLocaleString("en-US");

    return (
      <div className="w-full max-w-[280px] mx-auto pt-2">
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          style={{ width: "100%", height: "auto", overflow: "visible" }}
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={arcColorLight} />
              <stop offset="50%" stopColor={arcColor} />
              <stop offset="100%" stopColor={arcColorDark} />
            </linearGradient>
            <filter
              id={knobShadowId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="3"
                floodColor="#000"
                floodOpacity="0.25"
              />
            </filter>
          </defs>

          {/* Background arc — har doim ko'rinadi */}
          <path
            d={bgArc}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            className="text-border opacity-60"
          />

          {/* Filled arc — faqat pct>0 da */}
          {filledArc && (
            <path
              d={filledArc}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )}

          {/* Ticks */}
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.filled ? arcColor : "currentColor"}
              strokeWidth={t.major ? 2 : 1}
              opacity={t.filled ? 0.7 : 0.5}
              className={t.filled ? undefined : "text-muted-foreground"}
            />
          ))}

          {/* Knob — dashboard kabi cx/cy to'g'ridan-to'g'ri */}
          <circle
            cx={knobPos.x}
            cy={knobPos.y}
            r={8}
            fill={arcColor}
            stroke="white"
            strokeWidth={3}
            filter={`url(#${knobShadowId})`}
          />

          {/* Center: FlameIcon */}
          <FlameIcon
            x={cx - 10}
            y={cy - 58}
            width={20}
            height={20}
            className="text-foreground/60"
          />

          {/* Label */}
          <text
            x={cx}
            y={cy - 26}
            textAnchor="middle"
            style={{
              fill: "var(--muted-foreground)",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {label}
          </text>

          {/* Value */}
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            style={{ fill: "var(--foreground)", fontSize: 34, fontWeight: 900 }}
          >
            {formattedValue}
          </text>

          {/* Unit */}
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            style={{
              fill: "var(--muted-foreground)",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            kcal
          </text>
        </svg>
      </div>
    );
  },
);

GaugeProgress.displayName = "GaugeProgress";

export default GaugeProgress;
