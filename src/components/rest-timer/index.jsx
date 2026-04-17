import React from "react";
import { cn } from "@/lib/utils";

const RestTimer = ({ seconds, onComplete, className }) => {
    const [remaining, setRemaining] = React.useState(seconds);
    const audioRef = React.useRef(null);

    React.useEffect(() => {
        setRemaining(seconds);
    }, [seconds]);

    React.useEffect(() => {
        if (remaining <= 0) {
            onComplete?.();
            return;
        }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                const next = prev - 1;
                // Beep for last 3 seconds
                if (next <= 3 && next > 0) {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.value = next === 1 ? 880 : 660;
                        gain.gain.value = 0.1;
                        osc.start();
                        osc.stop(ctx.currentTime + 0.15);
                    } catch (e) {
                        console.error(e);
                    }
                }
                if (next === 0) {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.value = 1000;
                        gain.gain.value = 0.15;
                        osc.start();
                        osc.stop(ctx.currentTime + 0.3);
                    } catch (e) {
                        console.error(e);
                    }
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [remaining, onComplete]);

    const progress = seconds > 0
        ? ((seconds - remaining) / seconds) * 100
        : 0;

    const circumference = 2 * Math.PI * 54; // radius 54
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const isUrgent = remaining <= 3 && remaining > 0;

    return (
        <div className={cn("flex flex-col items-center gap-3", className)}>
            {/* Circular progress */}
            <div className="relative size-32">
                <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                    {/* Background circle */}
                    <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke={isUrgent ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-linear"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                        "text-3xl font-bold tabular-nums",
                        isUrgent && "text-destructive animate-pulse"
                    )}>
                        {mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : secs}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Dam olish</span>
                </div>
            </div>
            <p className="text-xs text-muted-foreground">
                {remaining === 0 ? "Tayyor!" : "Keyingi setga tayyorlaning"}
            </p>
        </div>
    );
};

export default RestTimer;
