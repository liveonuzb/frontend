import { find, get, head, toUpper, trim } from "lodash";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  BotIcon,
  CheckCircle2Icon,
  CopyIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  LinkIcon,
  MessageSquareIcon,
  PowerIcon,
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  useCoachTelegramBot,
  useCoachTelegramConnect,
  useCoachTelegramDisconnect,
  useCoachTelegramHealth,
  useCoachTelegramMessages,
  useCoachTelegramSendMessage,
  useCoachTelegramSettings,
  useCoachTelegramTemplateDelete,
  useCoachTelegramTemplatePreview,
  useCoachTelegramTemplates,
  useCoachTelegramTemplateSave,
  useCoachTelegramToggle,
  useCoachTelegramUsers,
} from "@/modules/coach/lib/hooks/useCoachTelegram";
import PageLoader from "@/components/page-loader/index.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import {
  DataGrid,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TelegramWorkbenchTab } from "./telegram-workbench.jsx";

const revealUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

// ---------------------------------------------------------------------------
// Main container
// ---------------------------------------------------------------------------

export default function TelegramBotContainer({ config, onStatusChange }) {
  const ownerType = get(config, "apiBase") || "coach";
  const apiBase = get(config, "apiBasePath") || `/${ownerType}/telegram`;
  const queryKey = [ownerType, "telegram", "bot"];
  const embedded = Boolean(get(config, "embedded"));

  const { data: botData, isLoading } = useCoachTelegramBot(apiBase, queryKey);

  const bot = get(botData, "data", null);
  const isConnected = bot && bot.botUsername;

  React.useEffect(() => {
    if (typeof onStatusChange === "function") {
      onStatusChange(bot || null);
    }
  }, [bot, onStatusChange]);

  if (isLoading) return <PageLoader />;

  return isConnected ? (
    <BotManagementPanel bot={bot} apiBase={apiBase} queryKey={queryKey} />
  ) : (
    <ConnectBotForm apiBase={apiBase} queryKey={queryKey} embedded={embedded} />
  );
}

// ---------------------------------------------------------------------------
// Connect form (shown when no bot is connected)
// ---------------------------------------------------------------------------

