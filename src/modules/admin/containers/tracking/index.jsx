import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import {
  ActivityIcon,
  BarChart3Icon,
  DropletsIcon,
  RefreshCwIcon,
  SearchIcon,
  UtensilsIcon,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetQuery } from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";

const TRACKING_QUERY_KEY = ["admin", "tracking"];

const formatNumber = (value) =>
  new Intl.NumberFormat("uz-UZ").format(toNumber(value ?? 0));

const Metric = ({ icon: Icon, label, value, hint }) => (
  <Card size="sm">
    <CardContent className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon />
      </div>
    </CardContent>
  </Card>
);

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [period, setPeriod] = React.useState("30");
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/tracking", title: "Tracking Overview" },
    ]);
  }, [setBreadcrumbs]);

  const overviewQuery = useGetQuery({
    url: "/admin/tracking/overview",
    params: { period },
    queryProps: { queryKey: [...TRACKING_QUERY_KEY, "overview", period] },
  });
  const usersQuery = useGetQuery({
    url: "/admin/tracking/users",
    params: {
      period,
      q: search || undefined,
      status,
      page: 1,
      pageSize: 25,
      sortBy: "lastLogAt",
      sortDir: "desc",
    },
    queryProps: {
      queryKey: [...TRACKING_QUERY_KEY, "users", period, search, status],
    },
  });

  const overview = get(overviewQuery.data, "data.data", {});
  const stats = get(overview, "stats", {});
  const trends = get(overview, "trends", []);
  const users = get(usersQuery.data, "data.data", []);
  const meta = get(usersQuery.data, "data.meta", {});
  const isLoading = overviewQuery.isLoading;

  const refresh = () => {
    overviewQuery.refetch();
    usersQuery.refetch();
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <BarChart3Icon className="text-primary" />
              Tracking Overview
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Daily logs, water, meals, workouts, measurements va missing log
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

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border bg-background">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="flex flex-col gap-5">
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric
                  icon={ActivityIcon}
                  label="Daily logs"
                  value={formatNumber(stats.dailyLogs)}
                  hint={`${stats.completionRate ?? 0}% completion`}
                />
                <Metric
                  icon={DropletsIcon}
                  label="Water"
                  value={`${formatNumber(stats.waterMl)} ml`}
                  hint={`Avg ${formatNumber(stats.avgWaterMl)} ml`}
                />
                <Metric
                  icon={UtensilsIcon}
                  label="Meals"
                  value={formatNumber(stats.mealItems)}
                  hint={`Avg ${formatNumber(stats.avgCalories)} kkal`}
                />
                <Metric
                  icon={BarChart3Icon}
                  label="Missing log days"
                  value={formatNumber(stats.missingLogDays)}
                  hint={`${formatNumber(stats.trackedUsers)} tracked users`}
                />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Range summary</CardTitle>
                  <CardDescription>
                    {get(overview, "range.startDate")} -{" "}
                    {get(overview, "range.endDate")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <Metric
                    icon={ActivityIcon}
                    label="Avg steps"
                    value={formatNumber(stats.avgSteps)}
                    hint={`${formatNumber(stats.workoutMinutes)} workout min`}
                  />
                  <Metric
                    icon={BarChart3Icon}
                    label="Measurements"
                    value={formatNumber(stats.measurements)}
                    hint={`${formatNumber(stats.avgSleepHours)} avg sleep`}
                  />
                  <Metric
                    icon={UtensilsIcon}
                    label="Workout items"
                    value={formatNumber(stats.workoutItems)}
                    hint={`${formatNumber(stats.burnedCalories)} burned kkal`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle>User tracking</CardTitle>
                      <CardDescription>
                        {formatNumber(meta.total)} user, {period} kunlik
                        tracking holati.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          className="w-72 pl-9"
                          placeholder="Ism, email yoki telefon"
                        />
                      </div>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="tracked">Tracked</SelectItem>
                            <SelectItem value="missing">Missing</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Log days</TableHead>
                        <TableHead>Last log</TableHead>
                        <TableHead>Water</TableHead>
                        <TableHead>Meals</TableHead>
                        <TableHead>Workouts</TableHead>
                        <TableHead>Measurements</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {map(users, (item) => (
                        <TableRow key={item.user.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">
                                {item.user.displayName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.user.email || item.user.phone || item.user.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.logDays ? "secondary" : "outline"}>
                              {item.logDays}/{get(meta, "range.days", period)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.lastLogAt || "-"}</TableCell>
                          <TableCell>{formatNumber(item.waterMl)} ml</TableCell>
                          <TableCell>{formatNumber(item.mealItems)}</TableCell>
                          <TableCell>{formatNumber(item.workoutItems)}</TableCell>
                          <TableCell>{formatNumber(item.measurements)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {usersQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="text-muted-foreground" />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="grid gap-4 md:grid-cols-3">
              <Metric
                icon={ActivityIcon}
                label="Completion"
                value={`${stats.completionRate ?? 0}%`}
                hint="Expected user-day logs"
              />
              <Metric
                icon={BarChart3Icon}
                label="Missing days"
                value={formatNumber(stats.missingLogDays)}
                hint="Users without logs by day"
              />
              <Metric
                icon={DropletsIcon}
                label="Avg water"
                value={`${formatNumber(stats.avgWaterMl)} ml`}
                hint="Per logged day"
              />
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Daily trend</CardTitle>
                  <CardDescription>
                    Logs, meals, workouts and water totals by date.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Logs</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Water</TableHead>
                        <TableHead>Meals</TableHead>
                        <TableHead>Workouts</TableHead>
                        <TableHead>Calories</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {map(trends, (item) => (
                        <TableRow key={item.date}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{formatNumber(item.logs)}</TableCell>
                          <TableCell>{formatNumber(item.users)}</TableCell>
                          <TableCell>{formatNumber(item.waterMl)} ml</TableCell>
                          <TableCell>{formatNumber(item.meals)}</TableCell>
                          <TableCell>{formatNumber(item.workouts)}</TableCell>
                          <TableCell>{formatNumber(item.calories)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
