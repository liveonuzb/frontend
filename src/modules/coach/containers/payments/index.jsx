import React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  BanknoteIcon,
  DownloadIcon,
  Edit2Icon,
  PaperclipIcon,
  PlusIcon,
} from "lucide-react";
import { api } from "@/hooks/api/use-api";
import _ from "lodash";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachPayments,
  useCoachPaymentStats,
} from "@/hooks/app/use-coach";
import { parseAsString, useQueryState } from "nuqs";
import PageTransition from "@/components/page-transition";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Filters } from "@/components/reui/filters.jsx";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PaymentStatsBar from "./components/payment-stats-bar";
import PaymentAddDrawer from "./components/payment-add-drawer";
import PaymentEditDrawer from "./components/payment-edit-drawer";
import PaymentCancelDrawer from "./components/payment-cancel-drawer";
import PaymentRefundDrawer from "./components/payment-refund-drawer";
import GlobalPaymentDetailsCard from "./components/global-payment-details-card";

const formatMoney = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Kelishiladi";
  }
  return `${new Intl.NumberFormat("uz-UZ").format(normalized)} so'm`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const getInitials = (value = "") =>
  String(value)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  // URL State for filtering
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [selectedMonth, setSelectedMonth] = useQueryState(
    "month",
    parseAsString.withDefault(
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    ),
  );

  // State for Add Payment drawer
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [selectedClientId, setSelectedClientId] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentNote, setPaymentNote] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [receiptUrl, setReceiptUrl] = React.useState("");
  const [receiptAccessUrl, setReceiptAccessUrl] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [addPaymentSearch, setAddPaymentSearch] = React.useState("");

  // State for Edit Payment drawer
  const [editingPayment, setEditingPayment] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [editMethod, setEditMethod] = React.useState("");
  const [editReceiptUrl, setEditReceiptUrl] = React.useState("");
  const [editReceiptAccessUrl, setEditReceiptAccessUrl] = React.useState("");
  const [isEditUploading, setIsEditUploading] = React.useState(false);

  // State for Cancellation drawer
  const [cancellingPayment, setCancellingPayment] = React.useState(null);
  const [cancellationReason, setCancellationReason] = React.useState("");

  // State for Refund drawer
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
    const [year, month] = _.split(selectedMonth, "-");
    const y = parseInt(year);
    const m = parseInt(month);
    if (isNaN(y) || isNaN(m)) return {};

    const from = new Date(year, m - 1, 1).toISOString();
    const to = new Date(year, m, 0, 23, 59, 59).toISOString();
    return { from, to };
  }, [selectedMonth]);

  const { payments: historyItems = [], isLoading: isHistoryLoading } =
    useCoachPayments(paymentsParams);

  const { stats, isLoading: isStatsLoading } = useCoachPaymentStats();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/payments", title: "To'lovlar" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredHistory = React.useMemo(() => {
    if (!_.trim(deferredSearch)) return historyItems;
    const q = _.toLower(deferredSearch);
    return historyItems.filter(
      (item) =>
        _.toLower(_.get(item, "client.name", "")).includes(q) ||
        _.toLower(_.get(item, "note", "")).includes(q),
    );
  }, [historyItems, deferredSearch]);

  const handleFileUpload = async (event, isEdit = false) => {
    const file = _.get(event.target.files, "[0]");
    if (!file) return;

    if (isEdit) {
      setIsEditUploading(true);
    } else {
      setIsUploading(true);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/coach/payments/receipts/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const payload = response.data?.data ?? response.data;
      const nextReceiptRef = payload?.receiptRef || payload?.url || "";
      const nextAccessUrl =
        payload?.accessUrl || payload?.url || payload?.receiptRef || "";

      if (isEdit) {
        setEditReceiptUrl(nextReceiptRef);
        setEditReceiptAccessUrl(nextAccessUrl);
      } else {
        setReceiptUrl(nextReceiptRef);
        setReceiptAccessUrl(nextAccessUrl);
      }
      toast.success("Kvitansiya yuklandi!");
    } catch (error) {
      toast.error("Kvitansiya yuklashda xatolik!");
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
      toast.error("Eksport qilish uchun ma'lumot yo'q");
      return;
    }

    const headers = [
      "Sana",
      "Mijoz",
      "Summa",
      "Usul",
      "Izoh",
      "Status",
      "Kvitansiya URL",
    ];
    const csvRows = [headers.join(",")];

    for (const row of filteredHistory) {
      const statusLabel =
        row.status === "cancelled"
          ? "Bekor qilingan"
          : row.status === "refunded"
            ? "Qaytarilgan"
            : "Muvaffaqiyatli";

      const values = [
        formatDate(row.paidAt),
        `"${_.get(row.client, "name") || ""}"`,
        row.amount || 0,
        `"${row.method || ""}"`,
        `"${(row.note || "").replace(/"/g, '""')}"`,
        statusLabel,
        `"${row.receiptUrl || ""}"`,
      ];
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `coach_payments_${_.split(new Date().toISOString(), "T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Muvaffaqiyatli eksport qilindi!");
  }, [filteredHistory]);

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        placeholder: "Mijoz nomi yoki izoh...",
      },
      {
        label: "Oy",
        key: "month",
        type: "select",
        options: Array.from({ length: 12 }).map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = new Intl.DateTimeFormat("uz-UZ", {
            month: "long",
            year: "numeric",
          }).format(d);
          return { value: val, label };
        }),
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const items = [];
    if (_.trim(search)) {
      items.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }
    if (selectedMonth) {
      items.push({
        id: "month",
        field: "month",
        operator: "is",
        values: [selectedMonth],
      });
    }
    return items;
  }, [search, selectedMonth]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch =
        _.get(
          nextFilters.find((f) => f.field === "q"),
          "values[0]",
          "",
        ) ?? "";
      const nextMonth =
        _.get(
          nextFilters.find((f) => f.field === "month"),
          "values[0]",
          "",
        ) ?? "";

      React.startTransition(() => {
        void setSearch(nextSearch);
        if (nextMonth) void setSelectedMonth(nextMonth);
      });
    },
    [setSearch, setSelectedMonth],
  );

  const filteredAddClients = React.useMemo(() => {
    const q = _.trim(_.toLower(addPaymentSearch));
    if (!q) return clients || [];
    return (clients || []).filter(
      (c) =>
        _.toLower(_.get(c, "name", "")).includes(q) ||
        _.toLower(_.get(c, "phone", "")).includes(q) ||
        _.toLower(_.get(c, "email", "")).includes(q),
    );
  }, [clients, addPaymentSearch]);

  const handleMarkPaid = async () => {
    if (!selectedClientId) {
      toast.error("Mijozni tanlang.");
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("To'lov summasini kiriting.");
      return;
    }

    try {
      await markClientPayment(selectedClientId, {
        amount,
        note: paymentNote,
        method: paymentMethod,
        receiptUrl: receiptUrl || undefined,
      });
      toast.success("To'lov muvaffaqiyatli qayd etildi.");
      setPaymentNote("");
      setSelectedClientId("");
      setPaymentAmount("");
      setPaymentMethod("CASH");
      setReceiptUrl("");
      setReceiptAccessUrl("");
      setAddPaymentSearch("");
      setIsAddDrawerOpen(false);
    } catch (error) {
      toast.error("To'lovni qayd etishda xatolik yuz berdi.");
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    try {
      await updateClientPayment(
        _.get(editingPayment, "client.id"),
        editingPayment.id,
        {
          amount: Number(editAmount) || undefined,
          note: editNote,
          method: editMethod,
          receiptUrl: editReceiptUrl || undefined,
        },
      );
      toast.success("To'lov muvaffaqiyatli yangilandi.");
      setEditingPayment(null);
      setEditReceiptUrl("");
      setEditReceiptAccessUrl("");
    } catch (error) {
      toast.error("To'lovni yangilashda xatolik yuz berdi.");
    }
  };

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error("Eksport qilish uchun ma'lumot yo'q.");
      return;
    }

    const headers = [
      "Mijoz",
      "Summa",
      "Sana",
      "Usul",
      "Izoh",
      "Kvitansiya URL",
    ];
    const rows = filteredHistory.map((item) => [
      _.get(item, "client.name") || "Noma'lum",
      item.amount || 0,
      formatDate(item.paidAt),
      item.method || "OTHER",
      item.note || "",
      item.receiptUrl || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_export_${selectedMonth}.csv`);
    link.click();
    toast.success("Excel/CSV muvaffaqiyatli yuklab olindi.");
  };

  const handleCancelPayment = async () => {
    if (!cancellingPayment) return;
    try {
      await cancelClientPayment(
        _.get(cancellingPayment, "client.id"),
        cancellingPayment.id,
        {
          reason: _.trim(cancellationReason) || undefined,
        },
      );
      toast.success("To'lov muvaffaqiyatli bekor qilindi.");
      setCancellingPayment(null);
      setCancellationReason("");
    } catch (error) {
      toast.error("To'lovni bekor qilishda xatolik yuz berdi.");
    }
  };

  const handleRefundPayment = async () => {
    if (!refundingPayment) return;
    try {
      await refundClientPayment(
        _.get(refundingPayment, "client.id"),
        refundingPayment.id,
        {
          amount: Number(refundAmount) || undefined,
          reason: _.trim(refundReason) || undefined,
        },
      );
      toast.success("To'lov muvaffaqiyatli qaytarildi.");
      setRefundingPayment(null);
      setRefundReason("");
      setRefundAmount("");
    } catch (error) {
      toast.error("To'lovni qaytarishda xatolik yuz berdi.");
    }
  };

  const historyColumns = React.useMemo(
    () => [
      {
        accessorKey: "client",
        header: "Mijoz",
        cell: ({ getValue }) => {
          const client = getValue();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={client?.avatar} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(client?.name || "N")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {client?.name || "Noma'lum"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {client?.phone || client?.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Summa",
        cell: ({ getValue }) => (
          <span className="font-semibold text-primary">
            {formatMoney(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "paidAt",
        header: "Sana",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: "note",
        header: "Izoh",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-[200px]">
            <span className="truncate text-xs text-muted-foreground">
              {row.original.note || "—"}
            </span>
            {row.original.receiptUrl && (
              <a
                href={row.original.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1 hover:bg-primary/10 rounded transition-colors"
                title="Kvitansiyani ko'rish"
                onClick={(e) => e.stopPropagation()}
              >
                <PaperclipIcon className="size-3 text-primary" />
              </a>
            )}
          </div>
        ),
      },
      {
        accessorKey: "method",
        header: "Usul",
        cell: ({ getValue }) => (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground uppercase tracking-tight">
            {getValue() || "Boshqa"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === "cancelled") {
            return (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive uppercase tracking-tight">
                Bekor qilingan
              </span>
            );
          }
          if (status === "refunded") {
            return (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 uppercase tracking-tight">
                Qaytarilgan
              </span>
            );
          }
          return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 uppercase tracking-tight">
              Muvaffaqiyatli
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 100,
        cell: ({ row }) => {
          const status = row.original.status;
          const isFinal = status === "cancelled" || status === "refunded";
          if (isFinal) return null;

          return (
            <div className="flex justify-end gap-2 pr-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className="hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  const p = row.original;
                  setEditingPayment(p);
                  setEditAmount(String(p.amount || ""));
                  setEditNote(p.note || "");
                  setEditMethod(p.method || "CLICK");
                  setEditReceiptUrl(p.receiptRef || p.receiptUrl || "");
                  setEditReceiptAccessUrl(p.receiptUrl || "");
                }}
              >
                <Edit2Icon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-200"
                onClick={() => {
                  setRefundingPayment(row.original);
                  setRefundReason("");
                  setRefundAmount(String(row.original.amount || ""));
                }}
              >
                Qaytarish
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                onClick={() => {
                  setCancellingPayment(row.original);
                  setCancellationReason("");
                }}
              >
                Bekor qilish
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  // NOTE(perf): This table uses TanStack Table (useReactTable + DataGridTable), which manages its
  // own rendering pipeline via the column model. Adding @tanstack/react-virtual here would require
  // replacing DataGridTable with a custom virtualised tbody, which is a significant refactor.
  // Virtualisation is only worthwhile if filteredHistory regularly exceeds ~500 rows; the backend
  // already scopes payments to a single month, so this is unlikely in practice.
  // If it becomes necessary, refactor DataGridTable to accept a rowVirtualizer prop.
  const historyTable = useReactTable({
    data: filteredHistory,
    columns: historyColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              To&apos;lovlar
            </h1>
            <p className="text-sm text-muted-foreground">
              Barcha to&apos;lovlar tarixi va tranzaksiyalar monitoringi.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
            <Filters
              fields={filterFields}
              filters={activeFilters}
              onChange={handleFiltersChange}
            />
            <div className="flex items-center gap-2">
              <GlobalPaymentDetailsCard
                buttonOnly
                buttonSize="sm"
                buttonClassName="gap-2"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <DownloadIcon className="size-4" />
                Eksport
              </Button>

              <Button
                size="sm"
                onClick={() => setIsAddDrawerOpen(true)}
                className="gap-2"
              >
                <PlusIcon className="size-4" />
                To&apos;lov kiritish
              </Button>
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <BanknoteIcon className="size-5 text-primary" />
              To&apos;lovlar tarixi
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                Jami {filteredHistory.length} ta tranzaksiya
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl font-semibold bg-primary/5 border-primary/10 hover:bg-primary/10 text-primary"
                onClick={handleExportToCSV}
                disabled={filteredHistory.length === 0}
              >
                <DownloadIcon className="size-4 mr-2" /> Eksport (CSV)
              </Button>
            </div>
          </div>

          <PaymentStatsBar stats={stats} isLoading={isStatsLoading} />

          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGrid
                table={historyTable}
                isLoading={isHistoryLoading}
                recordCount={filteredHistory.length}
                loadingMode="spinner"
                emptyMessage="Hech qanday to'lov qilinmagan."
              >
                <DataGridTable />
              </DataGrid>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
        </div>
      </div>

      <PaymentAddDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        filteredAddClients={filteredAddClients}
        isClientsLoading={isClientsLoading}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentNote={paymentNote}
        setPaymentNote={setPaymentNote}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        receiptUrl={receiptAccessUrl}
        onClearReceipt={() => {
          setReceiptUrl("");
          setReceiptAccessUrl("");
        }}
        isUploading={isUploading}
        addPaymentSearch={addPaymentSearch}
        setAddPaymentSearch={setAddPaymentSearch}
        onMarkPaid={handleMarkPaid}
        isMarkingClientPayment={isMarkingClientPayment}
        onFileUpload={handleFileUpload}
      />

      <PaymentEditDrawer
        editingPayment={editingPayment}
        onClose={() => setEditingPayment(null)}
        editAmount={editAmount}
        setEditAmount={setEditAmount}
        editNote={editNote}
        setEditNote={setEditNote}
        editMethod={editMethod}
        setEditMethod={setEditMethod}
        editReceiptUrl={editReceiptAccessUrl}
        onClearReceipt={() => {
          setEditReceiptUrl("");
          setEditReceiptAccessUrl("");
        }}
        isEditUploading={isEditUploading}
        onUpdatePayment={handleUpdatePayment}
        isUpdatingClientPayment={isUpdatingClientPayment}
        onFileUpload={handleFileUpload}
        onCancelFromEdit={() => {
          setCancellingPayment(editingPayment);
          setEditingPayment(null);
        }}
      />

      <PaymentCancelDrawer
        cancellingPayment={cancellingPayment}
        onClose={() => setCancellingPayment(null)}
        cancellationReason={cancellationReason}
        setCancellationReason={setCancellationReason}
        onCancelPayment={handleCancelPayment}
        isCancellingClientPayment={isCancellingClientPayment}
      />

      <PaymentRefundDrawer
        refundingPayment={refundingPayment}
        onClose={() => setRefundingPayment(null)}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        onRefundPayment={handleRefundPayment}
        isRefundingClientPayment={isRefundingClientPayment}
      />
    </PageTransition>
  );
};

export default Index;
