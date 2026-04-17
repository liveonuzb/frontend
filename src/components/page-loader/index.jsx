import React from "react";
import { cn } from "@/lib/utils";

/**
 * Page loading fallback — shown while lazy-loaded pages are being fetched
 */
const PageLoader = ({ className }) => (
    <div className={cn("flex items-center justify-center min-h-[60vh]", className)}>
        <div className="flex flex-col items-center gap-4">
            <div className="relative size-12">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Yuklanmoqda...</p>
        </div>
    </div>
);

export default PageLoader;
