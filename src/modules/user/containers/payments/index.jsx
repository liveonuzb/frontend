import React from "react";
import compact from "lodash/compact";
import filter from "lodash/filter";
import find from "lodash/find";
import get from "lodash/get";
import join from "lodash/join";
import map from "lodash/map";
import toLower from "lodash/toLower";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import reduce from "lodash/reduce";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";
import trim from "lodash/trim";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Filters } from "@/components/reui/filters.jsx";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery } from "@/hooks/api";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridContainer,
  DataGridPagination,
  DataGridTable,
} from "@/components/reui/data-grid";
import { cn } from "@/lib/utils";
import { userSurfaceClassName } from "@/modules/user/lib/card-styles";

const SOURCE_FILTER_OPTIONS = ["all", "subscription"];
const METHOD_FILTER_OPTIONS = [
  "all",
  "cash",
  "payme",
  "click",
  "uzcard",
  "multicard",
  "xp",
  "free",
];
const SORT_FIELDS = [
  "paidAt",
  "amount",
  "source",
  "method",
  "reason",
  "planName",
];
const SORT_DIRECTIONS = ["asc", "desc"];

const SOURCE_LABELS = {
  subscription: "Subscription",
};

const METHOD_LABELS = {
  cash: "Naqd",
  payme: "Payme",
  click: "Click",
  uzcard: "Uzcard",
  multicard: "Multi Card",
  xp: "XP",
  free: "Bepul",
};