function ConnectBotForm({ apiBase, queryKey, embedded = false }) {
  const [token, setToken] = useState("");

  const connectMutation = useCoachTelegramConnect(queryKey);

  const handleConnect = () => {
    if (!trim(token)) return toast.error("Token kiriting");
    connectMutation.mutate({
      url: `${apiBase}/connect`,
      attributes: { botToken: trim(token) },
    });
  };

  const steps = [
    "Telegram'da @BotFather ni oching",
    "/newbot buyrug'ini yuboring",
    "Bot nomi va username'ni kiriting",
    "Olingan tokenni nusxalab, quyidagi maydonga joylashtiring",
  ];
  const features = [
    {
      icon: CheckCircle2Icon,
      title: "Webhook auto-setup",
      text: "Token tasdiqlangach webhook va asosiy commandlar avtomatik ulanadi.",
    },
    {
      icon: SettingsIcon,
      title: "Welcome flow",
      text: "Ulangan bot welcome message, guruh onboarding va mijoz oqimi bilan ishlaydi.",
    },
    {
      icon: LinkIcon,
      title: "Client access",
      text: "Bot guruh ulash, foydalanuvchi access va kundalik xabarlar uchun tayyor bo'ladi.",
    },
  ];

  return (
    <motion.div
      variants={revealUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.35 }}
      className={
        embedded
          ? "flex items-center justify-center"
          : "flex min-h-[60vh] items-center justify-center"
      }
    >
      <div className="w-full space-y-5">
        <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.74),_rgba(255,255,255,0.96))] p-5 shadow-[0_22px_60px_-40px_rgba(59,130,246,0.5)]">
          <div className="absolute -right-10 top-0 size-28 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <BotIcon className="size-3.5" />
                Connect Telegram bot
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Telegram bot ulash
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                @BotFather tokenini kiriting. Token tekshiriladi, webhook o&apos;rnatiladi va coach Telegram workspace ishga tushadi.
              </p>
            </div>
            <div className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <BotIcon className="size-7" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 backdrop-blur-sm"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-border/60 bg-background/80 shadow-lg">
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-3">
              {steps.map((step, i) => (
                <div
                  key={step}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 transition-all hover:border-primary/30 hover:bg-primary/[0.04]"
                >
                  <Badge
                    variant="outline"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full p-0 text-xs font-semibold"
                  >
                    {i + 1}
                  </Badge>
                  <span className="text-sm leading-6 text-muted-foreground">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
              <Field>
                <FieldLabel>Bot Token</FieldLabel>
                <Input
                  placeholder="123456789:ABCDefGhIJKlmNoPQRsTUVwxyz"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  className="mt-2 rounded-2xl font-mono text-sm"
                />
              </Field>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={handleConnect}
                  disabled={connectMutation.isPending || !trim(token)}
                  className="w-full gap-2 rounded-2xl sm:w-auto sm:px-5"
                >
                  {connectMutation.isPending && (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  )}
                  Ulash
                </Button>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  t.me/BotFather ni ochish
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Management panel (shown when bot is connected)
// ---------------------------------------------------------------------------

function BotAvatar({ username }) {
  const letter = username ? toUpper(head(username)) : "B";
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
      <span className="text-lg font-bold text-white">{letter}</span>
    </div>
  );
}

function BotManagementPanel({ bot, apiBase, queryKey }) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [sendDrawerUser, setSendDrawerUser] = useState(null);
  const [sendDrawerInitialMode, setSendDrawerInitialMode] =
    useState("broadcast");
  const stats = get(bot, "stats", {});
  const promo = get(bot, "promo", {});
  const promoLink = get(promo, "liveonAppBotLink", "");
  const promoMention = get(promo, "liveonAppBotMention", "@liveonappbot");
  const promoSignups = get(promo, "liveonAppBotSignups", 0);

  const handleCopyPromoLink = React.useCallback(async () => {
    if (!promoLink) {
      toast.error("Promo link hali tayyor emas");
      return;
    }

    const clipboard =
      typeof window === "undefined" ? null : window.navigator?.clipboard;

    if (!clipboard?.writeText) {
      toast.error("Clipboard mavjud emas");
      return;
    }

    try {
      await clipboard.writeText(promoLink);
      toast.success("Promo link nusxalandi");
    } catch {
      toast.error("Promo linkni nusxalab bo'lmadi");
    }
  }, [promoLink]);

  return (
    <div className="space-y-5">
      <motion.div
        variants={revealUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.82),_rgba(255,255,255,0.96))] p-5 shadow-[0_24px_60px_-40px_rgba(59,130,246,0.55)]"
      >
        <div className="absolute -right-10 top-4 size-32 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-3">
              <BotAvatar username={bot.botUsername} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">
                    @{bot.botUsername}
                  </h2>
                  <StatusBadge status={bot.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{bot.botName}</p>
                <a
                  href={`https://t.me/${bot.botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  <ExternalLinkIcon className="h-3 w-3" />
                  t.me/{bot.botUsername}
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="gap-2 rounded-2xl"
                onClick={() => {
                  setSendDrawerInitialMode("broadcast");
                  setSendDrawerOpen(true);
                }}
              >
                <SendIcon className="h-4 w-4" />
                Xabar yuborish
              </Button>
              <ToggleButton bot={bot} apiBase={apiBase} queryKey={queryKey} />
              <DisconnectButton apiBase={apiBase} queryKey={queryKey} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <QuickMeta
              label="Bot link"
              value={`t.me/${bot.botUsername}`}
              tone="primary"
            />
            <QuickMeta
              label="Bot status"
              value={bot.status}
              tone={bot.status === "ACTIVE" ? "success" : "neutral"}
            />
            <QuickMeta
              label="Last error"
              value={bot.lastError || "Xatolik kuzatilmadi"}
              tone={bot.lastError ? "danger" : "neutral"}
            />
          </div>

          <Card className="border-primary/15 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),rgba(14,165,233,0.02))] shadow-none">
            <CardContent className="flex flex-col gap-4 pt-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    <LinkIcon className="size-3.5" />
                    {promoMention} promo
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    LiveOnAppBot referral oqimi
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Coach bot va ulangan kurs guruhlaridagi reklama shu havola
                    orqali ishlaydi. Signup faqat {promoMention} ichida
                    yakunlanganda coach referralga yoziladi va yangi userga XP
                    beriladi.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                  <p className="text-xl font-semibold text-emerald-700">
                    {promoSignups}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700/80">
                    Signup via {promoMention}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/85 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Promo deep-link
                </p>
                <p className="mt-2 break-all font-mono text-sm leading-6 text-foreground">
                  {promoLink || "Promo link hali topilmadi"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => void handleCopyPromoLink()}
                  disabled={!promoLink}
                >
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Linkni nusxalash
                </Button>
                {promoLink ? (
                  <Button asChild className="rounded-2xl">
                    <a
                      href={promoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      {promoMention} ni ochish
                    </a>
                  </Button>
                ) : (
                  <Button className="rounded-2xl" disabled>
                    <ExternalLinkIcon className="mr-2 h-4 w-4" />
                    {promoMention} ni ochish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Foydalanuvchilar"
          value={get(stats, "userCount", 0)}
          icon={UsersIcon}
          bgClass="bg-blue-500/10"
          colorClass="text-blue-600"
        />
        <StatCard
          label="7 kunlik faol"
          value={get(stats, "activeUserCount", 0)}
          icon={ActivityIcon}
          bgClass="bg-cyan-500/10"
          colorClass="text-cyan-600"
        />
        <StatCard
          label="Xabarlar"
          value={get(stats, "messageCount", 0)}
          icon={MessageSquareIcon}
          bgClass="bg-purple-500/10"
          colorClass="text-purple-600"
        />
        <StatCard
          label="Guruhlar"
          value={get(stats, "groupCount", 0)}
          icon={LinkIcon}
          bgClass="bg-amber-500/10"
          colorClass="text-amber-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap rounded-2xl bg-muted/50 p-1.5">
          <TabsTrigger value="inbox" className="rounded-xl px-3 py-2">
            <MessageSquareIcon className="mr-1 h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl px-3 py-2">
            <SettingsIcon className="mr-1 h-4 w-4" />
            Sozlamalar
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-3 py-2">
            <UsersIcon className="mr-1 h-4 w-4" />
            Foydalanuvchilar
          </TabsTrigger>
          <TabsTrigger value="messages" className="rounded-xl px-3 py-2">
            <MessageSquareIcon className="mr-1 h-4 w-4" />
            Xabarlar
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl px-3 py-2">
            <FileTextIcon className="mr-1 h-4 w-4" />
            Template
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="rounded-xl px-3 py-2">
            <ActivityIcon className="mr-1 h-4 w-4" />
            Diagnostika
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <TelegramWorkbenchTab apiBase={apiBase} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab bot={bot} apiBase={apiBase} queryKey={queryKey} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab
            apiBase={apiBase}
            onSendMessage={(user) => {
              setSendDrawerUser(user);
              setSendDrawerOpen(true);
            }}
          />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab apiBase={apiBase} />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab apiBase={apiBase} />
        </TabsContent>
        <TabsContent value="diagnostics">
          <DiagnosticsTab
            apiBase={apiBase}
            enabled={activeTab === "diagnostics"}
            onOpenSend={() => {
              setSendDrawerInitialMode("individual");
              setSendDrawerOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <SendMessageDrawer
        open={sendDrawerOpen}
        onOpenChange={(v) => {
          setSendDrawerOpen(v);
          if (!v) {
            setSendDrawerUser(null);
            setSendDrawerInitialMode("broadcast");
          }
        }}
        initialUser={sendDrawerUser}
        initialMode={sendDrawerInitialMode}
        apiBase={apiBase}
      />
    </div>
  );
}

const resolveTelegramHealthPayload = (response) =>
  get(response, "data.data") || get(response, "data") || {};

const formatHealthTime = (value) => {
  if (!value) return "Yo'q";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yo'q";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function DiagnosticsTab({ apiBase, enabled, onOpenSend }) {
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useCoachTelegramHealth(apiBase, {
    queryKey: [apiBase, "health"],
    enabled,
    refetchOnWindowFocus: false,
  });
  const health = resolveTelegramHealthPayload(data);
  const webhookInfo = get(health, "webhookInfo", {});
  const hasWebhookInfo = Boolean(webhookInfo && Object.keys(webhookInfo).length);

  if (isLoading) {
    return (
      <Card className="mt-4 border-border/60 bg-background/80 shadow-sm">
        <CardContent className="flex items-center gap-2 pt-5 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Diagnostika yuklanmoqda
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Bot diagnostikasi
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Oxirgi tekshiruv: {formatHealthTime(get(health, "checkedAt"))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 size-4" />
            )}
            Yangilash
          </Button>
          <Button className="rounded-2xl" onClick={onOpenSend}>
            <SendIcon className="mr-2 size-4" />
            Test xabar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <QuickMeta
          label="Runtime"
          value={get(health, "managerRegistered") ? "Registered" : "Offline"}
          tone={get(health, "managerRegistered") ? "success" : "danger"}
        />
        <QuickMeta
          label="Telegram API"
          value={get(health, "telegramReachable") ? "Ulandi" : "Xatolik"}
          tone={get(health, "telegramReachable") ? "success" : "danger"}
        />
        <QuickMeta
          label="Webhook queue"
          value={String(get(webhookInfo, "pendingUpdateCount", 0))}
          tone={
            get(webhookInfo, "pendingUpdateCount", 0) > 0
              ? "primary"
              : "neutral"
          }
        />
        <QuickMeta
          label="Token storage"
          value={get(health, "tokenEncrypted") ? "Encrypted" : "Plaintext"}
          tone={get(health, "tokenEncrypted") ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/60 bg-background/80 shadow-sm">
          <CardHeader>
            <CardTitle>Webhook</CardTitle>
            <CardDescription>Telegram webhook holati</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DiagnosticRow
              label="Local URL"
              value={get(health, "webhookUrl") || "O'rnatilmagan"}
              tone={get(health, "webhookUrl") ? "primary" : "danger"}
            />
            <DiagnosticRow
              label="Telegram URL"
              value={get(webhookInfo, "url") || "O'qib bo'lmadi"}
              tone={get(webhookInfo, "url") ? "primary" : "danger"}
            />
            <DiagnosticRow
              label="Last webhook error"
              value={
                get(webhookInfo, "lastErrorMessage") ||
                get(health, "webhookInfoError") ||
                "Xatolik kuzatilmadi"
              }
              tone={
                get(webhookInfo, "lastErrorMessage") ||
                get(health, "webhookInfoError")
                  ? "danger"
                  : "neutral"
              }
            />
            {hasWebhookInfo && (
              <p className="text-xs text-muted-foreground">
                Allowed updates:{" "}
                {get(webhookInfo, "allowedUpdates", []).join(", ") || "default"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/80 shadow-sm">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Bot xabar va xatolik signallari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DiagnosticRow
              label="Oxirgi xabar"
              value={formatHealthTime(get(health, "lastMessageAt"))}
              tone="neutral"
            />
            <DiagnosticRow
              label="Oxirgi outgoing"
              value={formatHealthTime(get(health, "lastOutgoingMessageAt"))}
              tone="neutral"
            />
            <DiagnosticRow
              label="Service error"
              value={get(health, "lastError") || "Xatolik kuzatilmadi"}
              tone={get(health, "lastError") ? "danger" : "neutral"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DiagnosticRow({ label, value, tone = "neutral" }) {
  return (
    <div className="border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-words text-sm font-medium leading-6",
          tone === "primary" && "text-primary",
          tone === "success" && "text-emerald-700",
          tone === "danger" && "text-destructive",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function SendMessageDrawer({
  open,
  onOpenChange,
  initialUser,
  initialMode = "broadcast",
  apiBase,
}) {
  const [mode, setMode] = useState("broadcast");
  const [text, setText] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const { data: templatesData } = useCoachTelegramTemplates(apiBase, {
    queryKey: [`${apiBase}-templates-send`],
    enabled: open,
  });
  const templates = get(resolveTemplatesPayload(templatesData), "items", []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (initialUser) {
      setMode("individual");
      setSelectedUser(initialUser);
    } else {
      setMode(initialMode);
      setSelectedUser(null);
    }
    setText("");
  }, [initialMode, initialUser, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { data: usersData } = useCoachTelegramUsers(
    apiBase,
    { page: 1, limit: 200 },
    {
      queryKey: [`${apiBase}-users-drawer`],
      enabled: open && mode === "individual" && !initialUser,
    },
  );
  const usersList = resolveTelegramItems(usersData);

  const sendMutation = useCoachTelegramSendMessage();

  const handleSend = () => {
    if (!trim(text)) return toast.error("Xabar matni kiriting");
    if (mode === "individual" && !selectedUser)
      return toast.error("Foydalanuvchini tanlang");

    const attributes =
      mode === "broadcast"
        ? { message: trim(text) }
        : { message: trim(text), telegramUserId: selectedUser.id };

    sendMutation.mutate(
      { url: `${apiBase}/send-message`, attributes },
      {
        onSuccess: () => {
          toast.success("Xabar yuborildi ✅");
          onOpenChange(false);
          setText("");
        },
        onError: () => toast.error("Xabar yuborilmadi"),
      },
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle>Xabar yuborish</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                ✕
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setMode("broadcast")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === "broadcast"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📢 Barcha foydalanuvchilarga
            </button>
            <button
              type="button"
              onClick={() => setMode("individual")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === "individual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              👤 Alohida
            </button>
          </div>

          {/* Individual: user selector */}
          {mode === "individual" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Foydalanuvchi</p>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(
                          selectedUser.firstName,
                          selectedUser.lastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </span>
                  </div>
                  {!initialUser && (
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      O'zgartirish
                    </button>
                  )}
                </div>
              ) : (
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => {
                    const u = usersList.find((x) => x.id === e.target.value);
                    if (u) setSelectedUser(u);
                  }}
                >
                  <option value="" disabled>
                    Foydalanuvchini tanlang...
                  </option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                      {u.username ? ` (@${u.username})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Message textarea */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Xabar</p>
            {templates.length ? (
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value=""
                onChange={(event) => {
                  const template = templates.find(
                    (item) => item.key === event.target.value,
                  );
                  if (!template) return;

                  setText(
                    get(template, "translations.uz") ||
                      get(template, "translations.en") ||
                      get(template, "translations.ru") ||
                      "",
                  );
                }}
              >
                <option value="" disabled>
                  Template tanlash...
                </option>
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
            ) : null}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === "broadcast"
                  ? "Barcha foydalanuvchilarga xabar..."
                  : "Xabar matni..."
              }
              rows={5}
            />
            {mode === "broadcast" && (
              <p className="text-muted-foreground text-xs">
                Bu xabar botning barcha foydalanuvchilariga yuboriladi.
              </p>
            )}
          </div>
        </DrawerBody>

        <DrawerFooter className="border-t">
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !trim(text)}
            className="w-full"
          >
            {sendMutation.isPending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="mr-2 h-4 w-4" />
            )}
            Yuborish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function StatusBadge({ status }) {
  const config = {
    ACTIVE: {
      label: "Faol",
      dot: "bg-green-500 animate-pulse",
      badge: "bg-green-500/10 text-green-700 border-green-200",
    },
    INACTIVE: {
      label: "O'chirilgan",
      dot: "bg-gray-400",
      badge: "bg-gray-100 text-gray-600 border-gray-200",
    },
    ERROR: {
      label: "Xatolik",
      dot: "bg-red-500",
      badge: "bg-red-500/10 text-red-700 border-red-200",
    },
    SUSPENDED: {
      label: "To'xtatilgan",
      dot: "bg-yellow-500",
      badge: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    },
  };
  const c = config[status] || config.INACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${c.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function QuickMeta({ label, value, tone = "neutral" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        tone === "primary" && "border-primary/20 bg-primary/[0.06]",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/[0.08]",
        tone === "danger" && "border-destructive/20 bg-destructive/10",
        tone === "neutral" && "border-border/60 bg-background/70",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, colorClass, bgClass }) {
  return (
    <motion.div variants={revealUp} initial="hidden" animate="visible">
      <Card className="border-border/60 bg-background/80 shadow-sm">
        <CardContent className="flex items-center gap-4 pt-5 pb-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bgClass}`}
          >
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-muted-foreground mt-1 text-xs font-medium uppercase tracking-[0.16em]">
              {label}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ToggleButton({ bot, apiBase, queryKey }) {
  const toggleMutation = useCoachTelegramToggle(queryKey);
  const isActive = bot.status === "ACTIVE";
  return (
    <Button
      variant={isActive ? "outline" : "default"}
      size="sm"
      className="rounded-2xl"
      onClick={() =>
        toggleMutation.mutate({ url: `${apiBase}/toggle`, attributes: {} })
      }
      disabled={toggleMutation.isPending}
    >
      <PowerIcon className="mr-1 h-4 w-4" />
      {isActive ? "To'xtatish" : "Yoqish"}
    </Button>
  );
}

function DisconnectButton({ apiBase, queryKey }) {
  const disconnectMutation = useCoachTelegramDisconnect(queryKey);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-2xl"
          disabled={disconnectMutation.isPending}
        >
          <PowerIcon className="h-4 w-4 text-destructive" />
          Uzish
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Botni uzib olish</AlertDialogTitle>
          <AlertDialogDescription>
            Bot Telegram webhookidan uziladi va inactive holatga o'tadi.
            Foydalanuvchi va xabarlar tarixi saqlanadi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() =>
              disconnectMutation.mutate({ url: `${apiBase}/disconnect` })
            }
          >
            Uzish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

const LANG_TABS = [
  { key: "uz", label: "🇺🇿 O'zbek", placeholder: "Xush kelibsiz..." },
  { key: "ru", label: "🇷🇺 Rus", placeholder: "Добро пожаловать..." },
  { key: "en", label: "🇬🇧 Ingliz", placeholder: "Welcome..." },
];

function SettingsTab({ bot, apiBase, queryKey }) {
  const [activeLang, setActiveLang] = useState("uz");
  const [messages, setMessages] = useState({
    uz: get(bot, "welcomeMessage.uz") || "",
    ru: get(bot, "welcomeMessage.ru") || "",
    en: get(bot, "welcomeMessage.en") || "",
  });

  const updateMutation = useCoachTelegramSettings(queryKey);

  const handleSave = () => {
    updateMutation.mutate({
      url: `${apiBase}/settings`,
      attributes: { welcomeMessage: messages },
    });
  };

  const active = find(LANG_TABS, (l) => l.key === activeLang);

  return (
    <Card className="mt-4 border-border/60 bg-background/80 shadow-sm">
      <CardHeader>
        <CardTitle>Xush kelibsiz xabar</CardTitle>
        <CardDescription>
          Foydalanuvchi /start buyrug'ini yuborganda ko'rinadigan xabar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex w-fit gap-1 rounded-2xl border border-border/60 bg-muted/20 p-1">
          {LANG_TABS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setActiveLang(l.key)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                activeLang === l.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Active language textarea */}
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <Textarea
            key={activeLang}
            value={messages[activeLang]}
            onChange={(e) =>
              setMessages((prev) => ({ ...prev, [activeLang]: e.target.value }))
            }
            placeholder={get(active, "placeholder")}
            rows={5}
            className="rounded-2xl bg-background"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-2xl"
          >
            {updateMutation.isPending && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Saqlash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function resolveTemplatesPayload(response) {
  return get(response, "data.data") || get(response, "data") || {};
}

function resolveTelegramItems(response) {
  const candidates = [
    get(response, "data.data.items"),
    get(response, "data.items"),
    get(response, "data.data"),
    get(response, "data"),
    get(response, "items"),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function TemplatesTab({ apiBase }) {
  const queryKey = [`${apiBase}-templates`];
  const { data, isLoading } = useCoachTelegramTemplates(apiBase, { queryKey });
  const saveMutation = useCoachTelegramTemplateSave(queryKey);
  const previewMutation = useCoachTelegramTemplatePreview();
  const deleteMutation = useCoachTelegramTemplateDelete(queryKey);
  const payload = resolveTemplatesPayload(data);
  const templates = get(payload, "items", []);
  const variableOptions = get(payload, "variables", []);
  const [selectedKey, setSelectedKey] = useState("");
  const [activeLang, setActiveLang] = useState("uz");
  const [draftKey, setDraftKey] = useState("");
  const [label, setLabel] = useState("");
  const [translations, setTranslations] = useState({ uz: "", ru: "", en: "" });
  const [selectedVariables, setSelectedVariables] = useState([]);
  const [sampleVariables, setSampleVariables] = useState({});
  const [previewText, setPreviewText] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.key === selectedKey) || null,
    [selectedKey, templates],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!selectedKey && templates.length) {
      setSelectedKey(templates[0].key);
    }
  }, [selectedKey, templates]);

  React.useEffect(() => {
    const samples = {};
    variableOptions.forEach((item) => {
      samples[item.key] = item.sample || "";
    });
    setSampleVariables(samples);
  }, [variableOptions]);

  React.useEffect(() => {
    if (selectedKey === "__new") {
      setDraftKey("custom_template");
      setLabel("Custom template");
      setTranslations({ uz: "", ru: "", en: "" });
      setSelectedVariables([]);
      setPreviewText("");
      return;
    }

    if (!selectedTemplate) return;

    setDraftKey(selectedTemplate.key);
    setLabel(selectedTemplate.label || "");
    setTranslations({
      uz: get(selectedTemplate, "translations.uz", ""),
      ru: get(selectedTemplate, "translations.ru", ""),
      en: get(selectedTemplate, "translations.en", ""),
    });
    setSelectedVariables(get(selectedTemplate, "variables", []));
    setPreviewText("");
  }, [selectedKey, selectedTemplate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleVariable = (key) => {
    setSelectedVariables((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const insertVariable = (key) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLang]: `${prev[activeLang] || ""} {{${key}}}`,
    }));
  };

  const handleSave = () => {
    const key = trim(draftKey);
    if (!key) return toast.error("Template key kiriting");

    saveMutation.mutate(
      {
        url: `${apiBase}/templates/${encodeURIComponent(key)}`,
        attributes: {
          label: trim(label) || key,
          translations,
          variables: selectedVariables,
        },
      },
      {
        onSuccess: () => {
          toast.success("Template saqlandi");
          setSelectedKey(key.toLowerCase().replace(/[^a-z0-9_-]+/g, "_"));
        },
        onError: () => toast.error("Template saqlanmadi"),
      },
    );
  };

  const handlePreview = () => {
    if (!trim(draftKey)) return;

    previewMutation.mutate(
      {
        url: `${apiBase}/templates/${encodeURIComponent(trim(draftKey))}/preview`,
        attributes: {
          languageCode: activeLang,
          variables: sampleVariables,
        },
      },
      {
        onSuccess: (response) => {
          setPreviewText(
            get(response, "data.data.text") || get(response, "data.text") || "",
          );
        },
        onError: () => toast.error("Preview yaratilmadi"),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedTemplate || selectedTemplate.builtIn) return;

    deleteMutation.mutate(
      {
        url: `${apiBase}/templates/${encodeURIComponent(selectedTemplate.key)}`,
      },
      {
        onSuccess: () => {
          toast.success("Template ochirildi");
          setSelectedKey("");
        },
        onError: () => toast.error("Template ochirilmadi"),
      },
    );
  };

  if (isLoading) {
    return (
      <Card className="mt-4 border-border/60 bg-background/80 shadow-sm">
        <CardContent className="flex items-center gap-2 pt-5 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Template yuklanmoqda
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border-border/60 bg-background/80 shadow-sm">
      <CardHeader>
        <CardTitle>Telegram xabar templatelari</CardTitle>
        <CardDescription>
          Uzbek, Rus va Ingliz reusable matnlar hamda variable preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          <select
            className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
            value={selectedKey}
            onChange={(event) => setSelectedKey(event.target.value)}
          >
            {templates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
            <option value="__new">+ Yangi template</option>
          </select>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Variablelar
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {variableOptions.map((variable) => (
                <Button
                  key={variable.key}
                  type="button"
                  variant={
                    selectedVariables.includes(variable.key)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="rounded-xl"
                  onClick={() => toggleVariable(variable.key)}
                >
                  {variable.key}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field>
              <FieldLabel>Template key</FieldLabel>
              <Input
                value={draftKey}
                disabled={selectedTemplate?.builtIn}
                onChange={(event) => setDraftKey(event.target.value)}
                className="mt-2 rounded-xl font-mono"
              />
            </Field>
            <Field>
              <FieldLabel>Nomi</FieldLabel>
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="mt-2 rounded-xl"
              />
            </Field>
          </div>

          <div className="flex w-fit gap-1 rounded-2xl border border-border/60 bg-muted/20 p-1">
            {LANG_TABS.map((lang) => (
              <button
                key={lang.key}
                type="button"
                onClick={() => setActiveLang(lang.key)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeLang === lang.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <Textarea
            value={translations[activeLang]}
            onChange={(event) =>
              setTranslations((prev) => ({
                ...prev,
                [activeLang]: event.target.value,
              }))
            }
            rows={5}
            className="rounded-2xl"
          />

          <div className="flex flex-wrap gap-2">
            {variableOptions.map((variable) => (
              <Button
                key={variable.key}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => insertVariable(variable.key)}
              >
                + {variable.key}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {selectedVariables.map((variable) => (
              <Field key={variable}>
                <FieldLabel>{variable}</FieldLabel>
                <Input
                  value={sampleVariables[variable] || ""}
                  onChange={(event) =>
                    setSampleVariables((prev) => ({
                      ...prev,
                      [variable]: event.target.value,
                    }))
                  }
                  className="mt-2 rounded-xl"
                />
              </Field>
            ))}
          </div>

          {previewText ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-6">
              {previewText}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {selectedTemplate && !selectedTemplate.builtIn ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                O'chirish
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={handlePreview}
              disabled={previewMutation.isPending}
            >
              Preview
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              Saqlash
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Users tab
// ---------------------------------------------------------------------------

function getInitials(firstName, lastName) {
  const f = get(firstName, "[0]", "");
  const l = get(lastName, "[0]", "");
  return toUpper(f + l) || "?";
}

function UsersTab({ apiBase, onSendMessage }) {
  const { data, isLoading } = useCoachTelegramUsers(
    apiBase,
    { page: 1, limit: 200 },
    { queryKey: [`${apiBase}-users`] },
  );

  const allUsers = resolveTelegramItems(data);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      {
        id: "user",
        header: "Foydalanuvchi",
        accessorFn: (row) =>
          `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        meta: { cellClassName: "min-w-[200px]" },
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={u.photoUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(u.firstName, u.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm">
                {u.firstName} {u.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ getValue }) => {
          const v = getValue();
          return v ? (
            <span className="text-muted-foreground text-sm">@{v}</span>
          ) : (
            <span className="text-muted-foreground/50 text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || "—"}</span>
        ),
      },
      {
        accessorKey: "languageCode",
        header: "Til",
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-xs">
            {toUpper(getValue() || "uz")}
          </Badge>
        ),
      },
      {
        accessorKey: "lastActiveAt",
        header: "Oxirgi faollik",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {getValue() ? new Date(getValue()).toLocaleDateString() : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 56,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onSendMessage(row.original)}
            title="Xabar yuborish"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [onSendMessage],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: allUsers,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isLoading)
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Yuklanmoqda...
      </div>
    );

  return (
    <div className="mt-4 space-y-3">
      <Input
        placeholder="Qidirish: ism, username, telefon..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm rounded-2xl"
      />
      <Card className="border-border/60 bg-background/80 shadow-sm">
        <CardContent className="pt-5">
          <DataGrid
            table={table}
            isLoading={isLoading}
            recordCount={table.getFilteredRowModel().rows.length}
          >
            <DataGridContainer>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
            <DataGridPagination />
          </DataGrid>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Messages tab
// ---------------------------------------------------------------------------

function MessagesTab({ apiBase }) {
  const queryClient = useQueryClient();
  const messagesQueryKey = [`${apiBase}-messages`];
  const { data, isLoading } = useCoachTelegramMessages(
    apiBase,
    { page: 1, limit: 100 },
    { queryKey: messagesQueryKey },
  );
  const retryMutation = useCoachTelegramSendMessage();

  const messages = resolveTelegramItems(data);
  const [userFilter, setUserFilter] = useState("all");

  const uniqueUsers = useMemo(() => {
    const seen = new Set();
    const users = [];
    messages.forEach((m) => {
      const id = m.telegramUserId || m.userId;
      if (id && !seen.has(id)) {
        seen.add(id);
        users.push({ id, name: m.senderName || m.userName || String(id) });
      }
    });
    return users;
  }, [messages]);

  const filtered = useMemo(() => {
    if (userFilter === "all") return messages;
    return messages.filter(
      (m) => (m.telegramUserId || m.userId) === userFilter,
    );
  }, [messages, userFilter]);

  const handleRetryDelivery = (messageId) => {
    retryMutation.mutate(
      {
        url: `${apiBase}/messages/${messageId}/retry`,
        attributes: {},
      },
      {
        onSuccess: async () => {
          toast.success("Telegram delivery qayta yuborildi");
          await queryClient.invalidateQueries({ queryKey: messagesQueryKey });
        },
      },
    );
  };

  if (isLoading)
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Yuklanmoqda...
      </div>
    );

  return (
    <Card className="mt-4 border-border/60 bg-background/80 shadow-sm">
      <CardContent className="pt-4 space-y-3">
        {uniqueUsers.length > 0 && (
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="border-input bg-background rounded-2xl border px-3 py-2 text-sm"
          >
            <option value="all">Barcha foydalanuvchilar</option>
            {uniqueUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Hali xabarlar yo'q
          </p>
        ) : (
          <ScrollArea className="h-[480px]">
            <div className="space-y-3 pr-3">
              {filtered.map((m) => {
                const direction = String(m.direction || "").toUpperCase();
                const isOutgoing = direction === "OUTGOING";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isOutgoing ? "items-end" : "items-start"}`}
                  >
                    {!isOutgoing && (
                      <span className="text-muted-foreground mb-0.5 ml-1 text-xs">
                        {m.senderName || m.userName || "Foydalanuvchi"}
                      </span>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        isOutgoing
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                          : "bg-muted/70 ring-1 ring-border/50 rounded-bl-sm"
                      }`}
                    >
                    <p>{m.content || `[${m.messageType}]`}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.deliveryStatus && (
                        <Badge variant={m.deliveryStatus === "FAILED" ? "destructive" : "secondary"} className="h-5 text-[10px]">
                          {m.deliveryStatus}
                        </Badge>
                      )}
                      {m.telegramMessageId ? (
                        <span className="text-[10px] opacity-60">
                          TG #{m.telegramMessageId}
                        </span>
                      ) : null}
                      {m.chatMessageId ? (
                        <span className="text-[10px] opacity-60">
                          Chat mapped
                        </span>
                      ) : null}
                    </div>
                    {m.deliveryStatus === "FAILED" && m.source === "chat_bridge" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 px-2 text-[10px]"
                        disabled={retryMutation.isPending}
                        onClick={() => handleRetryDelivery(m.id)}
                      >
                        <RefreshCwIcon className="mr-1 size-3" />
                        Retry
                      </Button>
                    ) : null}
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isOutgoing
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
