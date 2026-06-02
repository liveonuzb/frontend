import React from "react";
import find from "lodash/find";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import filter from "lodash/filter";
import { toast } from "sonner";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import {
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  BotIcon,
  MegaphoneIcon,
  RefreshCwIcon,
  SendIcon,
  XCircleIcon,
} from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
const ADMIN_PLATFORM_BOT_TEMPLATE_QUERY_KEY = [
  "admin",
  "platform-bot",
  "campaign-templates",
];
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_BROADCAST_OPTIONS = {
  languageCode: "all",
  linkedOnly: false,
  includeMuted: false,
  dryRun: false,
  activeWithinDays: "",
  scheduledAt: "",
  experimentKey: "",
  variantKey: "",
  holdoutPercent: "",
};

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

  return formatDateTime(toNumber(value) * 1000);
};

const formatStarsAmount = (value) =>
  `${new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(toNumber(value) || 0)} XTR`;

const formatBroadcastStatus = (status) => {
  const labels = {
    PENDING_APPROVAL: "Tasdiq kutilmoqda",
    QUEUED: "Navbatda",
    RUNNING: "Yuborilmoqda",
    COMPLETED: "Yakunlangan",
    FAILED: "Xato",
    REJECTED: "Rad etilgan",
  };

  return labels[status] || status || "-";
};

const getBroadcastProgress = (job) => {
  const total = toNumber(job?.totalCount) || 0;
  if (!total) return 0;

  const done =
    (toNumber(job?.sentCount) || 0) +
    (toNumber(job?.failedCount) || 0) +
    (toNumber(job?.skippedCount) || 0) +
    (toNumber(job?.suppressedCount) || 0);

  return Math.min(100, Math.round((done / total) * 100));
};

const resolveUserName = (chat) => {
  const user = chat.user;
  const firstName =
    user?.profile?.firstName || user?.onboarding?.firstName || chat.firstName;
  const lastName =
    user?.profile?.lastName || user?.onboarding?.lastName || chat.lastName;
  const fullName = trim(filter([firstName, lastName], Boolean).join(" "));

  return fullName || chat.username || chat.telegramId;
};

const maskPhone = (value) => {
  const phone = trim(value);
  if (!phone) return "";
  if (phone.includes("*")) return phone;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;

  const visiblePrefix = digits.slice(0, 3);
  const visibleSuffix = digits.slice(-4);
  const maskLength = Math.max(4, digits.length - visiblePrefix.length - 4);

  return `${phone.startsWith("+") ? "+" : ""}${visiblePrefix}${"*".repeat(maskLength)}${visibleSuffix}`;
};

const resolveUserContact = (chat) =>
  chat.user?.email || maskPhone(chat.user?.phone) || "-";

