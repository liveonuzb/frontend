import React, { useEffect, useRef } from "react";
import { filter, map } from "lodash";
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

const menuItems = [
  { action: "reply", label: "Javob berish", icon: ReplyIcon, always: true },
  { action: "edit", label: "Tahrirlash", icon: PencilIcon, meOnly: true },
  {
    action: "delete",
    label: "O'chirish",
    icon: Trash2Icon,
    always: true,
    destructive: true,
  },
  { action: "forward", label: "Forward", icon: Share2Icon, always: true },
  { action: "pin", label: "Pin qilish", icon: PinIcon, always: true },
  { action: "copy", label: "Nusxalash", icon: CopyIcon, always: true },
  { action: "bookmark", label: "Saqlash", icon: BookmarkIcon, always: true },
];

export default function MessageContextMenu({
  position,
  message,
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

  const visibleItems = filter(
    menuItems,
    (item) => item.always || (item.meOnly && isMe)
  );

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-[180px] animate-in fade-in zoom-in-95",
        "rounded-xl border bg-popover p-1.5 shadow-lg"
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-label="Xabar amallar menyusi"
    >
      {map(visibleItems, (item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.action}
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              "hover:bg-muted focus-visible:bg-muted outline-none",
              item.destructive && "text-destructive hover:bg-destructive/10"
            )}
            onClick={() => {
              onAction(item.action);
              onClose();
            }}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
