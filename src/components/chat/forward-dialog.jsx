import React, { useState, useMemo } from "react";
import { map, filter, includes } from "lodash";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useChatStore } from "@/store";
import { SearchIcon, Share2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForwardDialog({ open, onClose, onForward, message }) {
  const [search, setSearch] = useState("");
  const contacts = useChatStore((s) => s.contacts);
  const groups = useChatStore((s) => s.groups);

  // Combine contacts and groups into a single list
  const allChats = useMemo(() => {
    const contactList = map(contacts, (c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      subtitle: c.role,
      isGroup: false,
    }));
    const groupList = map(groups, (g) => ({
      id: g.id,
      name: g.name,
      avatar: g.avatar,
      subtitle: `${g.members.length} a'zo`,
      isGroup: true,
    }));
    return [...contactList, ...groupList];
  }, [contacts, groups]);

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!search.trim()) return allChats;
    const query = search.toLowerCase();
    return filter(allChats, (chat) => includes(chat.name.toLowerCase(), query));
  }, [allChats, search]);

  const handleForward = (chatId) => {
    onForward(chatId);
    onClose();
    setSearch("");
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      onClose();
      setSearch("");
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent side="right" className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Share2Icon className="size-5 text-primary" />
            Xabarni yuborish
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 pb-6">
          {/* Message preview */}
          {message && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Yo'naltiriladigan xabar:
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-foreground">
                {message.text || "(Media)"}
              </p>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className={cn(
                "bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50",
                "h-9 w-full rounded-full border pl-9 pr-3 text-sm outline-none",
                "transition-colors focus-visible:ring-[3px]",
                "placeholder:text-muted-foreground"
              )}
            />
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto -mx-1">
            {filteredChats.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                Hech narsa topilmadi
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {map(filteredChats, (chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleForward(chat.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                      "text-left transition-colors",
                      "hover:bg-muted focus-visible:bg-muted outline-none"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                      {chat.avatar}
                    </div>

                    {/* Name and subtitle */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {chat.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {chat.subtitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
