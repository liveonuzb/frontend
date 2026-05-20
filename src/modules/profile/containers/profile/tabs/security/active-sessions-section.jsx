import React, { useState } from "react";
import { format } from "date-fns";
import { LogOutIcon, MonitorIcon, SmartphoneIcon } from "lucide-react";
import { includes, map, toLower } from "lodash";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";

const parseDevice = (ua, t) => {
  if (!ua) {
    return {
      label: t("profile.security.session.device.unknown"),
      Icon: MonitorIcon,
    };
  }

  const lower = toLower(ua);

  if (
    includes(lower, "android") ||
    includes(lower, "iphone") ||
    includes(lower, "ipad") ||
    includes(lower, "mobile")
  ) {
    return {
      label: t("profile.security.session.device.mobile"),
      Icon: SmartphoneIcon,
    };
  }

  return {
    label: t("profile.security.session.device.desktop"),
    Icon: MonitorIcon,
  };
};

const formatLastSeen = (date) => {
  if (!date) return "";

  try {
    return format(new Date(date), "dd.MM.yyyy HH:mm");
  } catch {
    return "";
  }
};

export const ActiveSessionsSection = ({ handleLogout, isLoggingOut, t }) => {
  const { request } = useApi();
  const [revokingId, setRevokingId] = useState(null);

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useGetQuery({
    url: "/users/me/sessions",
    queryProps: { queryKey: ["me", "sessions"] },
  });

  const sessionsPayload = sessionsData?.data ?? {};
  const sessions = Array.isArray(sessionsPayload)
    ? sessionsPayload
    : sessionsPayload.sessions ?? [];
  const currentSessionId = Array.isArray(sessionsPayload)
    ? sessions.find((session) => session.isCurrent)?.id
    : sessionsPayload.currentSessionId;

  const handleRevoke = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      await request.delete(`/users/me/sessions/${sessionId}`);
      await refetchSessions();
      toast.success(t("profile.security.session.revokeSuccess"));
    } catch {
      toast.error(t("profile.security.session.revokeError"));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card className="py-6 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {t("profile.security.session.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-6">
        {sessionsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
            {t("profile.security.session.empty")}
          </div>
        ) : (
          <div className="space-y-2">
            {map(sessions, (session) => {
              const { label, Icon } = parseDevice(session.userAgent, t);
              const isCurrent =
                Boolean(session.isCurrent) || session.id === currentSessionId;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold">{label}</p>
                        {isCurrent ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 py-0 text-[10px] text-emerald-600"
                          >
                            {t("profile.security.session.currentDevice")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress ?? "-"} ·{" "}
                        {formatLastSeen(session.lastSeenAt)}
                      </p>
                    </div>
                  </div>
                  {!isCurrent ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={revokingId === session.id}
                      onClick={() => handleRevoke(session.id)}
                    >
                      {revokingId === session.id
                        ? t("profile.security.session.revoking")
                        : t("profile.security.session.revoke")}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          <LogOutIcon className="size-4" />
          {isLoggingOut
            ? t("profile.security.session.loading")
            : t("profile.security.session.button")}
        </Button>
      </CardContent>
    </Card>
  );
};
