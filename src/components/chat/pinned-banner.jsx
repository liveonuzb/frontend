import React from "react";
import { Button } from "@/components/ui/button";
import { PinIcon, XIcon } from "lucide-react";

export default function PinnedBanner({ message, onUnpin, onClick }) {
  if (!message) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2 backdrop-blur-sm">
      <PinIcon className="size-4 shrink-0 text-primary" />

      <button
        onClick={onClick}
        className="min-w-0 flex-1 text-left outline-none transition-colors hover:text-primary focus-visible:text-primary"
      >
        <p className="truncate text-sm text-foreground">
          {message.text || "(Media)"}
        </p>
      </button>

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation();
          onUnpin();
        }}
        aria-label="Pin olib tashlash"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