const StatCard = ({ label, value, description }) => (
  <Card className="py-6">
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
  const [broadcastOptions, setBroadcastOptions] = React.useState(
    DEFAULT_BROADCAST_OPTIONS,
  );
  const [broadcastPreview, setBroadcastPreview] = React.useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("none");
  const deferredSearch = React.useDeferredValue(search);
  const currentPage = Math.max(1, toNumber(pageQuery) || 1);
  const pageSize = Math.max(1, toNumber(pageSizeQuery) || DEFAULT_PAGE_SIZE);

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
      ...(trim(deferredSearch) ? { q: trim(deferredSearch) } : {}),
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

  const campaignTemplatesQuery = useGetQuery({
    url: "/admin/platform-bot/campaign-templates",
    queryProps: {
      queryKey: ADMIN_PLATFORM_BOT_TEMPLATE_QUERY_KEY,
    },
  });

  const webhookMutation = usePostQuery({
    queryKey: ADMIN_PLATFORM_BOT_QUERY_KEY,
    listKey: ADMIN_PLATFORM_BOT_USERS_QUERY_KEY,
  });

  const previewMutation = usePostQuery();

  const broadcastMutation = usePostQuery({
    queryKey: ADMIN_PLATFORM_BOT_QUERY_KEY,
    listKey: ADMIN_PLATFORM_BOT_USERS_QUERY_KEY,
  });

  const approvalMutation = usePostQuery({
    queryKey: ADMIN_PLATFORM_BOT_QUERY_KEY,
  });

  const statusPayload = React.useMemo(
    () => getApiResponseData(statusQuery.data, {}),
    [statusQuery.data],
  );
  const usersPayload = React.useMemo(
    () => getApiResponseData(usersQuery.data, {}),
    [usersQuery.data],
  );
  const campaignTemplatesPayload = React.useMemo(
    () => getApiResponseData(campaignTemplatesQuery.data, {}),
    [campaignTemplatesQuery.data],
  );
  const webhookInfo = get(statusPayload, "webhookInfo", null);
  const health = get(statusPayload, "health", {});
  const stats = get(statusPayload, "stats", {});
  const coachStats = get(stats, "coachRemindersToday", {});
  const coachStatsDescription = `${get(coachStats, "sent", 0)} sent / ${get(
    coachStats,
    "skipped",
    0,
  )} skipped / ${get(coachStats, "failed", 0)} failed / ${get(
    coachStats,
    "suppressed",
    0,
  )} suppressed`;
  const recentBroadcastJobsPayload = get(
    statusPayload,
    "recentBroadcastJobs",
    [],
  );
  const recentBroadcastJobs = isArray(recentBroadcastJobsPayload)
    ? recentBroadcastJobsPayload
    : [];
  const supportInbox = get(statusPayload, "supportInbox", {});
  const supportTicketsPayload = get(supportInbox, "tickets", []);
  const supportTickets = isArray(supportTicketsPayload)
    ? supportTicketsPayload
    : [];
  const telegramStarsPayments = get(statusPayload, "telegramStarsPayments", {});
  const campaignTemplatesData = get(campaignTemplatesPayload, "data", []);
  const campaignTemplates = isArray(campaignTemplatesData)
    ? campaignTemplatesData
    : [];
  const selectedCampaignTemplate = React.useMemo(
    () => find(campaignTemplates, { id: selectedTemplateId }) || null,
    [campaignTemplates, selectedTemplateId],
  );
  const users = isArray(usersPayload) ? usersPayload : [];
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

  const updateBroadcastOption = React.useCallback((key, value) => {
    setBroadcastPreview(null);
    setBroadcastOptions((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleCampaignTemplateSelect = React.useCallback(
    (templateId) => {
      setSelectedTemplateId(templateId);
      setBroadcastPreview(null);

      if (templateId === "none") {
        return;
      }

      const template = find(campaignTemplates, { id: templateId });
      if (!template) {
        return;
      }

      setBroadcastText(template.text || "");
      setBroadcastOptions((current) => ({
        ...current,
        languageCode: template.languageCode || current.languageCode,
        linkedOnly: true,
      }));
    },
    [campaignTemplates],
  );

  const buildBroadcastPayload = React.useCallback(
    (includeText = true) => {
      const activeWithinDays = toNumber(broadcastOptions.activeWithinDays);
      const holdoutPercent = toNumber(broadcastOptions.holdoutPercent);
      const scheduledAtDate = broadcastOptions.scheduledAt
        ? new Date(broadcastOptions.scheduledAt)
        : null;
      const scheduledAt =
        scheduledAtDate && !Number.isNaN(scheduledAtDate.getTime())
          ? scheduledAtDate.toISOString()
          : undefined;

      return {
        ...(includeText ? { text: trim(broadcastText) } : {}),
        dryRun: Boolean(broadcastOptions.dryRun),
        includeMuted: Boolean(broadcastOptions.includeMuted),
        linkedOnly: Boolean(broadcastOptions.linkedOnly),
        ...(broadcastOptions.languageCode !== "all"
          ? { languageCode: broadcastOptions.languageCode }
          : {}),
        ...(Number.isFinite(activeWithinDays) && activeWithinDays > 0
          ? { activeWithinDays }
          : {}),
        ...(trim(broadcastOptions.experimentKey)
          ? { experimentKey: trim(broadcastOptions.experimentKey) }
          : {}),
        ...(trim(broadcastOptions.variantKey)
          ? { variantKey: trim(broadcastOptions.variantKey) }
          : {}),
        ...(Number.isFinite(holdoutPercent) && holdoutPercent > 0
          ? { holdoutPercent }
          : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
        ...(selectedCampaignTemplate
          ? {
              campaignKey: selectedCampaignTemplate.campaignKey,
              journeyKey: selectedCampaignTemplate.journeyKey,
              journeyStepKey: selectedCampaignTemplate.journeyStepKey,
              campaignMetadata: {
                templateId: selectedCampaignTemplate.id,
                templateTitle: selectedCampaignTemplate.title,
                templateLanguageCode: selectedCampaignTemplate.languageCode,
                edited:
                  trim(broadcastText) !== trim(selectedCampaignTemplate.text),
              },
            }
          : {}),
      };
    },
    [broadcastOptions, broadcastText, selectedCampaignTemplate],
  );

  const resetBroadcastForm = React.useCallback(() => {
    setBroadcastText("");
    setBroadcastPreview(null);
    setSelectedTemplateId("none");
    setBroadcastOptions(DEFAULT_BROADCAST_OPTIONS);
  }, []);

  const handlePreviewBroadcast = async () => {
    if (!canManageGrowth) return;

    try {
      const response = await previewMutation.mutateAsync({
        url: "/admin/platform-bot/broadcast/preview",
        attributes: buildBroadcastPayload(false),
      });
      const result = getApiResponseData(response, {});
      setBroadcastPreview(result);
      toast.success(`${result.total ?? 0} ta recipient topildi.`);
    } catch {
      toast.error("Broadcast preview olinmadi.");
    }
  };

  const handleBroadcast = async () => {
    if (!canManageGrowth) return;

    if (!trim(broadcastText)) {
      toast.error("Xabar matnini kiriting.");
      return;
    }

    try {
      const response = await broadcastMutation.mutateAsync({
        url: "/admin/platform-bot/broadcast-jobs",
        attributes: buildBroadcastPayload(true),
      });
      const result = getApiResponseData(response, {});
      toast.success(
        result.dryRun
          ? `Dry-run yakunlandi: ${result.totalCount ?? 0} recipient.`
          : `Broadcast job yaratildi: ${result.totalCount ?? 0} recipient.`,
      );
      resetBroadcastForm();
      setBroadcastOpen(false);
    } catch {
      toast.error("Broadcast job yaratilmadi.");
    }
  };

  const handleApproveBroadcast = async (jobId) => {
    if (!canManageGrowth || !jobId) return;

    try {
      await approvalMutation.mutateAsync({
        url: `/admin/platform-bot/broadcast-jobs/${jobId}/approve`,
      });
      toast.success("Broadcast job tasdiqlandi.");
    } catch {
      toast.error("Broadcast job tasdiqlanmadi.");
    }
  };

  const handleRejectBroadcast = async (jobId) => {
    if (!canManageGrowth || !jobId) return;

    try {
      await approvalMutation.mutateAsync({
        url: `/admin/platform-bot/broadcast-jobs/${jobId}/reject`,
      });
      toast.success("Broadcast job rad etildi.");
    } catch {
      toast.error("Broadcast job rad etilmadi.");
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
                {resolveUserContact(chat)}
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
        cell: (info) => maskPhone(info.getValue()) || "-",
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
      const nextPageSize = toNumber(get(next, "pageSize")) || pageSize;

      React.startTransition(() => {
        void setPageQuery(
          String(
            nextPageSize === pageSize
              ? toNumber(get(next, "pageIndex", 0)) + 1
              : 1,
          ),
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
              <Sheet
                open={broadcastOpen}
                onOpenChange={(open) => {
                  setBroadcastOpen(open);
                  if (!open) {
                    resetBroadcastForm();
                  }
                }}
              >
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
                      Preview va segmentlar tekshirilgandan keyin job navbatga
                      qo'shiladi.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 px-6">
                    <div className="flex flex-col gap-2">
                      <Label>Template</Label>
                      <Select
                        value={selectedTemplateId}
                        onValueChange={handleCampaignTemplateSelect}
                        disabled={campaignTemplatesQuery.isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Shablonsiz</SelectItem>
                          {map(campaignTemplates, (template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.title} · {template.languageCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={broadcastText}
                      onChange={(event) => {
                        setBroadcastText(event.target.value);
                        setBroadcastPreview(null);
                      }}
                      placeholder="Xabar matni"
                      rows={8}
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{broadcastText.length}/1000 belgi</span>
                      <span>{broadcastPreview?.total ?? "-"} recipient</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Til</Label>
                        <Select
                          value={broadcastOptions.languageCode}
                          onValueChange={(value) =>
                            updateBroadcastOption("languageCode", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Til" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha tillar</SelectItem>
                            <SelectItem value="uz">Uzbek</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="broadcast-active-days">
                          Faol kunlar
                        </Label>
                        <Input
                          id="broadcast-active-days"
                          type="number"
                          min="1"
                          max="365"
                          value={broadcastOptions.activeWithinDays}
                          onChange={(event) =>
                            updateBroadcastOption(
                              "activeWithinDays",
                              event.target.value,
                            )
                          }
                          placeholder="Masalan: 30"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="broadcast-experiment-key">
                          Experiment
                        </Label>
                        <Input
                          id="broadcast-experiment-key"
                          value={broadcastOptions.experimentKey}
                          onChange={(event) =>
                            updateBroadcastOption(
                              "experimentKey",
                              event.target.value,
                            )
                          }
                          placeholder="onboarding-copy"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="broadcast-variant-key">Variant</Label>
                        <Input
                          id="broadcast-variant-key"
                          value={broadcastOptions.variantKey}
                          onChange={(event) =>
                            updateBroadcastOption(
                              "variantKey",
                              event.target.value,
                            )
                          }
                          placeholder="variant-a"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="broadcast-holdout-percent">
                          Holdout %
                        </Label>
                        <Input
                          id="broadcast-holdout-percent"
                          type="number"
                          min="0"
                          max="100"
                          value={broadcastOptions.holdoutPercent}
                          onChange={(event) =>
                            updateBroadcastOption(
                              "holdoutPercent",
                              event.target.value,
                            )
                          }
                          placeholder="10"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="broadcast-scheduled-at">Schedule</Label>
                      <Input
                        id="broadcast-scheduled-at"
                        type="datetime-local"
                        value={broadcastOptions.scheduledAt}
                        onChange={(event) =>
                          updateBroadcastOption(
                            "scheduledAt",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-3 text-sm">
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={broadcastOptions.linkedOnly}
                          onCheckedChange={(checked) =>
                            updateBroadcastOption(
                              "linkedOnly",
                              Boolean(checked),
                            )
                          }
                        />
                        Faqat linked userlar
                      </label>
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={broadcastOptions.includeMuted}
                          onCheckedChange={(checked) =>
                            updateBroadcastOption(
                              "includeMuted",
                              Boolean(checked),
                            )
                          }
                        />
                        Muted chatlarni ham qo'shish
                      </label>
                      <label className="flex items-center gap-3">
                        <Checkbox
                          checked={broadcastOptions.dryRun}
                          onCheckedChange={(checked) =>
                            updateBroadcastOption("dryRun", Boolean(checked))
                          }
                        />
                        Dry-run
                      </label>
                    </div>
                    {broadcastPreview ? (
                      <div className="rounded-md border p-3 text-sm">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">Preview</span>
                          <Badge variant="secondary">
                            {broadcastPreview.total ?? 0} recipient
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <span>
                            Linked: {broadcastPreview.segments?.linked ?? 0}
                          </span>
                          <span>
                            Unlinked: {broadcastPreview.segments?.unlinked ?? 0}
                          </span>
                          <span>
                            Muted: {broadcastPreview.segments?.muted ?? 0}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <SheetFooter className="gap-2 sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviewBroadcast}
                      disabled={previewMutation.isPending || !canManageGrowth}
                    >
                      <EyeIcon data-icon="inline-start" />
                      Preview
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          disabled={
                            broadcastMutation.isPending ||
                            !canManageGrowth ||
                            !trim(broadcastText) ||
                            !broadcastPreview ||
                            toNumber(broadcastPreview.total ?? 0) === 0
                          }
                        >
                          <SendIcon data-icon="inline-start" />
                          {broadcastOptions.dryRun ? "Dry-run job" : "Yuborish"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Broadcastni tasdiqlash
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {broadcastPreview?.total ?? 0} ta recipient uchun
                            job yaratiladi. Dry-run bo'lmasa xabar Telegramga
                            yuboriladi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBroadcast}>
                            Tasdiqlash
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Jami chatlar" value={stats.totalChats} />
          <StatCard label="Linked userlar" value={stats.linkedChats} />
          <StatCard label="Faol 7 kun" value={stats.activeChats7d} />
          <StatCard label="Muted chatlar" value={stats.mutedChats} />
          <StatCard label="Bugungi reminderlar" value={stats.remindersToday} />
          <StatCard
            label="Bugungi coach loop"
            value={get(coachStats, "total", 0)}
            description={coachStatsDescription}
          />
          <StatCard
            label="Stars subscription"
            value={get(telegramStarsPayments, "subscriptions.active", 0)}
            description={`${get(
              telegramStarsPayments,
              "subscriptions.expired",
              0,
            )} expired / ${get(
              telegramStarsPayments,
              "subscriptions.cancelled",
              0,
            )} cancelled`}
          />
          <StatCard
            label="Stars payment"
            value={formatStarsAmount(
              get(telegramStarsPayments, "completed.amount", 0),
            )}
            description={`${get(
              telegramStarsPayments,
              "completed.count",
              0,
            )} paid / ${get(
              telegramStarsPayments,
              "pending.count",
              0,
            )} pending / ${get(
              telegramStarsPayments,
              "refunded.count",
              0,
            )} refunded`}
          />
        </div>

        <Card className="py-6">
          <CardHeader>
            <div>
              <CardTitle>Webhook diagnostika</CardTitle>
              <CardDescription>
                Telegram update yuborayotgan URL va oxirgi xato holati.
              </CardDescription>
            </div>
            <CardAction>
              <Badge
                variant={
                  health?.webhookMatches || webhookInfo?.url
                    ? "default"
                    : "destructive"
                }
              >
                {health?.webhookMatches ? "Matched" : "Check webhook"}
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
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Expected URL
                </span>
                <span className="break-all text-sm">
                  {health?.expectedWebhookUrl || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Secret
                </span>
                <span className="text-sm">
                  {health?.secretConfigured ? "Configured" : "Not configured"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Last recovery
                </span>
                <span className="text-sm">
                  {formatDateTime(health?.lastRecoveryAt)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Last reminder run
                </span>
                <span className="text-sm">
                  {health?.lastReminderRun
                    ? `${formatDateTime(health.lastReminderRun.at)} · ${
                        health.lastReminderRun.sent ?? 0
                      } sent / ${health.lastReminderRun.failed ?? 0} failed`
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <div>
              <CardTitle>Broadcast joblar</CardTitle>
              <CardDescription>
                Oxirgi broadcast runlari va delivery progress.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentBroadcastJobs.length ? (
              map(recentBroadcastJobs, (job) => (
                <div key={job.id} className="rounded-md border p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {job.status === "COMPLETED" ? (
                        <CheckCircle2Icon className="size-4 text-emerald-600" />
                      ) : job.status === "FAILED" || job.status === "REJECTED" ? (
                        <XCircleIcon className="size-4 text-destructive" />
                      ) : (
                        <ClockIcon className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">
                        {formatBroadcastStatus(job.status)}
                      </span>
                      {job.dryRun ? (
                        <Badge variant="outline">Dry-run</Badge>
                      ) : null}
                      {job.campaignKey ? (
                        <Badge variant="secondary">
                          {job.campaignKey}
                          {job.journeyStepKey ? `:${job.journeyStepKey}` : ""}
                        </Badge>
                      ) : null}
                      {job.experimentKey ? (
                        <Badge variant="outline">
                          {job.experimentKey}
                          {job.variantKey ? `:${job.variantKey}` : ""}
                          {job.holdoutPercent
                            ? ` · ${job.holdoutPercent}% holdout`
                            : ""}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canManageGrowth &&
                      job.status === "PENDING_APPROVAL" ? (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                disabled={approvalMutation.isPending}
                              >
                                <CheckCircle2Icon data-icon="inline-start" />
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Broadcastni tasdiqlash
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Job tasdiqlangandan keyin navbatga tushadi va
                                  schedule vaqti kelgan bo'lsa yuboriladi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Bekor qilish
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleApproveBroadcast(job.id)}
                                >
                                  Tasdiqlash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={approvalMutation.isPending}
                              >
                                <XCircleIcon data-icon="inline-start" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Broadcastni rad etish
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Job rad etiladi va Telegramga yuborilmaydi.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Bekor qilish
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRejectBroadcast(job.id)}
                                >
                                  Rad etish
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Progress value={getBroadcastProgress(job)} />
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-5">
                    <span>Total: {job.totalCount ?? 0}</span>
                    <span>Sent: {job.sentCount ?? 0}</span>
                    <span>Failed: {job.failedCount ?? 0}</span>
                    <span>Suppressed: {job.suppressedCount ?? 0}</span>
                    <span>Skipped: {job.skippedCount ?? 0}</span>
                  </div>
                  {job.conversions ? (
                    <div className="mt-2 grid gap-2 rounded-md bg-muted/40 p-2 text-xs sm:grid-cols-4">
                      <span>
                        Open app: {get(job, "conversions.openApp", 0)}
                      </span>
                      <span>
                        Water: {get(job, "conversions.waterLog", 0)}
                      </span>
                      <span>Meal: {get(job, "conversions.mealLog", 0)}</span>
                      <span>
                        Workout: {get(job, "conversions.workoutDone", 0)}
                      </span>
                    </div>
                  ) : null}
                  {job.error ? (
                    <p className="mt-2 text-xs text-destructive">{job.error}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Broadcast joblar hali yaratilmagan.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <div>
              <CardTitle>Telegram support inbox</CardTitle>
              <CardDescription>
                Botdagi /support yoki Yordam orqali ochilgan so'rovlar.
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant="secondary">
                {get(supportInbox, "openCount", 0)} open
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            {supportTickets.length ? (
              map(supportTickets, (ticket) => (
                <div key={ticket.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {get(ticket, "user.profile.firstName") ||
                          ticket.user?.email ||
                          ticket.user?.phone ||
                          ticket.telegramId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Telegram ID: {ticket.telegramId}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(ticket.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {ticket.message || "Message kiritilmagan."}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Open support ticketlar yo'q.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="py-6">
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
                  className={cn(
                    "size-4",
                    usersQuery.isFetching && "animate-spin",
                  )}
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
