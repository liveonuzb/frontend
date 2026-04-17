import React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable empty state component for pages with no data
 */
const EmptyState = ({
    icon: Icon,
    emoji,
    title = "Ma'lumot topilmadi",
    description = "Hozircha hech qanday ma'lumot yo'q",
    action,
    actionLabel,
    className,
}) => (
    <div className={cn("flex items-center justify-center py-16", className)}>
        <div className="text-center max-w-sm">
            {emoji ? (
                <span className="text-5xl block mb-4">{emoji}</span>
            ) : Icon ? (
                <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Icon className="size-8 text-muted-foreground" />
                </div>
            ) : null}
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            {action && actionLabel && (
                <button onClick={action}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                    {actionLabel}
                </button>
            )}
        </div>
    </div>
);

export default EmptyState;
