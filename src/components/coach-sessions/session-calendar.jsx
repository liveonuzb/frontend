import React from "react";
import { filter, get, groupBy, map, size } from "lodash";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SESSION_STATUS_META,
  formatSessionSchedule,
  getSessionCounterparty,
  getInitials,
} from "./session-utils";

const WEEKDAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];

const getMonthDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startWeekday = firstDay.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

  const days = [];
  for (let i = 0; i < startWeekday; i++) {
    const prevDate = new Date(year, month, -startWeekday + i + 1);
    days.push({ date: prevDate, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
  }
  return days;
};

const getWeekDays = (anchorDate) => {
  const start = new Date(anchorDate);
  let startWeekday = start.getDay();
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
  start.setDate(start.getDate() - startWeekday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, isCurrentMonth: true };
  });
};

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const STATUS_DOT_COLORS = {
  proposed: "bg-amber-500",
  scheduled: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-400",
};

const SessionCalendar = ({
  sessions = [],
  role = "coach",
  onOpenChat,
  onCancel,
  onComplete,
  onReschedule,
  isBusy,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [viewMode, setViewMode] = React.useState("month");

  const sessionsByDate = React.useMemo(
    () => groupBy(sessions, (s) => get(s, "date", "")),
    [sessions],
  );

  const monthDays = React.useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );
  const weekAnchor = selectedDate
    ? new Date(`${selectedDate}T00:00:00`)
    : new Date(currentYear, currentMonth, today.getDate());
  const weekDays = React.useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

  const todayKey = formatDateKey(today);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayKey);
  };

  const monthLabel = new Intl.DateTimeFormat("uz-UZ", {
    month: "long",
    year: "numeric",
  }).format(new Date(currentYear, currentMonth));

  const selectedSessions = selectedDate
    ? get(sessionsByDate, selectedDate, [])
    : [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold capitalize tracking-tight">
              {monthLabel}
            </h3>
            <div className="flex rounded-full border bg-muted/20 p-0.5">
              <Button
                variant={viewMode === "month" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 rounded-full text-xs"
                onClick={() => setViewMode("month")}
              >
                Oy
              </Button>
              <Button
                variant={viewMode === "week" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 rounded-full text-xs"
                onClick={() => setViewMode("week")}
              >
                Hafta
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={goToToday}
            >
              Bugun
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7">
          {map(WEEKDAYS, (day) => (
            <div
              key={day}
              className="border-b px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {map(viewMode === "month" ? monthDays : weekDays, (dayInfo, idx) => {
            const dateKey = formatDateKey(dayInfo.date);
            const daySessions = get(sessionsByDate, dateKey, []);
            const hasSession = size(daySessions) > 0;
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;

            return (
              <button
                key={idx}
                type="button"
                className={cn(
                  "relative flex min-h-[60px] flex-col items-center border-b border-r p-1.5 transition-colors sm:min-h-[72px]",
                  dayInfo.isCurrentMonth
                    ? "bg-card hover:bg-muted/30"
                    : "bg-muted/10 text-muted-foreground/40",
                  viewMode === "week" && "min-h-[120px] justify-start",
                  isSelected &&
                    "bg-primary/5 ring-2 ring-primary/30 ring-inset",
                  isToday && !isSelected && "bg-primary/[0.03]",
                )}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {dayInfo.date.getDate()}
                </span>
                {hasSession ? (
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {map(
                      daySessions.slice(0, viewMode === "week" ? 5 : 3),
                      (s) => (
                        <div
                          key={get(s, "id")}
                          className={cn(
                            "size-1.5 rounded-full",
                            get(
                              STATUS_DOT_COLORS,
                              get(s, "status"),
                              "bg-gray-400",
                            ),
                          )}
                        />
                      ),
                    )}
                    {size(daySessions) > (viewMode === "week" ? 5 : 3) ? (
                      <span className="text-[8px] font-bold text-muted-foreground">
                        +{size(daySessions) - (viewMode === "week" ? 5 : 3)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {viewMode === "week" && hasSession ? (
                  <div className="mt-2 hidden w-full flex-col gap-1 text-left sm:flex">
                    {map(daySessions.slice(0, 2), (session) => (
                      <div
                        key={get(session, "id")}
                        className="truncate rounded-lg bg-muted/50 px-2 py-1 text-[10px]"
                      >
                        {get(session, "selectedSlot") || "Slot"} ·{" "}
                        {get(session, "title")}
                      </div>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate ? (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-muted-foreground">
            {new Intl.DateTimeFormat("uz-UZ", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            }).format(new Date(`${selectedDate}T00:00:00`))}{" "}
            — {size(selectedSessions)} ta sessiya
          </h4>
          {size(selectedSessions) === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Bu kunga sessiya rejalashtirilmagan
            </div>
          ) : (
            <div className="space-y-3">
              {map(selectedSessions, (session) => {
                const counterparty = getSessionCounterparty(session, role);
                const statusMeta = get(
                  SESSION_STATUS_META,
                  get(session, "status"),
                  {},
                );
                return (
                  <div
                    key={get(session, "id")}
                    className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/20"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={get(counterparty, "avatar")} />
                      <AvatarFallback className="text-xs font-bold">
                        {getInitials(get(counterparty, "name"))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {get(counterparty, "name", "Noma'lum")}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px]",
                            get(statusMeta, "className"),
                          )}
                        >
                          {get(statusMeta, "label", get(session, "status"))}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {get(session, "selectedSlot") ||
                          `${size(get(session, "slots", []))} ta variant`}
                        {get(session, "durationMinutes")
                          ? ` • ${get(session, "durationMinutes")} min`
                          : ""}
                      </p>
                      {get(session, "note") ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/70">
                          {get(session, "note")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {onOpenChat ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => onOpenChat(session)}
                        >
                          Chat
                        </Button>
                      ) : null}
                      {onComplete &&
                      role === "coach" &&
                      get(session, "status") === "scheduled" ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isBusy}
                          onClick={() => onComplete(session)}
                        >
                          Yakunlash
                        </Button>
                      ) : null}
                      {onReschedule &&
                      ["proposed", "scheduled"].includes(
                        get(session, "status"),
                      ) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isBusy}
                          onClick={() => onReschedule(session)}
                        >
                          Ko'chirish
                        </Button>
                      ) : null}
                      {onCancel &&
                      ["proposed", "scheduled"].includes(
                        get(session, "status"),
                      ) ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isBusy}
                          onClick={() => onCancel(session)}
                        >
                          Bekor
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SessionCalendar;
