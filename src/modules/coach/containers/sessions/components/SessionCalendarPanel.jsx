import React from "react";
import { CalendarDaysIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SessionStatusBadge from "@/components/coach-sessions/session-status-badge.jsx";
import { formatSessionDate, groupSessionsByDate } from "./session-utils.js";

export const SessionCalendarPanel = ({ sessions = [] }) => {
  const groups = groupSessionsByDate(sessions);

  if (groups.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <CalendarDaysIcon className="mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Calendar uchun sessiya yo&apos;q</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Filterlarni o&apos;zgartiring yoki yangi session taklifi yuboring.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.date} className="rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{formatSessionDate(group.date)}</CardTitle>
            <Badge variant="secondary">{group.items.length} ta</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border bg-muted/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {session.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.selectedSlot || "Vaqt tanlanmagan"} •{" "}
                      {session.client?.name || "Client"}
                    </p>
                  </div>
                  <SessionStatusBadge status={session.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SessionCalendarPanel;
