import React from "react";
import { compact, join, map, take } from "lodash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const resolveInitials = (name) => {
  const parts = take(compact(String(name ?? "").trim().split(/\s+/)), 2);
  if (!parts.length) return "U";
  return join(map(parts, (part) => part[0]?.toUpperCase() ?? ""), "");
};

export default function PersonRow({ person, description, right, className }) {
  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-background p-3 transition-colors hover:bg-muted/40 sm:items-center",
        className,
      )}
    >
      <Avatar className="size-11">
        <AvatarImage src={person?.avatarUrl || undefined} alt={person?.name} />
        <AvatarFallback>{resolveInitials(person?.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {person?.name || "Foydalanuvchi"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {description ||
            (person?.username
              ? `@${person.username}`
              : person?.email || person?.phone || "Profil ma'lumoti yo'q")}
        </p>
      </div>
      <div className="relative z-10 shrink-0 self-center pointer-events-auto">
        {right}
      </div>
    </div>
  );
}
