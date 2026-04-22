import React from "react";
import { get } from "lodash";
import { toast } from "sonner";
import {
  BotIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MegaphoneIcon,
  RefreshCwIcon,
  SendIcon,
} from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

const ADMIN_PLATFORM_BOT_QUERY_KEY = ["admin", "platform-bot"];
const ADMIN_PLATFORM_BOT_USERS_QUERY_KEY = ["admin", "platform-bot", "users"];
const PAGE_SIZE = 25;

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
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = React.useState("");
  const [mutedFilter, setMutedFilter] = React.useState("all");
  const [offset, setOffset] = React.useState(0);
  const [broadcastOpen, setBroadcastOpen] = React.useState(false);
  const [broadcastText, setBroadcastText] = React.useState("");
  const deferredSearch = React.useDeferredValue(search);

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
      limit: PAGE_SIZE,
      offset,
      ...(deferredSearch.trim() ? { q: deferredSearch.trim() } : {}),
      ...(mutedFilter === "muted"
        ? { muted: true }
        : mutedFilter === "active"
          ? { muted: false }
          : {}),
    }),
    [deferredSearch, mutedFilter, offset],
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

  const webhookInfo = get(statusQuery.data, "data.webhookInfo", null);
  const stats = get(statusQuery.data, "data.stats", {});
  const users = get(usersQuery.data, "data.items", []);
  const totalUsers = get(usersQuery.data, "data.total", 0);
  const hasPreviousPage = offset > 0;
  const hasNextPage = offset + PAGE_SIZE < totalUsers;

  const handleRegisterWebhook = async () => {
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
    if (!broadcastText.trim()) {
      toast.error("Xabar matnini kiriting.");
      return;
    }

    try {
      const response = await broadcastMutation.mutateAsync({
        url: "/admin/platform-bot/broadcast",
        attributes: { text: broadcastText.trim() },
      });
      const result = get(response, "data", {});
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
                    disabled={broadcastMutation.isPending}
                  >
                    <SendIcon data-icon="inline-start" />
                    Yuborish
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
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
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOffset(0);
                }}
                placeholder="Telegram ID, username, ism yoki telefon bo'yicha qidirish"
              />
              <Select
                value={mutedFilter}
                onValueChange={(value) => {
                  setMutedFilter(value);
                  setOffset(0);
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
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Til</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Oxirgi aktivlik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Yuklanmoqda...
                      </TableCell>
                    </TableRow>
                  ) : users.length ? (
                    users.map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {resolveUserName(chat)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {chat.user?.email || chat.user?.phone || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{chat.telegramId}</span>
                            <span className="text-xs text-muted-foreground">
                              {chat.username ? `@${chat.username}` : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{chat.languageCode || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={chat.userId ? "default" : "secondary"}
                            >
                              {chat.userId ? "Linked" : "Unlinked"}
                            </Badge>
                            {chat.isMuted ? (
                              <Badge variant="outline">Muted</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{chat.phone || "-"}</TableCell>
                        <TableCell>{formatDateTime(chat.lastActiveAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Telegram chatlar topilmadi.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalUsers ? offset + 1 : 0}-
                {Math.min(offset + PAGE_SIZE, totalUsers)} / {totalUsers}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}
                  disabled={!hasPreviousPage}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={!hasNextPage}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default PlatformBotPage;

