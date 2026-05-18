import React from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { get, includes, isArray, join, some, trim, filter, find, map, toNumber } from "lodash";
import {
  ActivityIcon,
  ArrowLeftIcon,
  BanIcon,
  CalendarClockIcon,
  CreditCardIcon,
  DropletsIcon,
  DumbbellIcon,
  FileTextIcon,
  GiftIcon,
  HeartPulseIcon,
  Loader2Icon,
  NotebookTextIcon,
  PencilIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  RulerIcon,
  ShieldIcon,
  SparklesIcon,
  Trash2Icon,
  UserRoundIcon,
  UtensilsIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { cn } from "@/lib/utils";
import { AdminConfirmDialog } from "@/modules/admin/components/admin-confirm-dialog.jsx";
import SafeAdminText from "@/modules/admin/components/safe-admin-text.jsx";
import { UserBlockAlert } from "@/modules/admin/components/user-block-alert.jsx";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { useBreadcrumbStore } from "@/store";
import GiftPremiumDrawer from "../components/gift-premium-drawer.jsx";
import { DetailSection, DetailStatCard } from "../components/detail-cards.jsx";
import {
  PRIVILEGED_ROLES,
  formatCurrency,
  formatDateTime,
  formatMetricValue,
  formatNumber,
  formatUserAgentLabel,
  getAvatarColor,
  getInitials,
  premiumStatusConfig,
  roleBgColors,
  roleLabels,
  sessionStatusConfig,
  statusConfig,
} from "../config.js";

const TIMELINE_OPTIONS = [
  { value: "activity", label: "Activity" },
  { value: "tracking", label: "Tracking" },
  { value: "subscription", label: "Subscription" },
  { value: "report", label: "Reports" },
  { value: "note", label: "Notes" },
  { value: "admin_action", label: "Admin actions" },
  { value: "session", label: "Sessions" },
  { value: "all", label: "All events" },
];

const timelineToneClass = {
  amber:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  green:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  orange:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  red: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  slate:
    "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800",
  violet:
    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
};

const timelineIconByType = {
  account: UserRoundIcon,
  admin_action: ShieldIcon,
  admin_note: NotebookTextIcon,
  daily_log: ActivityIcon,
  meal: UtensilsIcon,
  meal_plan: FileTextIcon,
  measurement: RulerIcon,
  onboarding_report: SparklesIcon,
  payment: CreditCardIcon,
  plan_generation: SparklesIcon,
  session: ShieldIcon,
  status_history: ShieldIcon,
  subscription: CreditCardIcon,
  user_ai_report: SparklesIcon,
  water: DropletsIcon,
  workout: DumbbellIcon,
  workout_plan: DumbbellIcon,
};

const hasOwn = (value, key) =>
  value &&
  typeof value === "object" &&
  Object.prototype.hasOwnProperty.call(value, key);

const unwrapAdminResponse = (response) => {
  const body = get(response, "data", response);

  if (!body || typeof body !== "object") {
    return body ?? {};
  }

  if (hasOwn(body, "data")) {
    return body.data;
  }

  return body;
};

const getAdminResponseMeta = (response) => get(response, "data.meta", {});

const normalizeAdminUserDetailResponse = (response) => {
  const payload = unwrapAdminResponse(response);

  return {
    user: get(payload, "user", null),
    stats: get(payload, "stats", {}),
  };
};

const normalizeCollectionResponse = (response) => {
  const payload = unwrapAdminResponse(response);

  if (isArray(payload)) {
    return payload;
  }

  return get(payload, "data", []);
};

const getDisplayName = (user) =>
  trim(`${get(user, "firstName", "")} ${get(user, "lastName", "")}`) ||
  get(user, "displayName") ||
  get(user, "email") ||
  get(user, "phone") ||
  "Foydalanuvchi";

const getArrayLabel = (value) => {
  if (!isArray(value) || value.length === 0) return "-";
  return join(value, ", ");
};

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const isPrivilegedUser = (user) =>
  some(get(user, "roles", [get(user, "role")]), (role) =>
    includes(PRIVILEGED_ROLES, role),
  );

const getLatestPremiumSubscription = (items) =>
  find(items, (item) => item.status === "active") ?? items[0] ?? null;

const EmptyState = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border/50 py-2.5 last:border-b-0">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="max-w-[62%] break-words text-right text-sm font-medium text-foreground">
      {value || "-"}
    </span>
  </div>
);

const TimelineEvent = ({ event }) => {
  const Icon = timelineIconByType[event.type] ?? CalendarClockIcon;
  const toneClass = timelineToneClass[event.tone] ?? timelineToneClass.slate;

  return (
    <article className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
      <div className="flex gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            toneClass,
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h4 className="text-sm font-semibold tracking-tight">
              {event.title}
            </h4>
            <time className="text-xs font-medium text-muted-foreground">
              {formatDateTime(event.occurredAt)}
            </time>
          </div>
          <SafeAdminText
            as="p"
            className="text-sm leading-5 text-muted-foreground"
            value={event.summary}
          />
        </div>
      </div>
    </article>
  );
};

