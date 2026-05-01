import React from "react";
import { get } from "lodash";
import { toast } from "sonner";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import {
  BotIcon,
  MegaphoneIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { getApiResponseData } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";

const ADMIN_PLATFORM_BOT_QUERY_KEY = ["admin", "platform-bot"];
const ADMIN_PLATFORM_BOT_USERS_QUERY_KEY = ["admin", "platform-bot", "users"];
const DEFAULT_PAGE_SIZE = 25;

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatTelegramUnixDate = (value) => {
  if (!value) {
    return "-";
  }

  return formatDateTime(Number(value) * 1000);
};

const resolveUserName = (chat) => {
  const user = chat.user;
  const firstName =
    user?.profile?.firstName || user?.onboarding?.firstName || chat.firstName;
  const lastName =
    user?.profile?.lastName || user?.onboarding?.lastName || chat.lastName;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || chat.username || chat.telegramId;
};

const StatCard = ({ label, value, description }) => (
  <Card>
    <CardHeader>
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-2xl font-bold">{value ?? 0}</CardTitle>
    </CardHeader>
    {description ? (
      <CardContent className="text-sm text-muted-foreground">
        {description}
      </CardContent>
    ) : null}
  </Card>
);

const PlatformBotPage = () => {
  const { canManageGrowth } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [mutedFilter, setMutedFilter] = useQueryState(
    "muted",
    parseAsString.withDefault("all"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault(String(DEFAULT_PAGE_SIZE)),
  );
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);
  const [broadcastText, setBroadcastText] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);
  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = Math.max(1, Number(pageSizeQuery) || DEFAULT_PAGE_SIZE);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/platform-bot", title: "Platform Bot" },
    ]);
  }, [setBreadcrumbs]);

  const statusQuery = useGetQuery({
    url: "/admin/platform-bot",
    queryProps: {
      queryKey: ADMIN_PLATFORM_BOT_QUERY_KEY,
    },
  });

  const usersParams = React.useMemo(
    () => ({
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...(mutedFilter === "muted"
        ? { muted: true }
        : mutedFilter === "active"
          ? { muted: false }
          : {}),
    }),
    [currentPage, deferredSearch, mutedFilter, pageSize],
  );

  const usersQuery = useGetQuery({
    url: "/admin/platform-bot/users",
    params: usersParams,
    queryProps: {
      queryKey: [...ADMIN_PLATFORM_BOT_USERS_QUERY_KEY, usersParams],
    },
  });

  const webhookMutation = usePostQuery({
    queryKey: ADMIN_PLATFORM_BOT_QUERY_KEY,
    listKey: ADMIN_PLATFORM_BOT_USERS_QUERY_KEY,
  });

  const broadcastMutation = usePostQuery({
    queryKey: ADMIN_PLATFORM_BOT_QUERY_KEY,
    listKey: ADMIN_PLATFORM_BOT_USERS_QUERY_KEY,
  });

  const statusPayload = React.useMemo(
    () => getApiResponseData(statusQuery.data, {}),
    [statusQuery.data],
  );
  const usersPayload = React.useMemo(
    () => getApiResponseData(usersQuery.data, {}),
    [usersQuery.data],
  );
  const webhookInfo = get(statusPayload, "webhookInfo", null);
  const stats = get(statusPayload, "stats", {});
  const users = Array.isArray(usersPayload) ? usersPayload : [];
  const totalUsers = get(usersQuery.data, "data.meta.total", 0);
  const totalPages = get(usersQuery.data, "data.meta.totalPages", 1);

  const handleRegisterWebhook = async () => {
    if (!canManageGrowth) return;

    try {
      await webhookMutation.mutateAsync({
        url: "/admin/platform-bot/webhook",
      });
      toast.success("Webhook qayta ro'yxatdan o'tkazildi.");
    } catch {
      toast.error("Webhookni qayta ro'yxatdan o'tkazib bo'lmadi.");
    }
  };

  const handleBroadcast = async () => {
    if (!canManageGrowth) return;

    if (!broadcastText.trim()) {
      toast.error("Xabar matnini kiriting.");
      return;
    }

    try {
      const response = await broadcastMutation.mutateAsync({
        url: "/admin/platform-bot/broadcast",
        attributes: { text: broadcastText.trim() },
      });
      const result = getApiResponseData(response, {});
      toast.success(
        `Broadcast yakunlandi: ${result.sent ?? 0} yuborildi, ${
          result.failed ?? 0
        } xato.`,
      );
      setBroadcastText("");
      setBroadcastOpen(false);
    } catch {
      toast.error("Broadcast yuborilmadi.");
    }
  };

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => {
          const chat = row.original;

          return (
            <div className="flex min-w-[220px] flex-col gap-1">
              <span className="font-medium">{resolveUserName(chat)}</span>
              <span className="text-xs text-muted-foreground">
                {chat.user?.email || chat.user?.phone || "-"}
              </span>
            </div>
          );
        },
        size: 240,
        meta: { skeleton: adminListSkeletons.avatarText },
      },
      {
        accessorKey: "telegramId",
        header: "Telegram",
        cell: ({ row }) => {
          const chat = row.original;

          return (
            <div className="flex min-w-[160px] flex-col gap-1">
              <span>{chat.telegramId}</span>
              <span className="text-xs text-muted-foreground">
                {chat.username ? `@${chat.username}` : "-"}
              </span>
            </div>
          );
        },
        size: 180,
        meta: { skeleton: adminListSkeletons.text },
      },
      {
        accessorKey: "languageCode",
        header: "Til",
        cell: (info) => info.getValue() || "-",
        size: 90,
        meta: { skeleton: adminListSkeletons.text },
      },
      {
        accessorKey: "status",
        header: "Holat",
        cell: ({ row }) => {
          const chat = row.original;

          return (
            <div className="flex min-w-[160px] flex-wrap gap-2">
              <Badge variant={chat.userId ? "default" : "secondary"}>
                {chat.userId ? "Linked" : "Unlinked"}
              </Badge>
              {chat.isMuted ? <Badge variant="outline">Muted</Badge> : null}
            </div>
          );
        },
        size: 180,
        meta: { skeleton: adminListSkeletons.badge },
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: (info) => info.getValue() || "-",
        size: 150,
        meta: { skeleton: adminListSkeletons.text },
      },
      {
        accessorKey: "lastActiveAt",
        header: "Oxirgi aktivlik",
        cell: (info) => formatDateTime(info.getValue()),
        size: 180,
        meta: { skeleton: adminListSkeletons.text },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    rowCount: totalUsers,
    state: {
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: currentPage - 1, pageSize })
          : updater;
      const nextPageSize = Number(get(next, "pageSize")) || pageSize;

      React.startTransition(() => {
        void setPageQuery(
          String(nextPageSize === pageSize ? Number(get(next, "pageIndex", 0)) + 1 : 1),
        );
        void setPageSizeQuery(String(nextPageSize));
      });
    },
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <BotIcon className="text-primary" />
              Platform Bot
            </h1>
            <p className="text-sm text-muted-foreground">
              Webhook holati, Telegram chatlar va broadcast boshqaruvi.
            </p>
          </div>

          {canManageGrowth ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRegisterWebhook}
                disabled={webhookMutation.isPending}
              >
                <RefreshCwIcon data-icon="inline-start" />
                Webhookni yangilash
              </Button>
              <Sheet open={broadcastOpen} onOpenChange={setBroadcastOpen}>
                <SheetTrigger asChild>
                  <Button type="button">
                    <MegaphoneIcon data-icon="inline-start" />
                    Broadcast
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Broadcast xabar yuborish</SheetTitle>
                    <SheetDescription>
                      Xabar muted bo'lmagan barcha platform bot chatlariga
                      yuboriladi.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 px-6">
                    <Textarea
                      value={broadcastText}
                      onChange={(event) => setBroadcastText(event.target.value)}
                      placeholder="Xabar matni"
                      rows={8}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {broadcastText.length}/1000 belgi
                    </p>
                  </div>
                  <SheetFooter>
                    <Button
                      type="button"
                      onClick={handleBroadcast}
                      disabled={broadcastMutation.isPending || !canManageGrowth}
                    >
                      <SendIcon data-icon="inline-start" />
                      Yuborish
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Jami chatlar" value={stats.totalChats} />
          <StatCard label="Linked userlar" value={stats.linkedChats} />
          <StatCard label="Faol 7 kun" value={stats.activeChats7d} />
          <StatCard label="Muted chatlar" value={stats.mutedChats} />
          <StatCard label="Bugungi reminderlar" value={stats.remindersToday} />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Webhook diagnostika</CardTitle>
              <CardDescription>
                Telegram update yuborayotgan URL va oxirgi xato holati.
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant={webhookInfo?.url ? "default" : "destructive"}>
                {webhookInfo?.url ? "Configured" : "Not initialized"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Webhook URL
                </span>
                <span className="break-all text-sm">
                  {webhookInfo?.url || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Pending updates
                </span>
                <span className="text-sm">
                  {webhookInfo?.pending_update_count ?? 0}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Last error date
                </span>
                <span className="text-sm">
                  {formatTelegramUnixDate(webhookInfo?.last_error_date)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Last error message
                </span>
                <span className="text-sm">
                  {webhookInfo?.last_error_message || "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Telegram chatlar</CardTitle>
              <CardDescription>
                Botga kirgan foydalanuvchilar va ularning ulanish holati.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <Input
                value={search}
                onChange={(event) => {
                  void setSearch(event.target.value);
                  void setPageQuery("1");
                }}
                placeholder="Telegram ID, username, ism yoki telefon bo'yicha qidirish"
              />
              <Select
                value={mutedFilter}
                onValueChange={(value) => {
                  void setMutedFilter(value);
                  void setPageQuery("1");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha chatlar</SelectItem>
                  <SelectItem value="active">Muted emas</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => usersQuery.refetch()}
                disabled={usersQuery.isFetching}
              >
                <RefreshCwIcon
                  className={cn("size-4", usersQuery.isFetching && "animate-spin")}
                />
              </Button>
            </div>

            <DataGrid
              table={table}
              isLoading={usersQuery.isLoading || usersQuery.isFetching}
              recordCount={totalUsers}
            >
              <DataGridContainer>
                <ScrollArea className="w-full">
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </DataGridContainer>
              <DataGridPagination
                info="{from} - {to} / {count} ta chat"
                sizes={[10, 25, 50, 100]}
              />
            </DataGrid>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default PlatformBotPage;
