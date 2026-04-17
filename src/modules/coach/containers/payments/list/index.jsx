import {
  filter,
  get,
  join,
  map,
  split,
  take,
  toLower,
  toUpper,
  trim,
} from "lodash";
import React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  BanknoteIcon,
  BellIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  DownloadIcon,
  ImageIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  ListChecksIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletCardsIcon,
  XCircleIcon,
} from "lucide-react";
import CoachErrorState from "../../../components/coach-error-state";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachPaymentActions,
  useCoachPaymentLedger,
  useCoachPayments,
  useCoachPaymentStats,
} from "@/hooks/app/use-coach";
import { useTranslation } from "react-i18next";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import PageTransition from "@/components/page-transition";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useColumns } from "./columns.jsx";
import { Filter, usePaymentFilters } from "./filter.jsx";

const formatMoney = (value, t, locale = "uz-UZ") => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return t("coach.payments.table.negotiable");
  }
  return `${new Intl.NumberFormat(locale).format(normalized)} ${t("coach.payments.table.currency")}`;
};

const formatDate = (value, locale = "uz-UZ") => {
  if (!value) return "\u2014";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const getInitials = (value = "") =>
  toUpper(join(take(map(split(String(value), " "), (part) => get(part, "[0]", "")), 2), ""));

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType = "up",
  variant = "default",
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardContent className="p-6">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  return (
    <Card className="group relative overflow-hidden border-none bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      <CardContent className="relative z-10 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className={cn("rounded-xl border p-2", variants[variant])}>
            <Icon className="size-5" />
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold",
                trendType === "up"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {trendType === "up" ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {trend}
            </div>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          {description && (
            <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
      <div
        className={cn(
          "absolute -bottom-8 -right-8 size-24 rounded-full opacity-5 blur-2xl",
          variant === "default"
            ? "bg-primary"
            : variant === "warning"
              ? "bg-orange-500"
              : "bg-destructive",
        )}
      />
    </Card>
  );
};

const PaymentsListIndex = () => {
  const { t, i18n } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const locale = i18n.language || "uz-UZ";

  const {
    search,
    selectedMonth,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = usePaymentFilters({ locale });

  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentNote, setPaymentNote] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [receiptUrl, setReceiptUrl] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [addPaymentSearch, setAddPaymentSearch] = React.useState("");

  const [editingPayment, setEditingPayment] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [editMethod, setEditMethod] = React.useState("");
  const [editReceiptUrl, setEditReceiptUrl] = React.useState("");
  const [isEditUploading, setIsEditUploading] = React.useState(false);

  const [cancellingPayment, setCancellingPayment] = React.useState(null);
  const [cancellationReason, setCancellationReason] = React.useState("");

  const [refundingPayment, setRefundingPayment] = React.useState(null);
  const [refundReason, setRefundReason] = React.useState("");
  const [refundAmount, setRefundAmount] = React.useState("");

  const {
    clients = [],
    isLoading: isClientsLoading,
    markClientPayment,
    updateClientPayment,
    cancelClientPayment,
    refundClientPayment,
    isMarkingClientPayment,
    isUpdatingClientPayment,
    isCancellingClientPayment,
    isRefundingClientPayment,
  } = useCoachClients({ status: "active" });

  const paymentsParams = React.useMemo(() => {
    if (typeof selectedMonth !== "string" || !selectedMonth.includes("-"))
      return {};
    const [year, month] = split(selectedMonth, "-");
    const y = parseInt(year);
    const m = parseInt(month);
    if (isNaN(y) || isNaN(m)) return {};
    const from = new Date(year, m - 1, 1).toISOString();
    const to = new Date(year, m, 0, 23, 59, 59).toISOString();
    const params = { from, to };
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (trim(search)) {
      params.q = trim(search);
    }
    return params;
  }, [search, selectedMonth, statusFilter]);

  const { payments: historyItems = [], isLoading: isHistoryLoading, isError: isHistoryError, refetch: refetchHistory } =
    useCoachPayments(paymentsParams);

  const { stats, isLoading: isStatsLoading } = useCoachPaymentStats();
  const { ledger } = useCoachPaymentLedger({ ...paymentsParams, limit: 8 });
  const {
    exportPaymentsCsv,
    syncPaymentReminders,
    uploadReceipt,
    isSyncingPaymentReminders,
  } = useCoachPaymentActions();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: t("coach.clients.breadcrumbs.coach") },
      { url: "/coach/payments", title: t("coach.payments.header.title") },
    ]);
  }, [setBreadcrumbs, t]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredHistory = React.useMemo(() => {
    let items = historyItems;
    if (statusFilter !== "all") {
      items = filter(items, (item) => item.status === statusFilter);
    }
    if (!trim(deferredSearch)) return items;
    const q = toLower(deferredSearch);
    return filter(
      items,
      (item) =>
        toLower(item.get(client, "name")).includes(q) ||
        toLower(item.note).includes(q),
    );
  }, [historyItems, deferredSearch, statusFilter]);

  const handleFileUpload = async (event, isEdit = false) => {
    const file = get(event, "target.files[0]");
    if (!file) return;
    if (isEdit) {
      setIsEditUploading(true);
    } else {
      setIsUploading(true);
    }
    try {
      const response = await uploadReceipt(file);
      const uploadedUrl = get(response, "url");
      if (isEdit) {
        setEditReceiptUrl(uploadedUrl);
      } else {
        setReceiptUrl(uploadedUrl);
      }
      toast.success(t("coach.payments.toasts.receiptUploaded"));
    } catch (error) {
      toast.error(t("coach.payments.toasts.uploadError"));
    } finally {
      if (isEdit) {
        setIsEditUploading(false);
      } else {
        setIsUploading(false);
      }
    }
  };

  const handleExportToCSV = React.useCallback(() => {
    if (!filteredHistory || filteredHistory.length === 0) {
      toast.error(t("coach.payments.toasts.exportNoData"));
      return;
    }
    exportPaymentsCsv(paymentsParams)
      .then(() => toast.success(t("coach.payments.toasts.exportSuccess")))
      .catch(() => toast.error(t("coach.payments.toasts.saveError")));
  }, [exportPaymentsCsv, filteredHistory, paymentsParams, t]);

  const filteredAddClients = React.useMemo(() => {
    const q = trim(toLower(addPaymentSearch));
    if (!q) return clients || [];
    return filter(
      clients || [],
      (c) =>
        toLower(c.name).includes(q) ||
        toLower(c.phone).includes(q) ||
        toLower(c.email).includes(q),
    );
  }, [clients, addPaymentSearch]);

  const handleMarkPaid = async () => {
    if (!selectedClientId) {
      toast.error(t("coach.payments.toasts.clientRequired"));
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error(t("coach.payments.toasts.amountRequired"));
      return;
    }
    try {
      await markClientPayment(selectedClientId, {
        amount,
        note: paymentNote,
        method: paymentMethod,
        receiptUrl: receiptUrl || undefined,
      });
      toast.success(t("coach.payments.toasts.saveSuccess"));
      setPaymentNote("");
      setSelectedClientId("");
      setPaymentAmount("");
      setPaymentMethod("CASH");
      setReceiptUrl("");
      setAddPaymentSearch("");
      setIsAddDrawerOpen(false);
    } catch (error) {
      toast.error(t("coach.payments.toasts.saveError"));
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    try {
      await updateClientPayment(editingPayment.get(client, "id"), editingPayment.id, {
        amount: Number(editAmount) || undefined,
        note: editNote,
        method: editMethod,
        receiptUrl: editReceiptUrl || undefined,
      });
      toast.success(t("coach.payments.toasts.updateSuccess"));
      setEditingPayment(null);
      setEditReceiptUrl("");
    } catch (error) {
      toast.error(t("coach.payments.toasts.saveError"));
    }
  };

  const handleCancelPayment = async () => {
    if (!cancellingPayment) return;
    try {
      await cancelClientPayment(
        cancellingPayment.get(client, "id"),
        cancellingPayment.id,
        { reason: trim(cancellationReason) || undefined },
      );
      toast.success(t("coach.payments.toasts.cancelSuccess"));
      setCancellingPayment(null);
      setCancellationReason("");
    } catch (error) {
      toast.error(t("coach.payments.toasts.saveError"));
    }
  };

  const handleRefundPayment = async () => {
    if (!refundingPayment) return;
    try {
      await refundClientPayment(
        refundingPayment.get(client, "id"),
        refundingPayment.id,
        { reason: trim(refundReason) || undefined },
      );
      toast.success(t("coach.payments.toasts.refundSuccess"));
      setRefundingPayment(null);
      setRefundReason("");
      setRefundAmount("");
    } catch (error) {
      toast.error(t("coach.payments.toasts.saveError"));
    }
  };

  const columns = useColumns({
    locale,
    onEdit: (p) => {
      setEditingPayment(p);
      setEditAmount(String(p.amount || ""));
      setEditNote(p.note || "");
      setEditMethod(p.method || "CLICK");
      setEditReceiptUrl(p.receiptUrl || "");
    },
    onRefund: (p) => {
      setRefundingPayment(p);
      setRefundReason("");
      setRefundAmount(String(p.amount || ""));
    },
    onCancel: (p) => {
      setCancellingPayment(p);
      setCancellationReason("");
    },
  });

  const historyTable = useReactTable({
    data: filteredHistory,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      columnPinning: { right: ["actions"] },
    },
  });

  if (isHistoryError) {
    return (
      <PageTransition>
        <CoachErrorState onRetry={refetchHistory} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("coach.payments.header.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("coach.payments.header.description")}
            </p>
          </div>
          <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
            <Filter
              filterFields={filterFields}
              activeFilters={activeFilters}
              handleFiltersChange={handleFiltersChange}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  syncPaymentReminders()
                    .then((res) =>
                      toast.success(
                        `${get(res, "data.created", get(res, "created", 0))} reminder yuborildi`,
                      ),
                    )
                    .catch(() => toast.error(t("coach.payments.toasts.saveError")))
                }
                disabled={isSyncingPaymentReminders}
                className="gap-2"
              >
                <BellIcon className="size-4" />
                Reminder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToCSV}
                className="gap-2"
              >
                <DownloadIcon className="size-4" />
                {t("coach.payments.header.export")}
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddDrawerOpen(true)}
                className="gap-2"
              >
                <PlusIcon className="size-4" />
                {t("coach.payments.header.addPayment")}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <BanknoteIcon className="size-5 text-primary" />
              {t("coach.payments.header.title")}
            </h2>
            <div className="flex items-center gap-4">
              <div className="hidden text-xs font-medium text-muted-foreground sm:block">
                {t("coach.payments.table.totalTransactions", {
                  count: filteredHistory.length,
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-primary/10 bg-primary/5 px-4 font-semibold text-primary hover:bg-primary/10"
                onClick={handleExportToCSV}
                disabled={filteredHistory.length === 0}
              >
                <DownloadIcon className="mr-2 size-4" />{" "}
                {t("coach.payments.header.export")} (CSV)
              </Button>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard
              title={t("coach.payments.stats.revenue")}
              value={formatMoney(stats.revenue.total, t, locale)}
              icon={WalletCardsIcon}
              description={t("coach.dashboard.revenue.allTime")}
              trend={
                stats.revenue.growth > 0
                  ? `+${stats.revenue.growth}%`
                  : stats.revenue.growth < 0
                    ? `${stats.revenue.growth}%`
                    : null
              }
              trendType={stats.revenue.growth >= 0 ? "up" : "down"}
              isLoading={isStatsLoading}
            />
            <StatCard
              title={t("coach.dashboard.revenue.currentMonth")}
              value={formatMoney(stats.revenue.currentMonth, t, locale)}
              icon={BanknoteIcon}
              description={`${new Date().toLocaleString(locale, { month: "long" })} ${t("coach.dashboard.revenue.currentMonthSuffix")}`}
              isLoading={isStatsLoading}
            />
            <StatCard
              title="Expected vs collected"
              value={`${formatMoney(stats.revenue.collectedCurrentMonth, t, locale)} / ${formatMoney(stats.revenue.expectedCurrentMonth, t, locale)}`}
              icon={CircleDollarSignIcon}
              description={`${stats.revenue.collectionRate || 0}% collected`}
              variant={stats.revenue.outstandingCurrentMonth > 0 ? "warning" : "success"}
              isLoading={isStatsLoading}
            />
            <StatCard
              title="Available balance"
              value={formatMoney(stats.balance.available, t, locale)}
              icon={WalletCardsIcon}
              description={`${formatMoney(stats.balance.pending, t, locale)} pending`}
              variant="success"
              isLoading={isStatsLoading}
            />
            <StatCard
              title={t("coach.payments.stats.pending")}
              value={stats.counts.pending + stats.counts.overdue}
              icon={CalendarIcon}
              description={t("coach.payments.stats.overduePayments", {
                count: stats.counts.overdue,
              })}
              variant={stats.counts.overdue > 0 ? "warning" : "default"}
              isLoading={isStatsLoading}
            />
            <StatCard
              title={t("coach.payments.status.completed")}
              value={stats.counts.completed}
              icon={CheckCircle2Icon}
              description={t("coach.payments.stats.refundedPayments", {
                count: stats.counts.refunded,
              })}
              isLoading={isStatsLoading}
            />
          </div>

          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGrid
                table={historyTable}
                isLoading={isHistoryLoading}
                recordCount={filteredHistory.length}
                loadingMode="spinner"
                emptyMessage={t("coach.mealPlans.empty")}
                tableLayout={{ columnsPinnable: true }}
              >
                <DataGridTable />
              </DataGrid>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>

          <Card className="rounded-[28px] border-border/60 bg-card/95 py-5">
            <CardContent className="space-y-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black tracking-tight">
                    <ListChecksIcon className="size-4 text-primary" />
                    Ledger
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Payment, refund, cancellation va adjustment actionlari.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-border/60">
                {map(ledger || [], (entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {entry.get(client, "name") || "Client"}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {entry.action} · {formatDate(entry.createdAt, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-black",
                          Number(entry.amount) >= 0
                            ? "text-emerald-600"
                            : "text-destructive",
                        )}
                      >
                        {Number(entry.amount) >= 0 ? "+" : ""}
                        {formatMoney(Math.abs(Number(entry.amount || 0)), t, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {formatMoney(entry.balanceAfter, t, locale)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!ledger || ledger.length === 0) && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Ledger hali bo‘sh.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Payment Drawer */}
      <Drawer
        open={isAddDrawerOpen}
        onOpenChange={(open) => {
          setIsAddDrawerOpen(open);
          if (!open) setAddPaymentSearch("");
        }}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("coach.payments.drawers.add.title")}</DrawerTitle>
            <DrawerDescription>
              {t("coach.payments.drawers.add.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("coach.payments.drawers.add.clientLabel")}
                </Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t(
                      "coach.payments.filters.searchPlaceholder",
                    )}
                    className="h-11 pl-9"
                    value={addPaymentSearch}
                    onChange={(e) => setAddPaymentSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
                {filteredAddClients.map((client) => {
                  const isSelected = selectedClientId === client.id;
                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);
                        if (client.get(paymentSummary, "price")) {
                          setPaymentAmount(
                            String(client.paymentSummary.price),
                          );
                        }
                      }}
                      className={cn(
                        "mb-2 flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all last:mb-0",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:bg-muted/30",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border shadow-sm">
                          <AvatarImage
                            src={client.avatar}
                            alt={client.name}
                          />
                          <AvatarFallback className="text-xs font-semibold text-muted-foreground">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold leading-tight">
                            {client.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {client.get(paymentSummary, "price") > 0
                              ? `${formatMoney(client.paymentSummary.price, t, locale)} ${t("coach.payments.table.pending")}`
                              : t("coach.payments.table.negotiable")}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full border transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {isSelected && (
                          <CheckCircle2Icon className="size-3" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredAddClients.length === 0 && !isClientsLoading && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("coach.payments.drawers.add.noClients")}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("coach.payments.drawers.add.methodLabel")}
                </Label>
                <div className="flex h-11 gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={cn(
                      "flex-1 rounded-md text-xs font-medium transition-all",
                      paymentMethod === "CASH"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("coach.payments.methods.CASH")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CLICK")}
                    className={cn(
                      "flex-1 rounded-md text-xs font-medium transition-all",
                      paymentMethod !== "CASH"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("coach.payments.methods.CLICK")}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("coach.payments.drawers.add.amountLabel")}
                </Label>
                <NumberField
                  value={paymentAmount ? Number(paymentAmount) : undefined}
                  min={0}
                  step={10000}
                  onValueChange={(value) =>
                    setPaymentAmount(
                      value === null || Number.isNaN(value)
                        ? ""
                        : String(value),
                    )
                  }
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput
                      placeholder={t(
                        "coach.payments.drawers.add.amountPlaceholder",
                      )}
                      className="h-11"
                    />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="payment-note"
                className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("coach.payments.drawers.add.noteLabel")}
              </Label>
              <Textarea
                id="payment-note"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder={t(
                  "coach.payments.drawers.add.notePlaceholder",
                )}
                className="min-h-[80px] resize-none border-border/50 bg-card focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3">
              <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("coach.payments.drawers.add.receiptImageLabel")}
              </Label>
              <div className="flex flex-col gap-2">
                {receiptUrl ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon className="size-4 shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium text-primary">
                        {split(receiptUrl, "/").pop()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setReceiptUrl("")}
                    >
                      <RotateCcwIcon className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) => handleFileUpload(e, false)}
                      disabled={isUploading}
                      accept="image/*"
                    />
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border border-dashed p-6 transition-all",
                        isUploading
                          ? "bg-muted"
                          : "border-border/50 bg-muted/10 hover:bg-muted/20",
                      )}
                    >
                      {isUploading ? (
                        <RotateCcwIcon className="mb-2 size-6 animate-spin text-primary" />
                      ) : (
                        <PlusIcon className="mb-2 size-6 text-muted-foreground" />
                      )}
                      <p className="text-xs font-semibold text-muted-foreground">
                        {isUploading
                          ? t("coach.payments.drawers.add.uploading")
                          : t("coach.payments.drawers.add.receiptLabel")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              onClick={handleMarkPaid}
              disabled={isMarkingClientPayment || !selectedClientId}
              size="lg"
            >
              {isMarkingClientPayment
                ? t("common.status.submitting")
                : t("coach.payments.drawers.add.submit")}
            </Button>
            <Button variant="ghost" onClick={() => setIsAddDrawerOpen(false)}>
              {t("coach.mealPlans.deleteDialog.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Payment Drawer */}
      <Drawer
        open={Boolean(editingPayment)}
        onOpenChange={(open) => !open && setEditingPayment(null)}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {t("coach.payments.drawers.edit.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("coach.payments.drawers.edit.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("coach.payments.drawers.add.methodLabel")}
                </Label>
                <div className="flex h-11 gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setEditMethod("CASH")}
                    className={cn(
                      "flex-1 rounded-md text-xs font-medium transition-all",
                      editMethod === "CASH"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("coach.payments.methods.CASH")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMethod("CLICK")}
                    className={cn(
                      "flex-1 rounded-md text-xs font-medium transition-all",
                      editMethod !== "CASH"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("coach.payments.methods.CLICK")}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("coach.payments.drawers.add.amountLabel")}
                </Label>
                <NumberField
                  value={editAmount ? Number(editAmount) : undefined}
                  min={0}
                  step={10000}
                  onValueChange={(value) =>
                    setEditAmount(
                      value === null || Number.isNaN(value)
                        ? ""
                        : String(value),
                    )
                  }
                >
                  <NumberFieldGroup>
                    <NumberFieldDecrement />
                    <NumberFieldInput
                      placeholder={t(
                        "coach.payments.drawers.add.amountPlaceholder",
                      )}
                      className="h-11"
                    />
                    <NumberFieldIncrement />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="edit-note"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("coach.payments.drawers.add.noteLabel")}
              </Label>
              <Textarea
                id="edit-note"
                value={editNote}
                onChange={(event) => setEditNote(event.target.value)}
                placeholder={t(
                  "coach.payments.drawers.edit.notePlaceholder",
                )}
                className="min-h-[100px] resize-none border-border/50 bg-card focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3">
              <Label className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("coach.payments.drawers.add.receiptImageLabel")}
              </Label>
              <div className="flex flex-col gap-2">
                {editReceiptUrl ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon className="size-4 shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium text-primary">
                        {split(editReceiptUrl, "/").pop()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditReceiptUrl("")}
                    >
                      <RotateCcwIcon className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) => handleFileUpload(e, true)}
                      disabled={isEditUploading}
                      accept="image/*"
                    />
                    <div
                      className={cn(
                        "flex flex-col items-center justify-center rounded-xl border border-dashed p-6 transition-all",
                        isEditUploading
                          ? "bg-muted"
                          : "border-border/50 bg-muted/10 hover:bg-muted/20",
                      )}
                    >
                      {isEditUploading ? (
                        <RotateCcwIcon className="mb-2 size-6 animate-spin text-primary" />
                      ) : (
                        <PlusIcon className="mb-2 size-6 text-muted-foreground" />
                      )}
                      <p className="text-xs font-semibold text-muted-foreground">
                        {isEditUploading
                          ? t("coach.payments.drawers.add.uploading")
                          : t("coach.payments.drawers.add.receiptLabel")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              onClick={handleUpdatePayment}
              disabled={isUpdatingClientPayment}
              size="lg"
            >
              {isUpdatingClientPayment
                ? t("common.status.submitting")
                : t("coach.payments.drawers.add.submit")}
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => {
                setCancellingPayment(editingPayment);
                setEditingPayment(null);
              }}
            >
              {t("coach.payments.drawers.cancel.title")}
            </Button>
            <Button variant="ghost" onClick={() => setEditingPayment(null)}>
              {t("coach.mealPlans.deleteDialog.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Cancel Payment Drawer */}
      <Drawer
        open={Boolean(cancellingPayment)}
        onOpenChange={(open) => !open && setCancellingPayment(null)}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 font-bold text-destructive">
              <XCircleIcon className="size-5" />
              {t("coach.payments.drawers.cancel.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("coach.payments.drawers.cancel.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="space-y-3">
              <Label
                htmlFor="cancel-reason"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("coach.payments.drawers.cancel.reasonLabel")}
              </Label>
              <Textarea
                id="cancel-reason"
                value={cancellationReason}
                onChange={(event) =>
                  setCancellationReason(event.target.value)
                }
                placeholder={t(
                  "coach.payments.drawers.cancel.reasonPlaceholder",
                )}
                className="min-h-[100px] resize-none rounded-2xl border-border/50 bg-card focus:ring-destructive/20"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              variant="destructive"
              onClick={handleCancelPayment}
              disabled={isCancellingClientPayment}
            >
              {isCancellingClientPayment
                ? t("common.status.submitting")
                : t("coach.payments.drawers.cancel.submit")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCancellingPayment(null)}
            >
              {t("coach.mealPlans.deleteDialog.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Refund Payment Drawer */}
      <Drawer
        open={Boolean(refundingPayment)}
        onOpenChange={(open) => !open && setRefundingPayment(null)}
        direction="bottom"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 font-bold text-orange-600">
              <RotateCcwIcon className="size-5" />
              {t("coach.payments.drawers.refund.title")}
            </DrawerTitle>
            <DrawerDescription>
              {t("coach.payments.drawers.refund.description")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="refund-reason"
                className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("coach.payments.drawers.refund.reasonLabel")}
              </Label>
              <Textarea
                id="refund-reason"
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                placeholder={t(
                  "coach.payments.drawers.refund.reasonPlaceholder",
                )}
                className="min-h-[100px] resize-none rounded-2xl border-border/50 bg-card focus:ring-orange-500/20"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleRefundPayment}
              disabled={isRefundingClientPayment}
            >
              {isRefundingClientPayment
                ? t("common.status.submitting")
                : t("coach.payments.drawers.refund.submit")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setRefundingPayment(null)}
            >
              {t("coach.mealPlans.deleteDialog.cancel")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </PageTransition>
  );
};

export default PaymentsListIndex;
