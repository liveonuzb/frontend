import React from "react";
import { get } from "lodash";
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import { useDeleteQuery, useGetQuery } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_CATEGORY_OPTIONS,
  ACHIEVEMENT_METRIC_LABELS,
  ACHIEVEMENT_METRIC_OPTIONS,
  ADMIN_ACHIEVEMENTS_QUERY_KEY,
  resolveAchievementApiErrorMessage,
} from "../api";

const STATUS_OPTIONS = [
  { value: "all", label: "Barcha holatlar" },
  { value: "active", label: "Faqat aktiv" },
  { value: "inactive", label: "Faqat noaktiv" },
];

const AchievementsListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [metric, setMetric] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const deferredSearch = React.useDeferredValue(search);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/achievements", title: "Achievements" },
    ]);
  }, [setBreadcrumbs]);

  const queryParams = React.useMemo(
    () => ({
      ...(deferredSearch.trim() ? { query: deferredSearch.trim() } : {}),
      ...(category !== "all" ? { category } : {}),
      ...(metric !== "all" ? { metric } : {}),
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),
    }),
    [category, deferredSearch, metric, status],
  );

  const { data, isLoading } = useGetQuery({
    url: "/admin/achievements",
    params: queryParams,
    queryProps: {
      queryKey: [...ADMIN_ACHIEVEMENTS_QUERY_KEY, queryParams],
    },
  });

  const deleteMutation = useDeleteQuery({
    queryKey: ADMIN_ACHIEVEMENTS_QUERY_KEY,
  });

  const achievements = get(data, "data.items", []);
  const total = get(data, "data.meta.total", achievements.length);

  const handleDelete = React.useCallback(
    async (achievement) => {
      if (
        !window.confirm(
          `"${achievement.name}" achievementini o'chirishni tasdiqlaysizmi?`,
        )
      ) {
        return;
      }

      try {
        await deleteMutation.mutateAsync({
          url: `/admin/achievements/${achievement.id}`,
        });
        toast.success("Achievement o'chirildi.");
      } catch (error) {
        toast.error(
          resolveAchievementApiErrorMessage(
            error,
            "Achievementni o'chirib bo'lmadi.",
          ),
        );
      }
    },
    [deleteMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-sm text-muted-foreground">
            {total} ta achievement mavjud.
          </p>
        </div>
        <Button onClick={() => navigate("create")} className="gap-2">
          <PlusIcon className="size-4" />
          Achievement qo&apos;shish
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Achievement qidirish"
          />

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategoriya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha kategoriyalar</SelectItem>
              {ACHIEVEMENT_CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger>
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha metriclar</SelectItem>
              {ACHIEVEMENT_METRIC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Achievement</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Foydalanish</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Yuklanmoqda...
                  </TableCell>
                </TableRow>
              ) : achievements.length ? (
                achievements.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl border bg-muted/20 text-xl">
                          {achievement.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {achievement.key}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ACHIEVEMENT_CATEGORY_LABELS[achievement.category] ??
                        achievement.category}
                    </TableCell>
                    <TableCell>
                      {ACHIEVEMENT_METRIC_LABELS[achievement.metric] ??
                        achievement.metric}
                    </TableCell>
                    <TableCell>{achievement.threshold}</TableCell>
                    <TableCell>+{achievement.xpReward}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{achievement.userAchievementCount} ta progress</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.unlockedUsersCount} ta unlock
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={achievement.isActive ? "default" : "secondary"}
                      >
                        {achievement.isActive ? "Aktiv" : "Noaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`edit/${achievement.id}`)}
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(achievement)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    Achievementlar topilmadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Outlet />
    </div>
  );
};

export default AchievementsListPage;
