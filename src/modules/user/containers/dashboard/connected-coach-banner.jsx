import React from "react";
import { MessageSquareIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const ConnectedCoachBanner = ({ connectedCoach, onDismiss, onNavigateChat, onOpenDetails }) => {
  if (!connectedCoach) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5 px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="size-12 border shadow-sm">
            <AvatarImage src={connectedCoach.avatar} alt={connectedCoach.name} />
            <AvatarFallback>
              {String(connectedCoach.name || "C")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <div className="rounded-full bg-primary/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Murabbiy ulandi
              </div>
              {connectedCoach.connectedAt ? (
                <div className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                  Bog&apos;lanish:{" "}
                  {new Date(connectedCoach.connectedAt).toLocaleDateString("uz-UZ")}
                </div>
              ) : null}
            </div>

            <h2 className="truncate text-base font-bold tracking-tight sm:text-lg">
              {connectedCoach.name} bilan ishlayapsiz
            </h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              Meal plan, progress va murabbiy bilan aloqa shu yerda boshqariladi.
            </p>

            {connectedCoach.specializations?.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {connectedCoach.specializations.slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <Button size="sm" onClick={onNavigateChat}>
            <MessageSquareIcon className="mr-2 size-4" />
            Chat
          </Button>
          <Button size="sm" variant="outline" onClick={onOpenDetails}>
            Tafsilotlar
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Yopish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectedCoachBanner;
