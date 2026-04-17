import React from "react";
import { ActivityIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import { get } from "lodash";

const getRelativeTimeLabel = (isoString) => {
  if (!isoString) return "Hozir";

  const deltaMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoString).getTime()) / 60000),
  );

  if (deltaMinutes < 1) return "Hozir";
  if (deltaMinutes < 60) return `${deltaMinutes} daqiqa oldin`;

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours} soat oldin`;

  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays} kun oldin`;
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { data: dashboardData, isLoading } = useGetQuery({
    url: "/admin/dashboard",
    queryProps: {
      queryKey: ["admin", "dashboard"],
    },
  });
  const dashboard = get(dashboardData, "data.data", {
    recentActivities: [],
  });
  const recentActivities = dashboard.recentActivities ?? [];

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/activity-feed", title: "So'nggi faoliyat" },
    ]);
  }, [setBreadcrumbs]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ActivityIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">So'nggi faoliyat</h1>
            <p className="text-muted-foreground">
              Yangi foydalanuvchilar va coach jarayonidagi oxirgi o'zgarishlar.
            </p>
          </div>
        </div>

        <Card className="py-6">
          <CardHeader className="px-6 pb-4 pt-0">
            <CardTitle>Faoliyat oqimi</CardTitle>
            <CardDescription>
              {isLoading
                ? "Ma'lumotlar yuklanmoqda..."
                : `${recentActivities.length} ta so'nggi hodisa`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 px-6 pb-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Faoliyatlar yuklanmoqda...
              </p>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {(activity.user ?? "?")
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0] ?? "")
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm leading-5">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">
                        {activity.action}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRelativeTimeLabel(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Faoliyat hozircha topilmadi.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Index;
