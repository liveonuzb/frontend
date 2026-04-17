import * as React from "react";
import { find, map } from "lodash";
import { cn } from "@/lib/utils";
import { STICKER_PACKS } from "@/data/stickers.mock";

function StickerPicker({ open, onClose, onSelect }) {
    const [activePackId, setActivePackId] = React.useState(STICKER_PACKS[0].id);
    const panelRef = React.useRef(null);

    const activePack = find(STICKER_PACKS, (p) => p.id === activePackId) ?? STICKER_PACKS[0];

    // Close on outside click
    React.useEffect(() => {
        if (!open) return;

        function handleClickOutside(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose?.();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onClose]);

    // Close on Escape
    React.useEffect(() => {
        if (!open) return;

        function handleKeyDown(e) {
            if (e.key === "Escape") {
                onClose?.();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    function handleStickerClick(emoji) {
        onSelect?.(emoji);
        onClose?.();
    }

    return (
        <div
            ref={panelRef}
            className={cn(
                "absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border bg-background shadow-xl",
                "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200",
            )}
        >
            {/* Pack tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
                {map(STICKER_PACKS, (pack) => (
                    <button
                        key={pack.id}
                        type="button"
                        onClick={() => setActivePackId(pack.id)}
                        className={cn(
                            "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            activePackId === pack.id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        <span className="text-sm">{pack.icon}</span>
                        <span>{pack.name}</span>
                    </button>
                ))}
            </div>

            {/* Sticker grid */}
            <div className="grid grid-cols-4 gap-1 p-2">
                {map(activePack.stickers, (emoji, index) => (
                    <button
                        key={`${activePack.id}-${index}`}
                        type="button"
                        onClick={() => handleStickerClick(emoji)}
                        className={cn(
                            "flex size-[40px] items-center justify-center rounded-lg text-2xl transition-transform duration-150",
                            "hover:scale-125 hover:bg-muted active:scale-110",
                        )}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default StickerPicker;
