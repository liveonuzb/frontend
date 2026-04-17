import { clamp } from "lodash";
import React from "react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "./animated-counter";

const CircularProgress = ({
    value = 0,
    max = 100,
    size = 120,
    strokeWidth = 12,
    className,
    gradientColors = ["#f97316", "#f59e0b"], // orange to amber
    label = "Progress",
    showValue = true,
    children,
}) => {
    const radius = Math.max(0, (size - strokeWidth) / 2);
    const circumference = radius * 2 * Math.PI;
    const boundedValue = clamp(value, 0, max);
    const percent = max > 0 ? (boundedValue / max) : 0;
    const strokeDashoffset = circumference - percent * circumference;

    // Create a unique id for the gradient to allow multiple usages
    const gradientId = `circ-grad-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div
            className={cn("relative flex items-center justify-center rounded-full", className)}
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90 origin-center"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradientColors[0]} />
                        <stop offset="100%" stopColor={gradientColors[1]} />
                    </linearGradient>
                </defs>

                {/* Track Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-muted/30"
                    strokeWidth={strokeWidth}
                />

                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {children ? children : (
                    <>
                        {showValue && (
                            <div className="flex items-baseline font-black leading-none gap-0.5">
                                <span className="text-2xl"><AnimatedCounter value={boundedValue} duration={1000} /></span>
                                <span className="text-xs text-muted-foreground/80">%</span>
                            </div>
                        )}
                        {label && (
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mt-1">{label}</span>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CircularProgress;