const SOURCE_BADGE = {
  subscription:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

const formatMoney = (value, currency = "UZS") => {
  const amount = toNumber(value);
  if (!Number.isFinite(amount) || amount <= 0) return "0 so'm";

  if (toUpper(String(currency)) === "UZS") {
    return `${new Intl.NumberFormat("uz-UZ").format(amount)} so'm`;
  }

  return `${new Intl.NumberFormat("uz-UZ").format(amount)} ${currency}`;
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

const StatCard = ({ icon: Icon, title, value, hint, tone }) => (
  <Card className="py-5">
    <CardContent className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className={cn("rounded-2xl p-3", tone)}>
        <Icon className="size-5" />
      </div>
    </CardContent>
  </Card>
);

const DetailRow = ({ label, value }) =>
  value ? (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium break-all">{value}</span>
    </div>
  ) : null;

const PaymentDetailDrawer = ({ payment, onClose }) => (
  <Drawer
    open={Boolean(payment)}
    onOpenChange={(open) => !open && onClose()}
    direction="bottom"
  >
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
      <DrawerHeader>
        <DrawerTitle>To&apos;lov tafsilotlari</DrawerTitle>
      </DrawerHeader>
      {payment ? (
        <div className="px-4 pb-8 space-y-1">
          <DetailRow label="ID" value={payment.rowId} />
          <Separator className="my-1" />
          <DetailRow label="Sana" value={formatDate(payment.paidAt)} />
          <DetailRow
            label="Summa"
            value={formatMoney(payment.amount, payment.currency)}
          />
          <DetailRow
            label="Manba"
            value={SOURCE_LABELS[payment.source] || payment.source}
          />
          <DetailRow
            label="To'lov usuli"
            value={METHOD_LABELS[payment.method] || payment.method}
          />
          <DetailRow label="Sabab" value={payment.reason} />
          <DetailRow label="Izoh" value={payment.note} />
          {payment.source === "subscription" ? (
            <>
              <Separator className="my-1" />
              <DetailRow label="Tarif" value={payment.planName} />
            </>
          ) : null}
          {payment.receiptUrl ? (
            <>
              <Separator className="my-1" />
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline pt-1"
              >
                <ExternalLinkIcon className="size-3.5" />
                Chek ko&apos;rish
              </a>
            </>
          ) : null}
          {payment.cancelledAt ? (
            <>
              <Separator className="my-1" />
              <div className="flex items-center gap-1.5 text-xs text-destructive pt-1">
                <XCircleIcon className="size-3.5" />
                Bekor qilingan: {formatDate(payment.cancelledAt)}
              </div>
              {payment.cancellationReason ? (
                <DetailRow label="Sabab" value={payment.cancellationReason} />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </DrawerContent>
  </Drawer>
);

const normalizePaymentSource = (payment) => {
  if (payment?.source === "subscription" || payment?.type === "subscription") {
    return "subscription";
  }
  return "subscription";
};

const normalizeMethod = (value) => {
  if (!value) return null;
  return toLower(String(value));
};

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sourceFilter, setSourceFilter] = useQueryState(
    "source",
    parseAsStringEnum(SOURCE_FILTER_OPTIONS).withDefault("all"),
  );
  const [methodFilter, setMethodFilter] = useQueryState(
    "method",
    parseAsStringEnum(METHOD_FILTER_OPTIONS).withDefault("all"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(SORT_FIELDS).withDefault("paidAt"),
  );
  const [sortDir, setSortDir] = useQueryState(
    "sortDir",
    parseAsStringEnum(SORT_DIRECTIONS).withDefault("desc"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );
  const [selectedPayment, setSelectedPayment] = React.useState(null);

  const deferredSearch = React.useDeferredValue(search);
  const pageIndex = Math.max(0, toNumber(pageQuery || "1") - 1);
  const [pageSize, setPageSize] = React.useState(10);

  const { data: paymentsData, isLoading } = useGetQuery({
    url: "/users/me/payments",
    queryProps: {
      queryKey: ["user", "payments"],
    },
  });
  const paymentsPayload = get(paymentsData, "data.data", []);
  const payments = React.useMemo(
    () =>
      isArray(paymentsPayload)
        ? paymentsPayload
        : get(paymentsPayload, "items", []),
    [paymentsPayload],
  );
  const summary = React.useMemo(() => {
    const totalPaidAmount = reduce(
      payments,
      (sum, payment) => sum + toNumber(payment.amount || 0),
      0,
    );

    return {
      totalPaymentsCount: payments.length,
      totalCompletedPayments: payments.length,
      totalPaidAmount,
      subscriptionPaymentsCount: payments.length,
      subscriptionPaidAmount: totalPaidAmount,
    };
  }, [payments]);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/payments", title: "To'lovlar" },
    ]);
  }, [setBreadcrumbs]);

  const rows = React.useMemo(
    () =>
      map(payments, (payment) => {
        const source = normalizePaymentSource(payment);
        const method = normalizeMethod(payment.method);
        const reason =
          payment.reason ||
          payment.note ||
          `${payment.planName || "Premium"} obunasi uchun to'lov`;

        return {
          rowId: payment.id,
          source,
          method,
          paidAt: payment.paidAt || payment.date || null,
          amount: toNumber(payment.amount || 0),
          currency: payment.currency || "UZS",
          reason,
          note: payment.note || null,
          planName: payment.planName || null,
          receiptUrl: payment.receiptUrl || null,
          cancelledAt: payment.cancelledAt || null,
          cancellationReason: payment.cancellationReason || null,
        };
      }),
    [payments],
  );

  const normalizedSearch = toLower(trim(deferredSearch));
  const filteredRows = React.useMemo(() => {
    return filter(rows, (row) => {
      const isSourceMatched =
        sourceFilter === "all" ? true : row.source === sourceFilter;
      if (!isSourceMatched) return false;

      const isMethodMatched =
        methodFilter === "all" ? true : row.method === methodFilter;
      if (!isMethodMatched) return false;

      if (!normalizedSearch) return true;

      const haystack = toLower(
        join(
          compact([
            SOURCE_LABELS[row.source] || row.source,
            row.reason,
            row.note,
            row.planName,
            row.method,
            row.amount ? String(row.amount) : null,
          ]),
          " ",
        ),
      );
      return includes(haystack, normalizedSearch);
    });
  }, [methodFilter, normalizedSearch, rows, sourceFilter]);

  React.useEffect(() => {
    if (pageIndex > 0 && filteredRows.length === 0) {
      void setPageQuery("1");
    }
  }, [filteredRows.length, pageIndex, setPageQuery]);

  React.useEffect(() => {
    void setPageQuery("1");
  }, [methodFilter, normalizedSearch, setPageQuery, sourceFilter]);

  const filterFields = React.useMemo(
    () => [
      {
        label: "Qidiruv",
        key: "q",
        type: "text",
        defaultOperator: "contains",
        placeholder: "To'lov sababi yoki plan bo'yicha qidiring",
      },
      {
        label: "Manba",
        key: "source",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "subscription", label: "Subscription" },
        ],
      },
      {
        label: "To'lov usuli",
        key: "method",
        type: "select",
        defaultOperator: "is",
        options: [
          { value: "all", label: "Barchasi" },
          { value: "cash", label: METHOD_LABELS.cash },
          { value: "payme", label: METHOD_LABELS.payme },
          { value: "click", label: METHOD_LABELS.click },
          { value: "uzcard", label: METHOD_LABELS.uzcard },
          { value: "multicard", label: METHOD_LABELS.multicard },
          { value: "xp", label: METHOD_LABELS.xp },
          { value: "free", label: METHOD_LABELS.free },
        ],
      },
    ],
    [],
  );

  const activeFilters = React.useMemo(() => {
    const next = [];

    if (trim(search)) {
      next.push({
        id: "q",
        field: "q",
        operator: "contains",
        values: [search],
      });
    }

    if (sourceFilter !== "all") {
      next.push({
        id: "source",
        field: "source",
        operator: "is",
        values: [sourceFilter],
      });
    }

    if (methodFilter !== "all") {
      next.push({
        id: "method",
        field: "method",
        operator: "is",
        values: [methodFilter],
      });
    }

    return next;
  }, [methodFilter, search, sourceFilter]);

  const handleFiltersChange = React.useCallback(
    (nextFilters) => {
      const nextSearch = find(nextFilters, { field: "q" })?.values?.[0] ?? "";
      const nextSource =
        find(nextFilters, { field: "source" })?.values?.[0] ?? "all";
      const nextMethod =
        find(nextFilters, { field: "method" })?.values?.[0] ?? "all";

      React.startTransition(() => {
        void setSearch(nextSearch);
        void setSourceFilter(nextSource);
        void setMethodFilter(nextMethod);
        void setPageQuery("1");
      });
    },
    [setMethodFilter, setPageQuery, setSearch, setSourceFilter],
  );

  const sorting = React.useMemo(
    () => [{ id: sortBy, desc: sortDir === "desc" }],
    [sortBy, sortDir],
  );

  const handleSortingChange = React.useCallback(
    (updater) => {
      const nextSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = nextSorting?.[0];

      React.startTransition(() => {
        void setPageQuery("1");

        if (!nextSort) {
          void setSortBy("paidAt");
          void setSortDir("desc");
          return;
        }

        void setSortBy(nextSort.id);
        void setSortDir(nextSort.desc ? "desc" : "asc");
      });
    },
    [setPageQuery, setSortBy, setSortDir, sorting],
  );

  const columns = React.useMemo(
    () => [
      {
        id: "index",
        header: "#",
        cell: (info) => pageIndex * pageSize + info.row.index + 1,
        enableSorting: false,
      },
      {
        id: "paidAt",
        accessorFn: (row) => row?.paidAt || "",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="To'lov sanasi" />
        ),
        cell: ({ row }) => (
          <div className="min-w-[150px]">
            <p className="font-medium">{formatDate(row.original?.paidAt)}</p>
          </div>
        ),
      },
      {
        id: "source",
        accessorFn: (row) => row?.source || "subscription",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Manba" />
        ),
        cell: ({ row }) => {
          const source = row.original?.source || "subscription";
          return (
            <Badge
              variant="outline"
              className={SOURCE_BADGE[source] || SOURCE_BADGE.subscription}
            >
              {SOURCE_LABELS[source] || source}
            </Badge>
          );
        },
      },
      {
        id: "planName",
        accessorFn: (row) => row?.planName || "",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Kimga" />
        ),
        cell: ({ row }) => {
          return (
            <div className="min-w-[200px]">
              <p className="font-semibold">
                {row.original?.planName || "Premium"}
              </p>
              <p className="text-xs text-muted-foreground">Subscription</p>
            </div>
          );
        },
      },
      {
        id: "reason",
        accessorFn: (row) => row?.reason || "",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Nima uchun to'landi" />
        ),
        cell: ({ row }) => (
          <p className="min-w-[260px] max-w-[360px] text-sm leading-6">
            {row.original?.reason || "—"}
          </p>
        ),
      },
      {
        id: "amount",
        accessorFn: (row) => toNumber(row?.amount || 0),
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="Summa" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatMoney(row.original?.amount, row.original?.currency)}
          </span>
        ),
      },
      {
        id: "method",
        accessorFn: (row) => row?.method || "",
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title="To'lov usuli" />
        ),
        cell: ({ row }) =>
          row.original?.method ? (
            <Badge variant="secondary">
              {METHOD_LABELS[row.original.method] || row.original.method}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={() => setSelectedPayment(row.original)}
          >
            <ReceiptTextIcon className="size-3.5" />
            Ko&apos;rish
          </button>
        ),
      },
    ],
    [pageIndex, pageSize],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getRowId: (row) => row.rowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const nextPagination =
        typeof updater === "function"
          ? updater({
              pageIndex,
              pageSize,
            })
          : updater;
      const safeIndex = Math.max(0, nextPagination?.pageIndex ?? 0);
      const safeSize = Math.max(1, toNumber(nextPagination?.pageSize) || 10);
      setPageSize(safeSize);
      void setPageQuery(String(safeIndex + 1));
    },
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            To&apos;lovlar
          </h1>
          <p className="text-sm text-muted-foreground">
            Barcha qilingan to&apos;lovlar ro&apos;yxati.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={WalletCardsIcon}
            title="Jami qilingan to'lovlar"
            value={String(summary.totalCompletedPayments)}
            hint={`${summary.totalPaymentsCount} ta jami yozuv`}
            tone="bg-primary/10 text-primary"
          />
          <StatCard
            icon={ReceiptTextIcon}
            title="Jami summa"
            value={formatMoney(summary.totalPaidAmount)}
            hint="Muvaffaqiyatli to'lovlar summasi"
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <StatCard
            icon={CheckCircle2Icon}
            title="Subscription to'lovlari"
            value={String(summary.subscriptionPaymentsCount)}
            hint={formatMoney(summary.subscriptionPaidAmount)}
            tone="bg-violet-500/10 text-violet-600"
          />
        </div>

        <Filters
          fields={filterFields}
          filters={activeFilters}
          onChange={handleFiltersChange}
        />

        <DataGrid
          table={table}
          isLoading={isLoading}
          recordCount={filteredRows.length}
          tableLayout={{ width: "auto" }}
        >
          <div className="w-full space-y-2.5">
            <DataGridContainer className={cn(userSurfaceClassName, "bg-card/70")}>
              <ScrollArea className="w-full">
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
            <DataGridPagination
              info="{from} - {to} / {count} ta to'lov"
              rowsPerPageLabel="Sahifada:"
              sizes={[10, 20, 50]}
            />
          </div>
        </DataGrid>
      </div>
      <PaymentDetailDrawer
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </PageTransition>
  );
};

export default Index;
