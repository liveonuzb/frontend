import React from "react";
import map from "lodash/map";
import includes from "lodash/includes";
import filter from "lodash/filter";
import some from "lodash/some";
import split from "lodash/split";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";
import { SearchIcon, UserIcon, CheckIcon } from "lucide-react";
import { useGetQuery } from "@/hooks/api";
import { getFriendItems } from "@/modules/user/lib/friends-response";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
];

const getAvatarColor = (str) => {
  const code = String(str ?? "").charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
};

const getInitials = (name) => {
  const parts = split(trim(String(name ?? "")), /\s+/);
  if (parts.length >= 2) return toUpper((parts[0][0] + parts[1][0]));
  return toUpper(String(name ?? "?").slice(0, 2));
};

/**
 * FriendsPickerDrawer
 *
 * Designed to be used with a `key` prop that increments each time the picker
 * is opened so that local state always initialises fresh from `selectedIds`.
 * This avoids using setState inside an effect.
 */
export default function FriendsPickerDrawer({
  open,
  onOpenChange,
  selectedIds = [],
  onConfirm,
}) {
  const [search, setSearch] = React.useState("");
  // Initialise from selectedIds on mount (key-based reset from parent)
  const [localSelected, setLocalSelected] = React.useState(() => selectedIds);
  const [localSelectedObjects, setLocalSelectedObjects] = React.useState(
    () => [],
  );
  const deferredSearch = React.useDeferredValue(trim(search));

  const { data, isLoading } = useGetQuery({
    url: "/users/me/friends",
    params: deferredSearch ? { q: deferredSearch } : {},
    queryProps: {
      queryKey: ["friends-picker", deferredSearch],
      enabled: open,
    },
  });

  const friends = getFriendItems(data);

  const toggle = (friend) => {
    const id = friend.id;
    setLocalSelected((prev) =>
      includes(prev, id) ? filter(prev, (x) => x !== id) : [...prev, id],
    );
    setLocalSelectedObjects((prev) => {
      const exists = some(prev, (f) => f.id === id);
      return exists ? filter(prev, (f) => f.id !== id) : [...prev, friend];
    });
  };

  const handleConfirm = () => {
    onConfirm?.(localSelectedObjects);
    onOpenChange(false);
  };

  const handleClose = (nextOpen) => {
    if (!nextOpen) setSearch("");
    onOpenChange(nextOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-base font-black uppercase tracking-widest">
            Do&apos;stlar ro&apos;yxati
          </DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-3 pb-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki telefon..."
              className="h-11 rounded-2xl pl-9"
            />
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {map(Array.from({ length: 6 }), (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                >
                  <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-8 w-24 animate-pulse rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted/50">
                <UserIcon className="size-7 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-muted-foreground">
                Do&apos;stlar topilmadi
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border/50">
              {map(friends, (friend) => {
                const selected = includes(localSelected, friend.id);
                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 py-3 first:pt-0"
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-black text-white",
                        getAvatarColor(friend.name),
                      )}
                    >
                      {getInitials(friend.name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {friend.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {friend.phone ||
                          (friend.username ? `@${friend.username}` : "")}
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggle(friend)}
                      className={cn(
                        "shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                        selected
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-foreground hover:bg-muted/70",
                      )}
                    >
                      {selected ? (
                        <span className="flex items-center gap-1.5">
                          <CheckIcon className="size-3" />
                          Tanlandi
                        </span>
                      ) : (
                        "Taklif qilish"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-400 text-base font-black text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-green-500"
            onClick={handleConfirm}
          >
            {localSelected.length > 0
              ? `Qo'shish (${localSelected.length})`
              : "Qo'shish"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