const TimelineList = ({ events, meta, isLoading }) => (
  <DetailSection
    title="Support timeline"
    description={`${formatNumber(get(meta, "total", 0))} ta support event`}
  >
    {isLoading ? (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner className="size-7 text-muted-foreground" />
      </div>
    ) : events.length ? (
      <div className="grid gap-3">
        {map(events, (event) => (
          <TimelineEvent key={event.id} event={event} />
        ))}
      </div>
    ) : (
      <EmptyState>Timeline eventlari topilmadi.</EmptyState>
    )}
  </DetailSection>
);

const RecentLogCard = ({ log }) => (
  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold">{log.date}</p>
      <Badge variant="outline">{formatNumber(log.calories)} kkal</Badge>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
      <span>{formatNumber(log.steps)} qadam</span>
      <span>{formatNumber(log.waterMl)} ml suv</span>
      <span>{formatNumber(log.mealCount)} meal</span>
      <span>{formatMetricValue(log.sleepHours, " soat")}</span>
    </div>
  </div>
);

const ReportPreview = ({ report }) => {
  if (report.sensitiveDataMasked) {
    return (
      <EmptyState>
        Report matni sensitive permission yo'qligi sababli maskalangan.
      </EmptyState>
    );
  }

  const payload = report.report ?? {};
  const preview =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);

  return (
    <pre className="max-h-72 overflow-auto rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs leading-5">
      {preview || "Report body topilmadi."}
    </pre>
  );
};

