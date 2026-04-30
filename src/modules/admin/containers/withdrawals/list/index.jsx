import React from "react";
import dayjs from "dayjs";
import { get, isArray, join, toString } from "lodash";
import { parseAsString, useQueryState } from "nuqs";
import { useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  MoreHorizontalIcon,
  RotateCcwIcon,
  WalletCardsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import PageTransition from "@/components/page-transition";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import { useAdminPermissions } from "@/modules/admin/lib/permissions.js";
import { cn } from "@/lib/utils";

const QUERY_KEY = ["admin", "withdrawals"];
const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "completed"];

const statusLabels = {
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  completed: "Yakunlangan",
};

const statusClassNames = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-blue-200 bg-blue-50 text-blue-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function getUserName(user) {
  const fullName = `${get(user, "firstName", "") || ""} ${get(user, "lastName", "") || ""}`.trim();
  return fullName || get(user, "phone") || get(user, "email") || "Foydalanuvchi";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
}

function getErrorMessage(error, fallback) {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
}

const WithdrawalsListPage = () => {
  const { canManageFinance } = useAdminPermissions();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const queryClient = useQueryClient();
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [pageSizeQuery, setPageSizeQuery] = useQueryState(
    "pageSize",
    parseAsString.withDefault("10"),
  );
  const [reviewDialog, setReviewDialog] = React.useState({
    open: false,
    action: null,
    item: null,
  });
  const [adminNote, setAdminNote] = React.useState("");

  const currentPage = Math.max(Number(pageQuery) || 1, 1);
  const pageSize = Math.max(Number(pageSizeQuery) || 10, 1);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/withdrawals", title: "Yechib olishlar" },
    ]);
  }, [setBreadcrumbs]);

  const queryParams = React.useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      page: currentPage,
      pageSize,
    }),
    [currentPage, pageSize, status],
  );

  const {
    data: withdrawalsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/withdrawals",
    params: queryParams,
    queryProps: {
      queryKey: [...QUERY_KEY, queryParams],
    },
  });

  const items = get(withdrawalsData, "data.data", get(withdrawalsData, "data.withdrawals", []));
  const total = get(withdrawalsData, "data.meta.total", get(withdrawalsData, "data.total", 0));
  const totalPages = get(withdrawalsData, "data.meta.totalPages", Math.max(1, Math.ceil(total / pageSize)));

  const reviewMutation = usePatchQuery({
    queryKey: QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      },
    },
  });

  const openReviewDialog = React.useCallback((item, action) => {
    if (!canManageFinance) return;
    setReviewDialog({ open: true, action, item });
    setAdminNote("");
  }, [canManageFinance]);

  const closeReviewDialog = React.useCallback(() => {
    setReviewDialog({ open: false, action: null, item: null });
    setAdminNote("");
  }, []);

  const handleReview = React.useCallback(async () => {
    const item = reviewDialog.item;
    const action = reviewDialog.action;

    if (!canManageFinance || !item || !action) return;

    try {
      await reviewMutation.mutateAsync({
        url: `/admin/withdrawals/${get(item, "id")}/${action}`,
        attributes: action === "complete" ? {} : { adminNote },
      });
      toast.success("So'rov holati yangilandi");
      closeReviewDialog();
    } catch (error) {
      toast.error(getErrorMessage(error, "So'rov holatini o'zgartirib bo'lmadi"));
    }
  }, [adminNote, canManageFinance, closeReviewDialog, reviewDialog, reviewMutation]);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "user",
        header: "Foydalanuvchi",
        size: 260,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: ({ row }) => {
          const user = get(row.original, "user", {});
          const name = getUserName(user);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={get(user, "avatarUrl") || ""} />
                <AvatarFallback className="text-xs">
                  {name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate font-medium">{name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {get(user, "phone") || get(user, "email") || "-"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => <DataGridColumnHeader column={column} title="XP" />,
        size: 100,
        meta: { skeleton: adminListSkeletons.text },
        cell: ({ getValue }) => (
          <span className="font-medium">{Number(getValue() || 0).toLocaleString("uz-UZ")} XP</span>
        ),
      },
      {
        accessorKey: "amountUzs",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Summa" />,
        size: 150,
        meta: { skeleton: adminListSkeletons.text },
        cell: ({ getValue }) => <span>{formatMoney(getValue())}</span>,
      },
      {
        accessorKey: "cardNumber",
        header: "Karta",
        size: 130,
        meta: { skeleton: adminListSkeletons.text },
      },
      {
        accessorKey: "cardHolder",
        header: "Karta egasi",
        size: 180,
        meta: { skeleton: adminListSkeletons.text },
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        meta: { skeleton: adminListSkeletons.badge },
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <Badge
              variant="outline"
              className={cn("capitalize", statusClassNames[value])}
            >
              {statusLabels[value] || value}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataGridColumnHeader column={column} title="Yaratilgan" />,
        size: 160,
        meta: { skeleton: adminListSkeletons.text },
        cell: ({ getValue }) => dayjs(getValue()).format("DD.MM.YYYY HH:mm"),
      },
      {
        id: "actions",
        header: "",
        size: 56,
        meta: { skeleton: adminListSkeletons.action },
        cell: ({ row }) => {
          const item = row.original;
          const itemStatus = get(item, "status");
          return (
            <div className="flex justify-end">
              {canManageFinance ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {itemStatus === "pending" ? (
                      <>
                        <DropdownMenuItem onClick={() => openReviewDialog(item, "approve")}>
                          Tasdiqlash
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openReviewDialog(item, "reject")}>
                          Rad etish
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {itemStatus === "approved" ? (
                      <DropdownMenuItem onClick={() => openReviewDialog(item, "complete")}>
                        Yakunlash
                      </DropdownMenuItem>
                    ) : null}
                    {itemStatus !== "pending" && itemStatus !== "approved" ? (
                      <DropdownMenuItem disabled>Action yo'q</DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          );
        },
      },
    ],
    [canManageFinance, openReviewDialog],
  );

  const table = useReactTable({
    data: items,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
    onPaginationChange: (updater) => {
      const prev = { pageIndex: currentPage - 1, pageSize };
      const next = typeof updater === "function" ? updater(prev) : updater;
      const nextPage = String(get(next, "pageIndex", 0) + 1);
      const nextPageSize = String(get(next, "pageSize", pageSize));
      void setPageQuery(nextPage);
      if (nextPageSize !== String(pageSize)) {
        void setPageSizeQuery(nextPageSize);
      }
    },
    state: {
      pagination: { pageIndex: currentPage - 1, pageSize },
    },
  });

  const dialogTitle =
    reviewDialog.action === "approve"
      ? "So'rovni tasdiqlash"
      : reviewDialog.action === "reject"
        ? "So'rovni rad etish"
        : "So'rovni yakunlash";

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <WalletCardsIcon className="text-primary" />
            Yechib olishlar
          </h1>
          <p className="text-sm text-muted-foreground">
            XP yechib olish so'rovlarini ko'rib chiqing va holatini boshqaring.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select
            value={STATUS_OPTIONS.includes(status) ? status : "all"}
            onValueChange={(value) => {
              void setStatus(value);
              void setPageQuery("1");
            }}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="pending">Kutilmoqda</SelectItem>
              <SelectItem value="approved">Tasdiqlangan</SelectItem>
              <SelectItem value="rejected">Rad etilgan</SelectItem>
              <SelectItem value="completed">Yakunlangan</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="hidden sm:flex"
            disabled={isFetching}
          >
            <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>

        <DataGrid table={table} isLoading={isLoading} recordCount={total}>
          <div className="flex w-full flex-col gap-2.5">
            <DataGridContainer>
              <ScrollArea className="w-full">
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
            <DataGridPagination
              info="{from} - {to} / {count} ta so'rov"
              rowsPerPageLabel="Sahifada:"
              sizes={[10, 25, 50, 100]}
            />
          </div>
        </DataGrid>

        <Dialog
          open={reviewDialog.open}
          onOpenChange={(open) => {
            if (!open) closeReviewDialog();
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>
                Amalni tasdiqlang. Izoh tasdiqlash yoki rad etishda saqlanadi.
              </DialogDescription>
            </DialogHeader>
            {reviewDialog.action !== "complete" ? (
              <Textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Admin izohi"
                className="min-h-28"
              />
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={closeReviewDialog}>
                Bekor qilish
              </Button>
              <Button onClick={handleReview} disabled={reviewMutation.isPending}>
                Tasdiqlash
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default WithdrawalsListPage;
