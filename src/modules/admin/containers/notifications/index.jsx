import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import toPairs from "lodash/toPairs";
import { useQueryClient } from "@tanstack/react-query";
import {
  BellRingIcon,
  ClockIcon,
  RefreshCwIcon,
  SaveIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner.jsx";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const NOTIFICATIONS_QUERY_KEY = ["admin", "notifications"];

const TEMPLATE_LABELS = {
  waterReminder: "Water reminder",
  mealReminder: "Meal reminder",
  workoutReminder: "Workout reminder",
  progressReminder: "Progress reminder",
};

const formatNumber = (value) =>
  new Intl.NumberFormat("uz-UZ").format(toNumber(value ?? 0));

const Metric = ({ label, value, hint }) => (
  <Card size="sm" className="py-6">
    <CardContent>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </CardContent>
  </Card>
);

const Index = () => {
  const { canManageSettings, canManageSupport } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();
  const [period, setPeriod] = React.useState("30");
  const [userId, setUserId] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [templatesDraft, setTemplatesDraft] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/notifications", title: "Notification Management" },
    ]);
  }, [setBreadcrumbs]);

  const overviewQuery = useGetQuery({
    url: "/admin/notifications/overview",
    params: { period },
    queryProps: {
      queryKey: [...NOTIFICATIONS_QUERY_KEY, "overview", period],
    },
  });
  const templatesQuery = useGetQuery({
    url: "/admin/notifications/templates",
    queryProps: { queryKey: [...NOTIFICATIONS_QUERY_KEY, "templates"] },
  });
  const preferencesQuery = useGetQuery({
    url: `/admin/notifications/users/${selectedUserId}/preferences`,
    queryProps: {
      queryKey: [...NOTIFICATIONS_QUERY_KEY, "user", selectedUserId],
      enabled: Boolean(selectedUserId),
    },
  });

  const mutation = usePatchQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: NOTIFICATIONS_QUERY_KEY,
        });
      },
    },
  });

  const overview = get(overviewQuery.data, "data.data", {});
  const stats = get(overview, "stats", {});
  const templates =
    templatesDraft ??
    get(templatesQuery.data, "data.data.notificationTemplates", {});
  const preferencesPayload = get(preferencesQuery.data, "data.data", {});
  const preferences = get(preferencesPayload, "preferences", []);
  const quietHours = get(preferencesPayload, "quietHours", {
    enabled: false,
    start: "22:00",
    end: "08:00",
  });

  const refresh = () => {
    overviewQuery.refetch();
    templatesQuery.refetch();
    if (selectedUserId) preferencesQuery.refetch();
  };

  const saveTemplates = async () => {
    if (!canManageSettings) return;
    try {
      await mutation.mutateAsync({
        url: "/admin/notifications/templates",
        attributes: { notificationTemplates: templates },
      });
      setTemplatesDraft(null);
      toast.success("Notification template'lar saqlandi");
    } catch {
      toast.error("Notification template'larni saqlab bo'lmadi");
    }
  };

  const updatePreference = async (preference, key, value) => {
    if (!canManageSupport || !selectedUserId) return;
    try {
      await mutation.mutateAsync({
        url: `/admin/notifications/users/${selectedUserId}/preferences`,
        attributes: {
          preferences: [{ ...preference, [key]: value }],
        },
      });
      toast.success("Notification preference yangilandi");
    } catch {
      toast.error("Preference yangilanmadi");
    }
  };

  const updateQuietHours = async (patch) => {
    if (!canManageSupport || !selectedUserId) return;
    try {
      await mutation.mutateAsync({
        url: `/admin/notifications/users/${selectedUserId}/quiet-hours`,
        attributes: { ...quietHours, ...patch },
      });
      toast.success("Quiet hours yangilandi");
    } catch {
      toast.error("Quiet hours yangilanmadi");
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <BellRingIcon className="text-primary" />
              Notification & Reminder Management
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Templates, user preferences, quiet hours va reminder health
              monitoringi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="7">7 kun</SelectItem>
                  <SelectItem value="30">30 kun</SelectItem>
                  <SelectItem value="90">90 kun</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={refresh}>
              <RefreshCwIcon data-icon="inline-start" />
              Yangilash
            </Button>
          </div>
        </div>

        {overviewQuery.isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-background">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="templates" className="flex flex-col gap-5">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="preferences">User Preferences</TabsTrigger>
              <TabsTrigger value="health">Reminder Health</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="grid gap-5 xl:grid-cols-3">
              <div className="grid gap-4 xl:col-span-3 md:grid-cols-2 xl:grid-cols-4">
                <Metric
                  label="Notifications"
                  value={formatNumber(stats.totalNotifications)}
                  hint={`${formatNumber(stats.unreadNotifications)} unread`}
                />
                <Metric
                  label="High severity"
                  value={formatNumber(stats.highSeverityNotifications)}
                  hint={`${period} kun ichida`}
                />
                <Metric
                  label="Preferences"
                  value={formatNumber(stats.preferenceCount)}
                  hint="Configured rows"
                />
                <Metric
                  label="Overdue reminders"
                  value={formatNumber(stats.overdueReminders)}
                  hint="Open or snoozed"
                />
              </div>
              <Card className="py-6 xl:col-span-3">
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>Notification templates</CardTitle>
                      <CardDescription>
                        System settings ichidagi reminder template matnlari.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      disabled={mutation.isPending || !canManageSettings}
                      onClick={saveTemplates}
                    >
                      <SaveIcon data-icon="inline-start" />
                      Saqlash
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {map(toPairs(TEMPLATE_LABELS), ([key, label]) => (
                    <div key={key} className="flex flex-col gap-2">
                      <Label>{label}</Label>
                      <Textarea
                        value={templates?.[key] ?? ""}
                        disabled={!canManageSettings}
                        className="min-h-28"
                        onChange={(event) =>
                          setTemplatesDraft((current) => ({
                            ...(current ?? templates),
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="flex flex-col gap-5">
              <Card className="py-6">
                <CardHeader>
                  <CardTitle>User notification preferences</CardTitle>
                  <CardDescription>
                    User ID kiriting va preference/quiet hours sozlamalarini
                    boshqaring.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <Input
                      value={userId}
                      onChange={(event) => setUserId(event.target.value)}
                      placeholder="User ID"
                      className="md:max-w-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedUserId(trim(userId))}
                      disabled={!trim(userId)}
                    >
                      <SearchIcon data-icon="inline-start" />
                      Load
                    </Button>
                  </div>

                  {selectedUserId ? (
                    preferencesQuery.isLoading ? (
                      <div className="flex justify-center py-8">
                        <Spinner className="text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1fr_auto]">
                          <div>
                            <p className="font-medium">
                              {get(preferencesPayload, "user.displayName", "User")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {get(preferencesPayload, "user.email") ||
                                get(preferencesPayload, "user.phone") ||
                                selectedUserId}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {get(preferencesPayload, "unreadCount", 0)} unread
                          </Badge>
                        </div>
                        <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                          <div className="flex items-center gap-2">
                            <ClockIcon />
                            <div>
                              <p className="font-medium">Quiet hours</p>
                              <p className="text-xs text-muted-foreground">
                                {quietHours.start} - {quietHours.end}
                              </p>
                            </div>
                          </div>
                          <Input
                            value={quietHours.start ?? ""}
                            onChange={(event) =>
                              updateQuietHours({ start: event.target.value })
                            }
                            disabled={!canManageSupport}
                          />
                          <Input
                            value={quietHours.end ?? ""}
                            onChange={(event) =>
                              updateQuietHours({ end: event.target.value })
                            }
                            disabled={!canManageSupport}
                          />
                          <Switch
                            checked={Boolean(quietHours.enabled)}
                            disabled={!canManageSupport}
                            onCheckedChange={(checked) =>
                              updateQuietHours({ enabled: checked })
                            }
                          />
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>In-app</TableHead>
                              <TableHead>Push</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Digest</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {map(preferences, (preference) => (
                              <TableRow key={preference.type}>
                                <TableCell>{preference.type}</TableCell>
                                {map([
                                  "inAppEnabled",
                                  "pushEnabled",
                                  "emailEnabled",
                                  "digestEnabled",
                                ], (key) => (
                                  <TableCell key={key}>
                                    <Switch
                                      checked={Boolean(preference[key])}
                                      disabled={!canManageSupport}
                                      onCheckedChange={(checked) =>
                                        updatePreference(
                                          preference,
                                          key,
                                          checked,
                                        )
                                      }
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="grid gap-4 lg:grid-cols-2">
              <Card className="py-6">
                <CardHeader>
                  <CardTitle>Notification categories</CardTitle>
                  <CardDescription>
                    {period} kun ichidagi notification category breakdown.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {map(get(overview, "categories", []), (item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <span>{item.category}</span>
                      <Badge variant="secondary">{formatNumber(item.count)}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="py-6">
                <CardHeader>
                  <CardTitle>Reminder delivery status</CardTitle>
                  <CardDescription>
                    Telegram reminder delivery status counts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {map(get(overview, "deliveries", []), (item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <span>{item.status}</span>
                      <Badge variant="outline">{formatNumber(item.count)}</Badge>
                    </div>
                  ))}
                  {get(overview, "deliveries", []).length === 0 ? (
                    <p className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                      Delivery loglar topilmadi.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageTransition>
  );
};

export default Index;