const ReportCard = ({ report, type }) => (
  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-semibold">
          {type === "ai"
            ? `${report.period} report`
            : `Onboarding v${report.version}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {type === "ai"
            ? `${report.startDate} - ${report.endDate}`
            : `${report.source} - ${report.language}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {report.status ? (
          <Badge variant="outline">{report.status}</Badge>
        ) : null}
        {report.model ? (
          <Badge variant="secondary">{report.model}</Badge>
        ) : null}
        <Badge variant="outline">{formatDateTime(report.createdAt)}</Badge>
      </div>
    </div>
    <div className="mt-4">
      <ReportPreview report={report} />
    </div>
  </div>
);

const TimelineFilter = ({ value, onValueChange, disabled }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-muted-foreground">
      Eventlar backenddagi timeline type filter orqali olinadi.
    </p>
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full sm:w-56">
        <SelectValue placeholder="Timeline turi" />
      </SelectTrigger>
      <SelectContent>
        {map(TIMELINE_OPTIONS, (item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const UserDetailView = ({ userId, surface = "page", onClose }) => {
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    isSuperAdmin,
    canManageSupport,
    canBlockUsers,
    canRevokeUserSessions,
    canManageGrowth,
    canGiftPremium,
  } = useAdminPermissions();

  const [activeTab, setActiveTab] = React.useState("profile");
  const [timelineType, setTimelineType] = React.useState("activity");
  const [noteDraft, setNoteDraft] = React.useState("");
  const [editingNoteId, setEditingNoteId] = React.useState(null);
  const [editingNoteContent, setEditingNoteContent] = React.useState("");
  const [giftUser, setGiftUser] = React.useState(null);
  const [blockCandidate, setBlockCandidate] = React.useState(null);
  const [cancelCandidate, setCancelCandidate] = React.useState(null);
  const [sessionRevokeCandidate, setSessionRevokeCandidate] =
    React.useState(null);
  const [extendDialog, setExtendDialog] = React.useState({
    open: false,
    subscriptionId: null,
  });
  const [extendDays, setExtendDays] = React.useState(30);

  const queryRoot = React.useMemo(() => ["admin", "users", userId], [userId]);
  const timelineParams = React.useMemo(
    () => ({
      pageSize: 50,
      ...(timelineType === "all" ? {} : { type: timelineType }),
    }),
    [timelineType],
  );

  const detailQuery = useGetQuery({
    url: `/admin/users/${userId}`,
    queryProps: {
      queryKey: [...queryRoot, "detail"],
      enabled: Boolean(userId),
    },
  });
  const timelineQuery = useGetQuery({
    url: `/admin/users/${userId}/timeline`,
    params: timelineParams,
    queryProps: {
      queryKey: [...queryRoot, "timeline", timelineParams],
      enabled: Boolean(userId),
    },
  });
  const sessionsQuery = useGetQuery({
    url: `/admin/users/${userId}/sessions`,
    params: { pageSize: 50 },
    queryProps: {
      queryKey: [...queryRoot, "sessions"],
      enabled: Boolean(userId),
    },
  });
  const notesQuery = useGetQuery({
    url: `/admin/users/${userId}/notes`,
    queryProps: {
      queryKey: [...queryRoot, "notes"],
      enabled: Boolean(userId),
    },
  });
  const reportsQuery = useGetQuery({
    url: `/admin/users/${userId}/reports`,
    queryProps: {
      queryKey: [...queryRoot, "reports"],
      enabled: Boolean(userId),
    },
  });

  const { user, stats } = normalizeAdminUserDetailResponse(detailQuery.data);
  const timeline = normalizeCollectionResponse(timelineQuery.data);
  const timelineMeta = getAdminResponseMeta(timelineQuery.data);
  const sessions = normalizeCollectionResponse(sessionsQuery.data);
  const notes = normalizeCollectionResponse(notesQuery.data);
  const reportsPayload = unwrapAdminResponse(reportsQuery.data);
  const onboardingReports = get(reportsPayload, "onboardingReports", []);
  const aiReports = get(reportsPayload, "aiReports", []);
  const reportsMeta = getAdminResponseMeta(reportsQuery.data);
  const displayName = getDisplayName(user);
  const roles = get(user, "roles", []);
  const status = get(statusConfig, get(user, "status"), null);
  const premium = get(user, "premium.status")
    ? get(premiumStatusConfig, get(user, "premium.status"), null)
    : null;
  const onboarding = get(user, "onboarding", null);
  const healthGoal = get(user, "healthGoal", null);
  const paymentSummary = get(user, "paymentSummary", {});
  const recentPayments = get(paymentSummary, "recent", []);
  const premiumHistory = get(user, "premiumHistory", []);
  const latestPremiumSubscription =
    getLatestPremiumSubscription(premiumHistory);
  const measurementSummary = get(user, "measurementSummary", {});
  const recentDailyLogs = get(user, "recentDailyLogs", []);
  const hasPrivilegedRole = isPrivilegedUser(user);
  const canManageThisUser =
    Boolean(user) && canManageSupport && (isSuperAdmin || !hasPrivilegedRole);
  const canBlockThisUser =
    Boolean(user) && canBlockUsers && (isSuperAdmin || !hasPrivilegedRole);
  const canGiftThisUser = Boolean(user) && canGiftPremium && !hasPrivilegedRole;

  const updateMutation = usePatchQuery({
    queryKey: queryRoot,
    listKey: ["admin-users"],
  });
  const createNoteMutation = usePostQuery({
    queryKey: queryRoot,
    listKey: ["admin-users"],
  });
  const updateNoteMutation = usePatchQuery({
    queryKey: queryRoot,
    listKey: ["admin-users"],
  });
  const deleteNoteMutation = useDeleteQuery({
    queryKey: queryRoot,
    listKey: ["admin-users"],
  });
  const revokeSessionMutation = usePatchQuery({
    queryKey: queryRoot,
    listKey: ["admin-users"],
  });
  const premiumMutation = usePatchQuery({
    queryKey: queryRoot,
    listKey: ["admin-users"],
  });

  const invalidateUserQueries = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryRoot }),
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  }, [queryClient, queryRoot]);

  React.useEffect(() => {
    if (surface !== "page") return;

    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/users/list", title: "Foydalanuvchilar" },
      { url: `/admin/users/${userId}`, title: displayName },
    ]);
  }, [displayName, setBreadcrumbs, surface, userId]);

  const handleRefresh = React.useCallback(() => {
    detailQuery.refetch();
    timelineQuery.refetch();
    sessionsQuery.refetch();
    notesQuery.refetch();
    reportsQuery.refetch();
  }, [detailQuery, notesQuery, reportsQuery, sessionsQuery, timelineQuery]);

  const handleTabChange = React.useCallback((nextTab) => {
    setActiveTab(nextTab);

    if (nextTab === "activity") setTimelineType("activity");
    if (nextTab === "subscription") setTimelineType("subscription");
    if (nextTab === "reports") setTimelineType("report");
    if (nextTab === "notes") setTimelineType("admin_action");
    if (nextTab === "sessions") setTimelineType("session");
  }, []);

  const confirmBlockToggle = React.useCallback(async () => {
    if (!canBlockThisUser || !blockCandidate) return;

    const isBlocked = blockCandidate.status === "banned";

    try {
      await updateMutation.mutateAsync({
        url: `/admin/users/${blockCandidate.id}/${isBlocked ? "unblock" : "block"}`,
        attributes: {},
      });
      toast.success(
        isBlocked
          ? "Foydalanuvchi blokdan chiqarildi"
          : "Foydalanuvchi bloklandi",
      );
      setBlockCandidate(null);
      await invalidateUserQueries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Statusni yangilab bo'lmadi"));
    }
  }, [blockCandidate, canBlockThisUser, invalidateUserQueries, updateMutation]);

  const handleCreateNote = React.useCallback(async () => {
    const content = trim(noteDraft);

    if (!canManageSupport || !content) return;

    try {
      await createNoteMutation.mutateAsync({
        url: `/admin/users/${userId}/notes`,
        attributes: { content },
      });
      toast.success("Note qo'shildi");
      setNoteDraft("");
      await invalidateUserQueries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Note qo'shib bo'lmadi"));
    }
  }, [
    canManageSupport,
    createNoteMutation,
    invalidateUserQueries,
    noteDraft,
    userId,
  ]);

  const handleStartEditNote = React.useCallback((note) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content ?? "");
  }, []);

  const handleUpdateNote = React.useCallback(async () => {
    const content = trim(editingNoteContent);

    if (!canManageSupport || !editingNoteId || !content) return;

    try {
      await updateNoteMutation.mutateAsync({
        url: `/admin/users/${userId}/notes/${editingNoteId}`,
        attributes: { content },
      });
      toast.success("Note yangilandi");
      setEditingNoteId(null);
      setEditingNoteContent("");
      await invalidateUserQueries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Note yangilab bo'lmadi"));
    }
  }, [
    canManageSupport,
    editingNoteContent,
    editingNoteId,
    invalidateUserQueries,
    updateNoteMutation,
    userId,
  ]);

  const handleDeleteNote = React.useCallback(
    async (note) => {
      if (!canManageSupport || !note?.id) return;

      try {
        await deleteNoteMutation.mutateAsync({
          url: `/admin/users/${userId}/notes/${note.id}`,
        });
        toast.success("Note o'chirildi");
        await invalidateUserQueries();
      } catch (error) {
        toast.error(getErrorMessage(error, "Note o'chirib bo'lmadi"));
      }
    },
    [canManageSupport, deleteNoteMutation, invalidateUserQueries, userId],
  );

  const confirmRevokeSession = React.useCallback(async () => {
    if (!canRevokeUserSessions || !sessionRevokeCandidate) return;

    try {
      if (sessionRevokeCandidate.type === "all") {
        await revokeSessionMutation.mutateAsync({
          url: `/admin/users/${userId}/sessions/revoke-all`,
          attributes: {},
        });
      } else {
        await revokeSessionMutation.mutateAsync({
          url: `/admin/users/${userId}/sessions/${sessionRevokeCandidate.session.id}/revoke`,
          attributes: {},
        });
      }
      toast.success("Sessiya bekor qilindi");
      setSessionRevokeCandidate(null);
      await invalidateUserQueries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Sessiyani bekor qilib bo'lmadi"));
    }
  }, [
    canRevokeUserSessions,
    invalidateUserQueries,
    revokeSessionMutation,
    sessionRevokeCandidate,
    userId,
  ]);

  const handleExtendPremium = React.useCallback(async () => {
    if (!canManageGrowth || !extendDialog.subscriptionId) return;

    try {
      const days = toNumber(extendDays);
      await premiumMutation.mutateAsync({
        url: `/admin/premium/subscriptions/${extendDialog.subscriptionId}/extend`,
        attributes: days ? { days } : {},
      });
      toast.success("Obuna muddati uzaytirildi");
      setExtendDialog({ open: false, subscriptionId: null });
      setExtendDays(30);
      await invalidateUserQueries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Premiumni uzaytirib bo'lmadi"));
    }
  }, [
    canManageGrowth,
    extendDays,
    extendDialog.subscriptionId,
    invalidateUserQueries,
    premiumMutation,
  ]);

  const confirmCancelPremium = React.useCallback(async () => {
    if (!canManageGrowth || !cancelCandidate?.id) return;

    try {
      await premiumMutation.mutateAsync({
        url: `/admin/premium/subscriptions/${cancelCandidate.id}/cancel`,
        attributes: {},
      });
      toast.success("Obuna bekor qilindi");
      setCancelCandidate(null);
      await invalidateUserQueries();
    } catch (error) {
      toast.error(getErrorMessage(error, "Premiumni bekor qilib bo'lmadi"));
    }
  }, [
    canManageGrowth,
    cancelCandidate,
    invalidateUserQueries,
    premiumMutation,
  ]);

  const isFetching =
    detailQuery.isFetching ||
    timelineQuery.isFetching ||
    sessionsQuery.isFetching ||
    notesQuery.isFetching ||
    reportsQuery.isFetching;
  const isLoading = detailQuery.isLoading || !user;

  const header = (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-sm",
            getAvatarColor(get(user, "id")),
          )}
        >
          {getInitials(get(user, "firstName"), get(user, "lastName")) || "U"}
        </div>
        <div className="min-w-0 space-y-2">
          {surface === "page" ? (
            <Button variant="ghost" asChild className="mb-1 w-fit px-0">
              <Link to="/admin/users/list">
                <ArrowLeftIcon data-icon="inline-start" />
                Listga qaytish
              </Link>
            </Button>
          ) : null}
          {surface === "drawer" ? (
            <>
              <DrawerTitle className="text-xl font-semibold">
                {isLoading ? "Foydalanuvchi yuklanmoqda" : displayName}
              </DrawerTitle>
              <DrawerDescription className="break-words">
                {filter([get(user, "email"), get(user, "phone")], Boolean)
                  .join(" - ") || "User support console"}
              </DrawerDescription>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isLoading ? "Foydalanuvchi yuklanmoqda" : displayName}
              </h1>
              <p className="break-words text-sm text-muted-foreground">
                {filter([get(user, "email"), get(user, "phone")], Boolean)
                  .join(" - ") || userId}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {status ? (
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            ) : null}
            {premium ? (
              <Badge variant="outline" className={premium.className}>
                {premium.label}
              </Badge>
            ) : null}
            {map(roles, (role) => (
              <Badge
                key={role}
                variant="outline"
                className={roleBgColors[role]}
              >
                {roleLabels[role] ?? role}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCwIcon
            data-icon="inline-start"
            className={cn(isFetching && "animate-spin")}
          />
          Yangilash
        </Button>
        {canManageThisUser ? (
          <Button variant="outline" asChild className="gap-2">
            <Link to={`/admin/users/list/edit/${userId}`}>
              <PencilIcon data-icon="inline-start" />
              Tahrirlash
            </Link>
          </Button>
        ) : null}
        {canGiftThisUser ? (
          <Button
            variant="outline"
            onClick={() => setGiftUser(user)}
            className="gap-2"
          >
            <GiftIcon data-icon="inline-start" />
            Premium sovg'a
          </Button>
        ) : null}
        {canBlockThisUser ? (
          <Button
            variant={
              get(user, "status") === "banned" ? "outline" : "destructive"
            }
            onClick={() => setBlockCandidate(user)}
            className="gap-2"
          >
            <BanIcon data-icon="inline-start" />
            {get(user, "status") === "banned"
              ? "Blokdan chiqarish"
              : "Bloklash"}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const body = isLoading ? (
    <div className="flex min-h-80 items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  ) : (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-5">
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="health">Health</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="notes">Notes & Logs</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailStatCard
            icon={ActivityIcon}
            label="Tracking kunlari"
            value={formatNumber(stats.trackedDays)}
            hint="Daily logs bo'yicha"
            tone="bg-teal-500/10 text-teal-700 dark:text-teal-400"
          />
          <DetailStatCard
            icon={HeartPulseIcon}
            label="Joriy streak"
            value={`${formatNumber(stats.currentStreak)} kun`}
            hint="Ketma-ket aktiv kunlar"
            tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          />
          <DetailStatCard
            icon={ShieldIcon}
            label="Faol sessiyalar"
            value={formatNumber(stats.activeSessions)}
            hint={`${formatNumber(stats.totalSessions)} jami sessiya`}
            tone="bg-blue-500/10 text-blue-700 dark:text-blue-400"
          />
          <DetailStatCard
            icon={CreditCardIcon}
            label="To'langan summa"
            value={formatCurrency(paymentSummary.totalSpent)}
            hint={`${formatNumber(paymentSummary.completedCount)} completed payment`}
            tone="bg-amber-500/10 text-amber-700 dark:text-amber-400"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <DetailSection
            title="Account"
            description="Support uchun asosiy profil va access ma'lumotlari."
          >
            <InfoRow label="User ID" value={user.id} />
            <InfoRow label="Username" value={user.username} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Telefon" value={user.phone} />
            <InfoRow label="Til" value={get(user, "settings.language")} />
            <InfoRow label="Timezone" value={get(user, "settings.timezone")} />
            <InfoRow
              label="Yaratilgan"
              value={formatDateTime(user.createdAt)}
            />
            <InfoRow
              label="Oxirgi aktivlik"
              value={formatDateTime(user.lastActive)}
            />
          </DetailSection>

          <DetailSection
            title="Support status"
            description="Admin status, role va premium signallari."
          >
            <InfoRow label="Status" value={get(user, "status")} />
            <InfoRow label="Premium" value={get(user, "premium.status")} />
            <InfoRow
              label="Premium plan"
              value={get(user, "premium.planName")}
            />
            <InfoRow
              label="Premium tugashi"
              value={get(user, "premium.endDate")}
            />
            <InfoRow
              label="Public profile"
              value={String(get(user, "settings.profilePublic", "-"))}
            />
            <InfoRow
              label="Messages"
              value={String(get(user, "settings.allowMessages", "-"))}
            />
          </DetailSection>
        </div>

        <DetailSection
          title="Onboarding"
          description="Foydalanuvchi boshlang'ich profil konteksti."
        >
          {onboarding ? (
            <div className="grid gap-x-8 md:grid-cols-2">
              <InfoRow label="Ism" value={get(onboarding, "firstName")} />
              <InfoRow label="Familiya" value={get(onboarding, "lastName")} />
              <InfoRow label="Gender" value={get(onboarding, "gender")} />
              <InfoRow label="Yosh" value={get(onboarding, "age")} />
              <InfoRow label="Maqsad" value={get(onboarding, "goal")} />
              <InfoRow
                label="Activity"
                value={get(onboarding, "activityLevel")}
              />
              <InfoRow
                label="Meal frequency"
                value={get(onboarding, "mealFrequency")}
              />
              <InfoRow
                label="Tugagan"
                value={formatDateTime(get(onboarding, "completedAt"))}
              />
            </div>
          ) : (
            <EmptyState>Onboarding ma'lumotlari topilmadi.</EmptyState>
          )}
        </DetailSection>
      </TabsContent>

      <TabsContent value="health" className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailStatCard
            icon={DropletsIcon}
            label="Jami suv"
            value={`${formatNumber(stats.totalWaterMl)} ml`}
            hint={`Target: ${formatNumber(get(healthGoal, "waterMl"))} ml`}
            tone="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
          />
          <DetailStatCard
            icon={UtensilsIcon}
            label="Meal loglar"
            value={formatNumber(stats.totalMealsLogged)}
            hint="Foydalanuvchi kiritgan meal itemlar"
            tone="bg-orange-500/10 text-orange-700 dark:text-orange-400"
          />
          <DetailStatCard
            icon={ActivityIcon}
            label="O'rtacha qadam"
            value={formatNumber(stats.avgDailySteps)}
            hint={`Target: ${formatNumber(get(healthGoal, "steps"))} qadam`}
            tone="bg-blue-500/10 text-blue-700 dark:text-blue-400"
          />
          <DetailStatCard
            icon={DumbbellIcon}
            label="Workout"
            value={`${formatNumber(stats.avgWorkoutMinutes)} min`}
            hint={`${formatNumber(stats.avgBurnedCalories)} kkal avg burn`}
            tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <DetailSection
            title="Health goal"
            description="Joriy nutrition va activity targetlari."
          >
            {healthGoal ? (
              <>
                <InfoRow
                  label="Calories"
                  value={formatMetricValue(
                    get(healthGoal, "calories"),
                    " kkal",
                  )}
                />
                <InfoRow
                  label="Protein"
                  value={formatMetricValue(get(healthGoal, "protein"), " g")}
                />
                <InfoRow
                  label="Carbs"
                  value={formatMetricValue(get(healthGoal, "carbs"), " g")}
                />
                <InfoRow
                  label="Fat"
                  value={formatMetricValue(get(healthGoal, "fat"), " g")}
                />
                <InfoRow
                  label="Fiber"
                  value={formatMetricValue(get(healthGoal, "fiber"), " g")}
                />
                <InfoRow
                  label="Water"
                  value={formatMetricValue(get(healthGoal, "waterMl"), " ml")}
                />
                <InfoRow
                  label="Steps"
                  value={formatMetricValue(get(healthGoal, "steps"), " qadam")}
                />
                <InfoRow
                  label="Sleep"
                  value={formatMetricValue(
                    get(healthGoal, "sleepHours"),
                    " soat",
                  )}
                />
              </>
            ) : (
              <EmptyState>Health goal hali mavjud emas.</EmptyState>
            )}
          </DetailSection>

          <DetailSection
            title="Measurements"
            description="Oxirgi tana o'lchovlari va weight trend."
          >
            <InfoRow
              label="Jami o'lchov"
              value={formatNumber(get(measurementSummary, "total"))}
            />
            <InfoRow
              label="Oxirgi vazn"
              value={formatMetricValue(
                get(measurementSummary, "latest.weight"),
                " kg",
              )}
            />
            <InfoRow
              label="Trend"
              value={formatMetricValue(get(measurementSummary, "trend"), " kg")}
            />
            <InfoRow
              label="Bel"
              value={formatMetricValue(
                get(measurementSummary, "latest.waist"),
                " cm",
              )}
            />
            <InfoRow
              label="Chest"
              value={formatMetricValue(
                get(measurementSummary, "latest.chest"),
                " cm",
              )}
            />
            <InfoRow
              label="Body fat"
              value={formatMetricValue(
                get(measurementSummary, "latest.bodyFat"),
                "%",
              )}
            />
          </DetailSection>
        </div>

        <DetailSection
          title="Preferences"
          description="Onboardingdagi diet va restriction signallari."
        >
          {onboarding ? (
            <div className="grid gap-x-8 md:grid-cols-2">
              <InfoRow
                label="Diet restrictions"
                value={getArrayLabel(get(onboarding, "dietRestrictions"))}
              />
              <InfoRow
                label="Allergy ingredient IDs"
                value={getArrayLabel(get(onboarding, "allergyIngredientIds"))}
              />
              <InfoRow
                label="Disliked ingredient IDs"
                value={getArrayLabel(get(onboarding, "dislikedIngredientIds"))}
              />
              <InfoRow
                label="Nutrition preferences"
                value={getArrayLabel(
                  get(onboarding, "nutritionPreferenceKeys"),
                )}
              />
              <InfoRow
                label="Allergy other"
                value={get(onboarding, "allergyOtherText")}
              />
              <InfoRow
                label="Disliked other"
                value={get(onboarding, "dislikedOtherText")}
              />
            </div>
          ) : (
            <EmptyState>Preference ma'lumotlari topilmadi.</EmptyState>
          )}
        </DetailSection>
      </TabsContent>

      <TabsContent value="activity" className="space-y-5">
        <TimelineFilter
          value={timelineType}
          onValueChange={setTimelineType}
          disabled={timelineQuery.isFetching}
        />
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <DetailSection
            title="So'nggi daily loglar"
            description="Oxirgi 7 tracking kuni bo'yicha support snapshot."
          >
            {recentDailyLogs.length ? (
              <div className="grid gap-3">
                {map(recentDailyLogs, (log) => (
                  <RecentLogCard key={log.id} log={log} />
                ))}
              </div>
            ) : (
              <EmptyState>Daily tracking hali yo'q.</EmptyState>
            )}
          </DetailSection>
          <TimelineList
            events={timeline}
            meta={timelineMeta}
            isLoading={timelineQuery.isLoading}
          />
        </div>
      </TabsContent>

      <TabsContent value="subscription" className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {canGiftThisUser ? (
            <Button
              variant="outline"
              onClick={() => setGiftUser(user)}
              className="gap-2"
            >
              <GiftIcon data-icon="inline-start" />
              Premium sovg'a qilish
            </Button>
          ) : null}
          {canManageGrowth && latestPremiumSubscription ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setExtendDialog({
                    open: true,
                    subscriptionId: latestPremiumSubscription.id,
                  });
                  setExtendDays(30);
                }}
                className="gap-2"
              >
                <RotateCcwIcon data-icon="inline-start" />
                Uzaytirish
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCancelCandidate(latestPremiumSubscription)}
                className="gap-2"
              >
                <XCircleIcon data-icon="inline-start" />
                Bekor qilish
              </Button>
            </>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <DetailSection
            title="Payment summary"
            description="Completed payment aggregate."
          >
            <InfoRow
              label="Total spent"
              value={formatCurrency(get(paymentSummary, "totalSpent", 0))}
            />
            <InfoRow
              label="Completed payments"
              value={formatNumber(get(paymentSummary, "completedCount", 0))}
            />
            <InfoRow
              label="Last paid"
              value={formatDateTime(get(paymentSummary, "lastPaidAt"))}
            />
            <InfoRow
              label="Current plan"
              value={get(user, "premium.planName")}
            />
            <InfoRow label="Premium end" value={get(user, "premium.endDate")} />
          </DetailSection>

          <DetailSection
            title="Recent payments"
            description="Oxirgi payment eventlari."
          >
            {recentPayments.length ? (
              <div className="grid gap-3">
                {map(recentPayments, (payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{payment.type}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(payment.date ?? payment.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{payment.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {payment.method || "manual"}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Payment history topilmadi.</EmptyState>
            )}
          </DetailSection>
        </div>

        <DetailSection
          title="Premium history"
          description="Subscription lifecycle entries."
        >
          {premiumHistory.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {map(premiumHistory, (subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {subscription.planName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {subscription.startDate} - {subscription.endDate}
                      </p>
                    </div>
                    <Badge variant="outline">{subscription.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {formatCurrency(subscription.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>Premium history topilmadi.</EmptyState>
          )}
        </DetailSection>
      </TabsContent>

      <TabsContent value="reports" className="space-y-5">
        <DetailSection
          title="Reports summary"
          description={`${formatNumber(get(reportsMeta, "onboardingReports", 0))} onboarding report, ${formatNumber(get(reportsMeta, "aiReports", 0))} AI report`}
        >
          {get(reportsMeta, "privacy.sensitiveDataMasked") ? (
            <p className="text-sm text-muted-foreground">
              Sensitive report bodylari maskalangan. Summary metadata ko'rinadi.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Existing onboarding va user AI reportlar read-only ko'rinishda.
            </p>
          )}
        </DetailSection>

        <div className="grid gap-5 xl:grid-cols-2">
          <DetailSection
            title="Onboarding reports"
            description="Existing onboarding report history."
          >
            {reportsQuery.isLoading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Spinner className="size-7 text-muted-foreground" />
              </div>
            ) : onboardingReports.length ? (
              <div className="grid gap-3">
                {map(onboardingReports, (report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    type="onboarding"
                  />
                ))}
              </div>
            ) : (
              <EmptyState>Onboarding report topilmadi.</EmptyState>
            )}
          </DetailSection>

          <DetailSection
            title="AI reports"
            description="Existing user AI report history."
          >
            {reportsQuery.isLoading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Spinner className="size-7 text-muted-foreground" />
              </div>
            ) : aiReports.length ? (
              <div className="grid gap-3">
                {map(aiReports, (report) => (
                  <ReportCard key={report.id} report={report} type="ai" />
                ))}
              </div>
            ) : (
              <EmptyState>AI report topilmadi.</EmptyState>
            )}
          </DetailSection>
        </div>
      </TabsContent>

      <TabsContent value="notes" className="space-y-5">
        <TimelineFilter
          value={timelineType}
          onValueChange={setTimelineType}
          disabled={timelineQuery.isFetching}
        />
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <DetailSection
            title="Admin notes"
            description="Ichki support notelar."
          >
            {canManageSupport ? (
              <div className="mb-4 space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <Label htmlFor="admin-user-note">Yangi note</Label>
                <Textarea
                  id="admin-user-note"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Support note yozing..."
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {noteDraft.length}/2000
                  </span>
                  <Button
                    onClick={handleCreateNote}
                    disabled={!trim(noteDraft) || createNoteMutation.isPending}
                  >
                    {createNoteMutation.isPending ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <NotebookTextIcon data-icon="inline-start" />
                    )}
                    Note qo'shish
                  </Button>
                </div>
              </div>
            ) : null}

            {notesQuery.isLoading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Spinner className="size-7 text-muted-foreground" />
              </div>
            ) : notes.length ? (
              <div className="grid gap-3">
                {map(notes, (note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {note.adminName || "Admin"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(note.updatedAt)}
                        </p>
                      </div>
                      {canManageSupport ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleStartEditNote(note)}
                          >
                            <PencilIcon data-icon="standalone" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteNote(note)}
                            disabled={deleteNoteMutation.isPending}
                          >
                            <Trash2Icon data-icon="standalone" />
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(event) =>
                            setEditingNoteContent(event.target.value)
                          }
                          rows={3}
                          maxLength={2000}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingNoteContent("");
                            }}
                          >
                            Bekor qilish
                          </Button>
                          <Button
                            onClick={handleUpdateNote}
                            disabled={
                              !trim(editingNoteContent) ||
                              updateNoteMutation.isPending
                            }
                          >
                            Saqlash
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <SafeAdminText
                        as="p"
                        value={note.content}
                        className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Admin note topilmadi.</EmptyState>
            )}
          </DetailSection>

          <TimelineList
            events={timeline}
            meta={timelineMeta}
            isLoading={timelineQuery.isLoading}
          />
        </div>
      </TabsContent>

      <TabsContent value="sessions" className="space-y-5">
        <div className="flex justify-end">
          {canRevokeUserSessions ? (
            <Button
              variant="destructive"
              onClick={() => setSessionRevokeCandidate({ type: "all" })}
              disabled={
                !some(sessions, (session) => session.status === "active")
              }
              className="gap-2"
            >
              <ShieldIcon data-icon="inline-start" />
              Barcha sessiyalarni bekor qilish
            </Button>
          ) : null}
        </div>

        <DetailSection
          title="Sessions"
          description="Auth sessionlar va revoke holati."
        >
          {sessionsQuery.isLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner className="size-7 text-muted-foreground" />
            </div>
          ) : sessions.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {map(sessions, (session) => {
                    const sessionStatus = get(
                      sessionStatusConfig,
                      session.status,
                    );
                    return (
                      <TableRow key={session.id}>
                        <TableCell className="min-w-48">
                          {formatUserAgentLabel(session.userAgent)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={sessionStatus?.className}
                          >
                            {sessionStatus?.label ?? session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{session.ipAddress || "-"}</TableCell>
                        <TableCell>
                          {formatDateTime(session.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(session.lastSeenAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {canRevokeUserSessions &&
                          session.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSessionRevokeCandidate({
                                  type: "single",
                                  session,
                                })
                              }
                            >
                              Bekor qilish
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState>Sessiyalar topilmadi.</EmptyState>
          )}
        </DetailSection>
      </TabsContent>
    </Tabs>
  );

  const dialogs = (
    <>
      <UserBlockAlert
        user={blockCandidate}
        open={Boolean(blockCandidate)}
        onOpenChange={(open) => !open && setBlockCandidate(null)}
        onConfirm={confirmBlockToggle}
        isPending={updateMutation.isPending}
      />

      <GiftPremiumDrawer
        user={giftUser}
        open={Boolean(giftUser)}
        onOpenChange={(open) => {
          if (!open) setGiftUser(null);
        }}
        queryKey={queryRoot}
        listKey={["admin-users"]}
        onGifted={invalidateUserQueries}
      />

      <AdminConfirmDialog
        open={Boolean(cancelCandidate)}
        onOpenChange={(open) => !open && setCancelCandidate(null)}
        title="Premium obunani bekor qilish"
        description={`"${displayName}" foydalanuvchisining premium obunasi bekor qilinadi.`}
        confirmText="Bekor qilish"
        variant="destructive"
        isPending={premiumMutation.isPending}
        onConfirm={confirmCancelPremium}
      />

      <AdminConfirmDialog
        open={Boolean(sessionRevokeCandidate)}
        onOpenChange={(open) => !open && setSessionRevokeCandidate(null)}
        title={
          sessionRevokeCandidate?.type === "all"
            ? "Barcha sessiyalarni bekor qilish"
            : "Sessiyani bekor qilish"
        }
        description={
          sessionRevokeCandidate?.type === "all"
            ? `"${displayName}" foydalanuvchisining barcha faol sessiyalari bekor qilinadi.`
            : "Tanlangan faol sessiya bekor qilinadi."
        }
        confirmText="Bekor qilish"
        variant="destructive"
        isPending={revokeSessionMutation.isPending}
        onConfirm={confirmRevokeSession}
      />

      <Dialog
        open={extendDialog.open}
        onOpenChange={(open) =>
          setExtendDialog((current) => ({ ...current, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium muddatini uzaytirish</DialogTitle>
            <DialogDescription>
              Qo'shimcha kunlar sonini kiriting. Bo'sh qiymat backend defaultini
              ishlatadi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="extend-premium-days">Kunlar</Label>
            <Input
              id="extend-premium-days"
              type="number"
              min="1"
              value={extendDays}
              onChange={(event) => setExtendDays(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setExtendDialog({ open: false, subscriptionId: null })
              }
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleExtendPremium}
              disabled={premiumMutation.isPending}
            >
              {premiumMutation.isPending ? (
                <Loader2Icon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <RotateCcwIcon data-icon="inline-start" />
              )}
              Uzaytirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (surface === "drawer") {
    return (
      <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
        <DrawerHeader className="border-b border-border/60 px-5 text-left md:px-6">
          {header}
        </DrawerHeader>
        <DrawerBody className="px-5 py-5 md:px-6">{body}</DrawerBody>
        <DrawerFooter className="gap-2 border-t bg-background/95 px-5 py-4 md:flex-row md:justify-end md:px-6">
          {canManageThisUser ? (
            <Button variant="outline" asChild>
              <Link to={`/admin/users/list/edit/${userId}`}>Tahrirlash</Link>
            </Button>
          ) : null}
          <Button variant="outline" onClick={handleRefresh}>
            Yangilash
          </Button>
          <Button onClick={onClose}>Yopish</Button>
        </DrawerFooter>
        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}
      {body}
      {dialogs}
    </div>
  );
};

export default UserDetailView;
