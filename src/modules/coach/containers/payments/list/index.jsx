import React from "react";
import { chain, get, isArray, trim } from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { DownloadIcon, PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { api } from "@/hooks/api/use-api";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import {
  BulkActionsBar,
  LifecycleTabs,
  ListHeader,
} from "@/modules/coach/components/data-grid-helpers";
import {
  useCoachPayments,
  useCoachPaymentsMutations,
  useCoachPaymentStats,
} from "@/modules/coach/lib/hooks/useCoachPayments";
import coachPaymentsApi from "@/modules/coach/lib/api/coach-payments-api";
import PaymentStatsBar from "../components/payment-stats-bar";
import PaymentAddDrawer from "../components/payment-add-drawer";
import PaymentEditDrawer from "../components/payment-edit-drawer";
import PaymentCancelDrawer from "../components/payment-cancel-drawer";
import PaymentRefundDrawer from "../components/payment-refund-drawer";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePaymentFilters } from "./use-filters.js";
import { SoftDeleteAlert, HardDeleteAlert } from "./delete-alert.jsx";

const PaymentsListPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();

  const {
    search,
    selectedMonth,
    lifecycle,
    setLifecycle,
    status,
    method,
    sortBy,
    sortDir,
    currentPage,
    pageSize,
    setPageQuery,
    sorting,
    filterFields,
    activeFilters,
    handleFiltersChange,
    handleSortingChange,
  } = usePaymentFilters();

  const deferredSearch = React.useDeferredValue(search);

  const queryParams = React.useMemo(() => {
    const params = {
      lifecycle,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    };

    if (deferredSearch.trim()) params.q = deferredSearch.trim();
    if (selectedMonth) params.month = selectedMonth;
    if (status && status !== "all") params.status = status;
    if (method) params.method = method;

    return params;
  }, [deferredSearch, selectedMonth, lifecycle, status, method, sortBy, sortDir, currentPage, pageSize]);

  const { data, isLoading, isFetching, refetch } = useCoachPayments(queryParams);
  const payments = get(data, "data.data", []);
  const meta = get(data, "data.meta", {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  const mutations = useCoachPaymentsMutations();
  const { stats, isLoading: isStatsLoading } = useCoachPaymentStats();

  const [rowSelection, setRowSelection] = React.useState({});
  const [paymentToSoftDelete, setPaymentToSoftDelete] = React.useState(null);
  const [hardDeleteTarget, setHardDeleteTarget] = React.useState(null);

  // Add drawer state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false);
  const [addPaymentSearch, setAddPaymentSearch] = React.useState("");
  const [selectedClientId, setSelectedClientId] = React.useState("");
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentNote, setPaymentNote] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");
  const [receiptUrl, setReceiptUrl] = React.useState("");
  const [receiptAccessUrl, setReceiptAccessUrl] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  // Edit drawer state
  const [editingPayment, setEditingPayment] = React.useState(null);
  const [editAmount, setEditAmount] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [editMethod, setEditMethod] = React.useState("");
  const [editReceiptUrl, setEditReceiptUrl] = React.useState("");
  const [editReceiptAccessUrl, setEditReceiptAccessUrl] = React.useState("");
  const [isEditUploading, setIsEditUploading] = React.useState(false);

  // Cancel drawer state
  const [cancellingPayment, setCancellingPayment] = React.useState(null);
  const [cancellationReason, setCancellationReason] = React.useState("");

  // Refund drawer state
  const [refundingPayment, setRefundingPayment] = React.useState(null);
  const [refundReason, setRefundReason] = React.useState("");
  const [refundAmount, setRefundAmount] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/payments", title: "To'lovlar" },
    ]);
  }, [setBreadcrumbs]);

  React.useEffect(() => {
    const totalPages = get(meta, "totalPages", 1);
    if (currentPage > totalPages) {
      void setPageQuery(String(totalPages));
    }
  }, [currentPage, meta, setPageQuery]);

  React.useEffect(() => {
    setRowSelection({});
  }, [search, selectedMonth, lifecycle, status, method, sortBy, sortDir, currentPage]);

  const selectedPaymentIds = React.useMemo(
    () =>
      chain(rowSelection)
        .entries()
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => Number.isInteger(id))
        .value(),
    [rowSelection],
  );

  const selectedPaymentCount = selectedPaymentIds.length;

  const handleFileUpload = async (event, isEdit = false) => {
    const file = get(event, "target.files[0]");
    if (!file) return;
    if (isEdit) setIsEditUploading(true);
    else setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await api.post("/coach/payments/receipts/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const payload = response.data?.data ?? response.data;
      const ref = payload?.receiptRef || payload?.url || "";
      const access = payload?.accessUrl || payload?.url || payload?.receiptRef || "";
      if (isEdit) {
        setEditReceiptUrl(ref);
        setEditReceiptAccessUrl(access);
      } else {
        setReceiptUrl(ref);
        setReceiptAccessUrl(access);
      }
      toast.success("Kvitansiya yuklandi");
    } catch {
      toast.error("Kvitansiya yuklashda xatolik");
    } finally {
      if (isEdit) setIsEditUploading(false);
      else setIsUploading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedClientId) {
      toast.error("Mijozni tanlang");
      return;
    }
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("To'lov summasini kiriting");
      return;
    }
    try {
      await mutations.createResource({
        clientId: selectedClientId,
        amount,
        note: paymentNote,
        method: paymentMethod,
        receiptUrl: receiptUrl || undefined,
      });
      toast.success("To'lov muvaffaqiyatli qayd etildi");
      setIsAddDrawerOpen(false);
      setSelectedClientId("");
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentMethod("CASH");
      setReceiptUrl("");
      setReceiptAccessUrl("");
      setAddPaymentSearch("");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "To'lovni qayd etishda xatolik");
    }
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;
    try {
      await mutations.updateResource(editingPayment.id, {
        amount: Number(editAmount) || undefined,
        note: editNote,
        method: editMethod,
        receiptUrl: editReceiptUrl || undefined,
      });
      toast.success("To'lov yangilandi");
      setEditingPayment(null);
      setEditReceiptUrl("");
      setEditReceiptAccessUrl("");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Yangilashda xatolik");
    }
  };

  const handleCancelPayment = async () => {
    if (!cancellingPayment) return;
    try {
      await mutations.updateResourceStatus(cancellingPayment.id, {
        status: "cancelled",
        reason: trim(cancellationReason) || undefined,
      });
      toast.success("To'lov bekor qilindi");
      setCancellingPayment(null);
      setCancellationReason("");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Bekor qilishda xatolik");
    }
  };

  const handleRefundPayment = async () => {
    if (!refundingPayment) return;
    try {
      await mutations.updateResourceStatus(refundingPayment.id, {
        status: "refunded",
        amount: Number(refundAmount) || undefined,
        reason: trim(refundReason) || undefined,
      });
      toast.success("To'lov qaytarildi");
      setRefundingPayment(null);
      setRefundReason("");
      setRefundAmount("");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Qaytarishda xatolik");
    }
  };

  const handleSoftDelete = async () => {
    if (!paymentToSoftDelete) return;
    try {
      await mutations.removeResource(paymentToSoftDelete.id);
      toast.success("To'lov trashga yuborildi");
      setPaymentToSoftDelete(null);
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi");
    }
  };

  const handleRestore = async (payment) => {
    try {
      await mutations.restoreResource(payment.id);
      toast.success("To'lov tiklandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi");
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget?.ids?.length) return;
    try {
      await mutations.bulkHardDeleteResources({ ids: hardDeleteTarget.ids });
      toast.success(
        hardDeleteTarget.ids.length === 1
          ? "To'lov butunlay o'chirildi"
          : `${hardDeleteTarget.ids.length} ta to'lov butunlay o'chirildi`,
      );
      setHardDeleteTarget(null);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "O'chirib bo'lmadi");
    }
  };

  const handleBulkTrash = async () => {
    if (!selectedPaymentIds.length) return;
    try {
      await mutations.bulkTrashResources({ ids: selectedPaymentIds });
      toast.success(`${selectedPaymentIds.length} ta to'lov trashga yuborildi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Trashga yuborib bo'lmadi");
    }
  };

  const handleBulkRestore = async () => {
    if (!selectedPaymentIds.length) return;
    try {
      await mutations.bulkRestoreResources({ ids: selectedPaymentIds });
      toast.success(`${selectedPaymentIds.length} ta to'lov tiklandi`);
      setRowSelection({});
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "Tiklab bo'lmadi");
    }
  };

  const handleBulkHardDelete = () => {
    if (!selectedPaymentIds.length) return;
    setHardDeleteTarget({ ids: selectedPaymentIds });
  };

  const handleExportCsv = React.useCallback(async () => {
    setIsExporting(true);

    try {
      const response = await coachPaymentsApi.exportData(queryParams, {
        responseType: "blob",
      });
      const contentType =
        response?.headers?.["content-type"] || "text/csv;charset=utf-8";
      const blob =
        response?.data instanceof Blob
          ? response.data
          : new Blob([response?.data ?? ""], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const suffix = selectedMonth || "all";

      link.href = url;
      link.download = `coach-payments-${suffix}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("CSV eksport tayyorlandi");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(isArray(message) ? message.join(", ") : message || "CSV eksport qilib bo'lmadi");
    } finally {
      setIsExporting(false);
    }
  }, [queryParams, selectedMonth]);

  const openEditDrawer = React.useCallback((payment) => {
    setEditingPayment(payment);
    setEditAmount(String(payment.amount || ""));
    setEditNote(payment.note || "");
    setEditMethod(payment.method || "CASH");
    setEditReceiptUrl(payment.receiptRef || payment.receiptUrl || "");
    setEditReceiptAccessUrl(payment.receiptUrl || "");
  }, []);

  const openCancelDrawer = React.useCallback((payment) => {
    setCancellingPayment(payment);
    setCancellationReason("");
  }, []);

  const openRefundDrawer = React.useCallback((payment) => {
    setRefundingPayment(payment);
    setRefundReason("");
    setRefundAmount(String(payment.amount || ""));
  }, []);

  const columns = useColumns({
    currentPage,
    pageSize,
    onEdit: openEditDrawer,
    onCancel: openCancelDrawer,
    onRefund: openRefundDrawer,
    onSoftDelete: setPaymentToSoftDelete,
    onRestore: handleRestore,
    onHardDelete: setHardDeleteTarget,
  });

  const table = useReactTable({
    data: payments,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount: get(meta, "totalPages", 1),
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      React.startTransition(() => {
        void setPageQuery(String(next.pageIndex + 1));
      });
    },
    state: {
      rowSelection,
      sorting,
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  const isTrashed = lifecycle === "trash";

  return (
    <div className="flex flex-col gap-6 w-full">
      <ListHeader
        title="To'lovlar"
        description="Trener to'lovlarini boshqaring"
        actions={[
          {
            key: "export",
            label: isExporting ? "Eksport..." : "CSV eksport",
            icon: DownloadIcon,
            variant: "outline",
            onClick: () => void handleExportCsv(),
            disabled: isExporting,
          },
          {
            key: "create",
            label: "To'lov qo'shish",
            icon: PlusIcon,
            onClick: () => setIsAddDrawerOpen(true),
          },
        ]}
      >
        <LifecycleTabs
          value={lifecycle}
          onValueChange={(value) => {
            void setLifecycle(value);
            void setPageQuery("1");
            setRowSelection({});
          }}
        />
      </ListHeader>

      <PaymentStatsBar stats={stats} isLoading={isStatsLoading} />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Filter
          filterFields={filterFields}
          activeFilters={activeFilters}
          handleFiltersChange={handleFiltersChange}
        />
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="hidden xl:flex items-center justify-center size-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
          aria-label="Yangilash"
        >
          <RotateCcwIcon className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {selectedPaymentCount > 0 ? (
        <BulkActionsBar
          selectedCount={selectedPaymentCount}
          title="Tanlangan to'lovlar"
          onClear={() => setRowSelection({})}
          actions={
            isTrashed
              ? [
                  {
                    key: "restore",
                    label: "Tiklash",
                    icon: RotateCcwIcon,
                    onClick: () => void handleBulkRestore(),
                    disabled: mutations.isMutating,
                  },
                  {
                    key: "hard-delete",
                    label: "Butunlay o'chirish",
                    icon: Trash2Icon,
                    variant: "destructive",
                    onClick: handleBulkHardDelete,
                    disabled: mutations.isMutating,
                  },
                ]
              : [
                  {
                    key: "trash",
                    label: "Trashga yuborish",
                    icon: Trash2Icon,
                    onClick: () => void handleBulkTrash(),
                    disabled: mutations.isMutating,
                  },
                ]
          }
        />
      ) : null}

      <DataGrid
        table={table}
        isLoading={isLoading}
        recordCount={get(meta, "total", 0)}
      >
        <div className="w-full flex flex-col gap-2.5">
          <DataGridContainer>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination
            info="{from} - {to} / {count} ta to'lov"
            rowsPerPageLabel="Sahifada:"
            sizes={[10, 25, 50]}
          />
        </div>
      </DataGrid>

      <PaymentAddDrawer
        open={isAddDrawerOpen}
        onOpenChange={(open) => {
          setIsAddDrawerOpen(open);
          if (!open) {
            setAddPaymentSearch("");
            setSelectedClientId("");
            setPaymentAmount("");
            setPaymentNote("");
            setPaymentMethod("CASH");
            setReceiptUrl("");
            setReceiptAccessUrl("");
          }
        }}
        filteredAddClients={[]}
        isClientsLoading={false}
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
        isMarkingClientPayment={mutations.createMutation.isPending}
        onFileUpload={handleFileUpload}
      />

      <PaymentEditDrawer
        editingPayment={editingPayment}
        onClose={() => {
          setEditingPayment(null);
          setEditReceiptUrl("");
          setEditReceiptAccessUrl("");
        }}
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
        isUpdatingClientPayment={mutations.updateMutation.isPending}
        onFileUpload={(e) => handleFileUpload(e, true)}
        onCancelFromEdit={() => {
          setCancellingPayment(editingPayment);
          setCancellationReason("");
          setEditingPayment(null);
        }}
      />

      <PaymentCancelDrawer
        cancellingPayment={cancellingPayment}
        onClose={() => setCancellingPayment(null)}
        cancellationReason={cancellationReason}
        setCancellationReason={setCancellationReason}
        onCancelPayment={handleCancelPayment}
        isCancellingClientPayment={mutations.updateStatusMutation.isPending}
      />

      <PaymentRefundDrawer
        refundingPayment={refundingPayment}
        onClose={() => setRefundingPayment(null)}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        onRefundPayment={handleRefundPayment}
        isRefundingClientPayment={mutations.updateStatusMutation.isPending}
      />

      <SoftDeleteAlert
        payment={paymentToSoftDelete}
        open={Boolean(paymentToSoftDelete)}
        onOpenChange={(open) => !open && setPaymentToSoftDelete(null)}
        onConfirm={() => void handleSoftDelete()}
        isDeleting={mutations.removeMutation.isPending}
      />

      <HardDeleteAlert
        target={hardDeleteTarget}
        open={Boolean(hardDeleteTarget)}
        onOpenChange={(open) => !open && setHardDeleteTarget(null)}
        onConfirm={() => void handleHardDelete()}
        isDeleting={mutations.bulkHardDeleteMutation.isPending}
      />
    </div>
  );
};

export default PaymentsListPage;
