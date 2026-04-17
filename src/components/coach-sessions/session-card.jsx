import React from "react";
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  TimerIcon,
  XCircleIcon,
  CalendarPlusIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SessionStatusBadge from "./session-status-badge.jsx";
import {
  formatSessionDate,
  formatSessionSchedule,
  getInitials,
  getSessionCounterparty,
} from "./session-utils.js";

const SessionCard = ({
  session,
  role,
  isBusy = false,
  onOpenChat,
  onCancel,
  onComplete,
  onReschedule,
}) => {
  const participant = getSessionCounterparty(session, role);
  const canCancel =
    session?.status === "proposed" || session?.status === "scheduled";
  const canComplete = role === "coach" && session?.status === "scheduled";

  return (
    <div className="rounded-3xl border bg-background/95 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-12 border">
              <AvatarImage src={participant?.avatar} alt={participant?.name} />
              <AvatarFallback>
                {getInitials(participant?.name || "U")}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold">
                  {session?.title}
                </p>
                <SessionStatusBadge status={session?.status} />
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {participant?.name || (role === "coach" ? "Mijoz" : "Murabbiy")}
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-2">
              <CalendarClockIcon className="size-4 text-primary" />
              <span>{formatSessionSchedule(session)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 px-3 py-2">
              <TimerIcon className="size-4 text-primary" />
              <span>{session?.durationMinutes || 60} daqiqa</span>
            </div>
          </div>

          {session?.note ? (
            <div className="rounded-2xl border border-dashed px-3 py-2 text-sm text-muted-foreground">
              {session.note}
            </div>
          ) : null}

          {session?.status === "cancelled" && session?.cancellationReason ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              Bekor sababi: {session.cancellationReason}
            </div>
          ) : null}

          {session?.status === "completed" ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm text-green-700 dark:text-green-300">
              Sessiya {formatSessionDate(session?.date)} kuni tugallangan.
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:w-60 lg:justify-end">
          <Button type="button" variant="outline" onClick={onOpenChat}>
            <MessageSquareIcon className="mr-2 size-4" />
            Chat
          </Button>
          {canComplete ? (
            <Button type="button" onClick={onComplete} disabled={isBusy}>
              <CheckCircle2Icon className="mr-2 size-4" />
              Tugatish
            </Button>
          ) : null}
          {onReschedule && canCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onReschedule}
              disabled={isBusy}
            >
              <CalendarPlusIcon className="mr-2 size-4" />
              Ko'chirish
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isBusy}
            >
              <XCircleIcon className="mr-2 size-4" />
              Bekor qilish
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
