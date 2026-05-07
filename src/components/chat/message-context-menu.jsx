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
  NotebookPenIcon,
  ListTodoIcon,
  ClipboardCheckIcon,
  ReceiptTextIcon,
  BanknoteIcon,
  UtensilsIcon,
  DumbbellIcon,
  CalendarPlusIcon,
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

const coachShortcutItems = [
  { action: "coach:note", label: "Note yaratish", icon: NotebookPenIcon },
  { action: "coach:task", label: "Task yaratish", icon: ListTodoIcon },
  { action: "coach:check_in", label: "Check-in request", icon: ClipboardCheckIcon },
  { action: "coach:invoice", label: "Invoice yaratish", icon: ReceiptTextIcon },
  { action: "coach:payment_reminder", label: "Payment reminder", icon: BanknoteIcon },
  { action: "coach:meal_feedback", label: "Meal feedback", icon: UtensilsIcon },
  { action: "coach:workout_feedback", label: "Workout feedback", icon: DumbbellIcon },
  { action: "coach:session_booking", label: "Session booking", icon: CalendarPlusIcon },
];

export default function MessageContextMenu({
  position,
  isMe,
  canUseCoachActions = false,
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
  const visibleCoachItems = canUseCoachActions ? coachShortcutItems : [];

  const renderItem = (item) => {
    const Icon = item.icon;
    return (
      <button
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
      {visibleCoachItems.length > 0 && (
        <>
          <div className="my-1 h-px bg-border" />
          {map(visibleCoachItems, renderItem)}
        </>
      )}
    </div>
  );
}
