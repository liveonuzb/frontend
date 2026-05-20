import React from "react";
import {
  AtSignIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  LogOutIcon,
  ShieldIcon,
  XCircleIcon,
} from "lucide-react";
import { map, take } from "lodash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuery } from "@/hooks/api";

const ACTIVITY_CONFIG = {
  login_success: {
    labelKey: "profile.security.activity.type.login_success",
    Icon: CheckCircle2Icon,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  login_failed: {
    labelKey: "profile.security.activity.type.login_failed",
    Icon: XCircleIcon,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  contact_changed: {
    labelKey: "profile.security.activity.type.contact_changed",
    Icon: AtSignIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  password_reset: {
    labelKey: "profile.security.activity.type.password_reset",
    Icon: KeyRoundIcon,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  session_revoked: {
    labelKey: "profile.security.activity.type.session_revoked",
    Icon: LogOutIcon,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
};

export const SecurityActivitySection = ({ t }) => {
  const { data, isLoading } = useGetQuery({
    url: "/users/me/security/activity",
    queryProps: { queryKey: ["me", "security-activity"] },
  });

  const items = data?.data?.items ?? [];

  return (
    <Card className="mt-6 py-6 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          {t("profile.security.activity.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-6">
        {isLoading ? (
          <div className="space-y-2">
            {map([0, 1, 2], (i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border p-4 text-center text-sm text-muted-foreground">
            {t("profile.security.activity.empty")}
          </div>
        ) : (
          map(take(items, 10), (item) => {
            const config = ACTIVITY_CONFIG[item.type] ?? {
              labelKey: null,
              Icon: ShieldIcon,
              color: "text-muted-foreground",
              bg: "bg-muted/40",
            };
            const { labelKey, Icon, color, bg } = config;
            const label = labelKey ? t(labelKey) : item.type;

            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border p-3"
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${bg}`}
                >
                  <Icon className={`size-4 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  {item.ipAddress ? (
                    <p className="text-xs text-muted-foreground">
                      {item.ipAddress}
                      {item.userAgent
                        ? ` · ${item.userAgent.slice(0, 60)}`
                        : ""}
                    </p>
                  ) : null}
                  {item.detail ? (
                    <p className="text-xs text-muted-foreground">
                      {item.detail}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString("uz-UZ")}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
