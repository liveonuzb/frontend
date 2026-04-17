import { round } from "lodash";
import React from "react";
import { cn } from "@/lib/utils";

/**
 * AnimatedCounter — smoothly counts up from 0 to the target value.
 * Used for stat displays on dashboard and analytics pages.
 */
const AnimatedCounter = ({ value, duration = 1200, prefix = "", suffix = "", className, decimals = 0 }) => {
    const [display, setDisplay] = React.useState(0);
    const numValue = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

    React.useEffect(() => {
        if (isNaN(numValue)) return;

        const startTime = performance.now();

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * numValue;

            setDisplay(current);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, [numValue, duration]);

    const formatted = decimals > 0
        ? display.toFixed(decimals)
        : round(display).toLocaleString();

    return (
        <span className={cn("tabular-nums animate-count-up", className)}>
            {prefix}{formatted}{suffix}
        </span>
    );
};

export default AnimatedCounter;
