import React from "react";
import compact from "lodash/compact";
import join from "lodash/join";
import map from "lodash/map";
import take from "lodash/take";
import split from "lodash/split";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { userInteractiveCardClassName } from "@/modules/user/lib/card-styles";

const resolveInitials = (name) => {
  const parts = take(compact(split(trim(String(name ?? "")), /\s+/)), 2);
  if (!parts.length) return "U";
  return join(
    map(parts, (part) => toUpper(part[0]) ?? ""),
    "",
  );
};

export default function PersonRow({ person, description, right, className }) {
  return (
    <div
      className={cn(
        userInteractiveCardClassName,
        "relative flex w-full items-start gap-3 p-3 sm:items-center",
        className,
      )}
    >
      <Avatar className="size-11 ring-1 ring-border/60">
        <AvatarImage src={person?.avatarUrl || undefined} alt={person?.name} />
        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
          {resolveInitials(person?.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
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
