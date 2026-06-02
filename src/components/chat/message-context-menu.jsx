import React, { useEffect, useRef } from "react";
import filter from "lodash/filter";
import map from "lodash/map";
import {
  ReplyIcon,
  PencilIcon,
  Trash2Icon,
  Share2Icon,
  PinIcon,
  CopyIcon,
  BookmarkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isChatFeatureEnabled } from "@/modules/chat/lib/chat-feature-flags.js";

const baseMenuItems = [
  { action: "reply", label: "Javob berish", icon: ReplyIcon, always: true },
  { action: "edit", label: "Tahrirlash", icon: PencilIcon, meOnly: true },
  {
    action: "delete",
    label: "O'chirish",
    icon: Trash2Icon,
    meOnly: true,
    destructive: true,
  },
  { action: "forward", label: "Forward", icon: Share2Icon, always: true },
  { action: "pin", label: "Pin qilish", icon: PinIcon, always: true },
  { action: "copy", label: "Nusxalash", icon: CopyIcon, always: true },
  {
    action: "bookmark",
    label: "Saqlash",
    icon: BookmarkIcon,
    always: true,
    feature: "bookmarks",
  },
];

export default function MessageContextMenu({
  position,
  isMe,
  onAction,
  onClose,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const visibleBaseItems = filter(
    baseMenuItems,
    (item) =>
      (!item.feature || isChatFeatureEnabled(item.feature)) &&
      (item.always || (item.meOnly && isMe))
  );
  const renderItem = (item) => {
    const Icon = item.icon;
    return (
      <button type="button"
        key={item.action}
        role="menuitem"
        className={cn(
          "flex min-h-10 w-full min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
          "hover:bg-muted focus-visible:bg-muted outline-none",
          item.destructive && "text-destructive hover:bg-destructive/10"
        )}
        onClick={() => {
          onAction(item.action);
          onClose();
        }}
      >
        <Icon className="size-4 shrink-0" />
        <span className="min-w-0 break-words">{item.label}</span>
      </button>
    );
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 max-h-[min(70svh,28rem)] min-w-0 overflow-y-auto animate-in fade-in zoom-in-95 sm:inset-auto sm:left-[var(--menu-left)] sm:top-[var(--menu-top)] sm:min-w-[180px]",
        "rounded-xl border bg-popover p-1.5 shadow-lg"
      )}
      style={{
        "--menu-left": `${position.x}px`,
        "--menu-top": `${position.y}px`,
      }}
      role="menu"
      aria-label="Xabar amallar menyusi"
    >
      {map(visibleBaseItems, renderItem)}
    </div>
  );
}
