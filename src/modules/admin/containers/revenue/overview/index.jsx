import React from "react";
import { get, isArray, isNil, join, map, size, trim } from "lodash";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PageTransition from "@/components/page-transition";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import {
  useGetQuery,
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { useBreadcrumbStore } from "@/store";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarIcon,
  DollarSignIcon,
  PlusIcon,
  ReceiptIcon,
  TrendingUpIcon,
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import ExpenseActionsMenu from "../components/expense-actions-menu";
import { toast } from "sonner";

const formatUZS = (price = 0) =>
  `${new Intl.NumberFormat("uz-UZ").format(price)} so'm`;

const dateRanges = [
  { label: "Hafta", value: "week" },
  { label: "Oy", value: "month" },
  { label: "Yil", value: "year" },
];

const typeBadgeConfig = {
  subscription: {
    label: "Oylik obuna",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  yearly: {
    label: "Yillik obuna",
    className:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  coach: {
    label: "Coach",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  challenge: {
    label: "Challenge",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  other: {
    label: "Boshqa",
    className:
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

const statusBadgeConfig = {
  completed: {
    label: "Bajarildi",
    className:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  refunded: {
    label: "Qaytarildi",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  pending: {
    label: "Kutilmoqda",
    className:
      "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  failed: {
    label: "Muvaffaqiyatsiz",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
};

const chartTooltip = ({ active, payload, label }) => {
  if (!active || !size(payload)) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{label}</p>
      {map(payload, (entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatUZS(entry.value)}
        </p>
      ))}
    </div>
  );
};

const getDefaultExpenseForm = () => ({
  category: "",
  amount: "",
  expenseDate: new Date().toISOString().split("T")[0],
  notes: "",
});

const Revenue = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [dateRange, setDateRange] = React.useState("month");
  const [expenseDrawerOpen, setExpenseDrawerOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState(null);
  const [deleteExpenseCandidate, setDeleteExpenseCandidate] =
    React.useState(null);
  const [expenseForm, setExpenseForm] = React.useState(getDefaultExpenseForm);

  const { data: revenueData, isLoading } = useGetQuery({
    url: "/admin/revenue",
    params: { range: dateRange },
    queryProps: {
      queryKey: ["admin", "revenue", dateRange],
    },
  });

  const revenue = get(revenueData, "data.data", {
    range: dateRange,
    overview: {},
    monthlyRevenue: [],
    revenueBySource: [],
    dailyRevenue: [],
    expenses: [],
    recentTransactions: [],
  });

  const { mutateAsync: createExpenseMutation, isPending: isCreating } =
    usePostQuery({
      queryKey: ["admin", "revenue"],
    });

  const { mutateAsync: updateExpenseMutation, isPending: isUpdating } =
    usePatchQuery({
      queryKey: ["admin", "revenue"],
    });

  const { mutateAsync: deleteExpenseMutation, isPending: isDeleting } =
    useDeleteQuery({
      queryKey: ["admin", "revenue"],
    });

  const createExpense = React.useCallback(
    async (payload) =>
      createExpenseMutation({
        url: "/admin/expenses",
        attributes: payload,
      }),
    [createExpenseMutation],
  );

  const updateExpense = React.useCallback(
    async (id, payload) =>
      updateExpenseMutation({
        url: `/admin/expenses/${id}`,
        attributes: payload,
      }),
    [updateExpenseMutation],
  );

  const deleteExpense = React.useCallback(
    async (id) =>
      deleteExpenseMutation({
        url: `/admin/expenses/${id}`,
      }),
    [deleteExpenseMutation],
  );

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/revenue", title: "Daromad" },
    ]);
  }, [setBreadcrumbs]);

  const overviewCards = React.useMemo(
    () => [
      {
        title: "Jami daromad",
        value: formatUZS(get(revenue, "overview.totalRevenue")),
        icon: DollarSignIcon,
        description: "Tanlangan davr bo'yicha tushum",
        growth: get(revenue, "overview.revenueGrowth"),
      },
      {
        title: "Sof foyda",
        value: formatUZS(get(revenue, "overview.netProfit")),
        icon: TrendingUpIcon,
        description: "Daromad minus operatsion xarajatlar",
        growth: get(revenue, "overview.profitGrowth"),
      },
      {
        title: "O'rtacha kunlik",
        value: formatUZS(get(revenue, "overview.avgDaily")),
        icon: CalendarIcon,
        description: "Kunlik o'rtacha tushum",
        growth: get(revenue, "overview.avgDailyGrowth"),
      },
      {
        title: "MRR",
        value: formatUZS(get(revenue, "overview.mrr")),
        icon: WalletIcon,
        description: "Faol obunalardan normallashgan oylik daromad",
        growth: get(revenue, "overview.mrrGrowth"),
      },
    ],
    [revenue.overview],
  );

  const handleCreateOpen = React.useCallback(() => {
    setEditingExpense(null);
    setExpenseForm(getDefaultExpenseForm());
    setExpenseDrawerOpen(true);
  }, []);

  const handleEditOpen = React.useCallback((expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      category: get(expense, "category", ""),
      amount: String(get(expense, "amount", "")),
      expenseDate: get(
        expense,
        "expenseDate",
        new Date().toISOString().split("T")[0],
      ),
      notes: get(expense, "notes", ""),
    });
    setExpenseDrawerOpen(true);
  }, []);

  const handleExpenseSave = React.useCallback(async () => {
    const payload = {
      category: trim(expenseForm.category),
      amount: Number(expenseForm.amount),
      expenseDate: expenseForm.expenseDate,
      notes: trim(expenseForm.notes),
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        toast.success("Xarajat yangilandi");
      } else {
        await createExpense(payload);
        toast.success("Xarajat qo'shildi");
      }

      setExpenseDrawerOpen(false);
      setEditingExpense(null);
      setExpenseForm(getDefaultExpenseForm());
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Xarajatni saqlab bo'lmadi",
      );
    }
  }, [createExpense, editingExpense, expenseForm, updateExpense]);

  const handleExpenseDelete = React.useCallback(async () => {
    if (!deleteExpenseCandidate) {
      return;
    }

    try {
      await deleteExpense(deleteExpenseCandidate.id);
      toast.success("Xarajat o'chirildi");
      setDeleteExpenseCandidate(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Xarajatni o'chirib bo'lmadi",
      );
    }
  }, [deleteExpense, deleteExpenseCandidate]);

  const transactionColumns = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: (info) => get(info, "row.index", 0) + 1,
        size: 60,
      },
      {
        accessorKey: "user",
        header: "Foydalanuvchi",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      },
      {
        accessorKey: "type",
        header: "Turi",
        cell: (info) => (
          <Badge
            variant="outline"
            className={get(typeBadgeConfig, [info.getValue(), "className"])}
          >
            {get(typeBadgeConfig, [info.getValue(), "label"], info.getValue())}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: "Summa",
        cell: (info) => (
          <span className="font-medium">{formatUZS(info.getValue())}</span>
        ),
      },
      {
        accessorKey: "method",
        header: "Usul",
        cell: (info) => (
          <Badge variant="outline">{info.getValue() ?? "Noma'lum"}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => (
          <Badge
            variant="outline"
            className={get(statusBadgeConfig, [info.getValue(), "className"])}
          >
            {get(
              statusBadgeConfig,
              [info.getValue(), "label"],
              info.getValue(),
            )}
          </Badge>
        ),
      },
      {
        accessorKey: "date",
        header: "Sana",
        cell: (info) => (
          <span className="text-muted-foreground">
            {info.getValue()
              ? new Intl.DateTimeFormat("uz-UZ", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(info.getValue()))
              : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const expenseColumns = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: (info) => info.row.index + 1,
        size: 60,
      },
      {
        accessorKey: "category",
        header: "Kategoriya",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      },
      {
        accessorKey: "amount",
        header: "Summa",
        cell: (info) => (
          <span className="font-medium text-red-600">
            {formatUZS(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "expenseDate",
        header: "Sana",
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Izoh",
        cell: (info) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: (info) => (
          <div className="flex justify-end">
            <ExpenseActionsMenu
              expense={get(info, "row.original")}
              onEdit={handleEditOpen}
              onDelete={setDeleteExpenseCandidate}
            />
          </div>
        ),
      },
    ],
    [handleEditOpen, isDeleting, isUpdating],
  );

  const transactionsTable = useReactTable({
    data: get(revenue, "recentTransactions", []),
    columns: transactionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const expensesTable = useReactTable({
    data: get(revenue, "expenses", []),
    columns: expenseColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daromad</h1>
            <p className="text-sm text-muted-foreground">
              Moliyaviy ko'rsatkichlar, manbalar, tranzaksiyalar va xarajatlar
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {map(dateRanges, (range) => (
                <Button
                  key={range.value}
                  variant={dateRange === range.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setDateRange(range.value)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <Button onClick={handleCreateOpen}>
              <PlusIcon data-icon="inline-start" />
              Xarajat qo'shish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {map(overviewCards, (card) => (
            <Card
              key={card.title}
              className="border-border/50 shadow-sm relative overflow-hidden group"
            >
              <div
                className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden
              />
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <card.icon />
                  </div>
                  {!isLoading && !isNil(get(card, "growth")) && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 border-none font-bold",
                        card.growth >= 0
                          ? "bg-green-500/10 text-green-600"
                          : "bg-red-500/10 text-red-600",
                      )}
                    >
                      {card.growth >= 0 ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      )}
                      {Math.abs(card.growth)}%
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-black tracking-tight">
                  {isLoading ? "..." : card.value}
                </p>
                <p className="mt-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="mt-4 text-xs text-muted-foreground/70 leading-relaxed italic">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daromad va xarajat</CardTitle>
              <CardDescription>
                Oylik revenue, expense va profit dinamikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenue.monthlyRevenue}>
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="profitGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip content={chartTooltip} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fill="url(#revenueGradient)"
                    name="Daromad"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    fill="url(#profitGradient)"
                    name="Foyda"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    fillOpacity={0}
                    name="Xarajat"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daromad manbalari</CardTitle>
              <CardDescription>
                Revenue oqimining asosiy segmentlari
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[300px,1fr]">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={revenue.revenueBySource}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {map(get(revenue, "revenueBySource", []), (entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={chartTooltip} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col gap-3">
                {map(get(revenue, "revenueBySource", []), (item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Revenue manbasi
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatUZS(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Kunlik tushum</CardTitle>
              <CardDescription>
                So'nggi kunlar bo'yicha daromad oqimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenue.dailyRevenue}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis dataKey="day" />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                  />
                  <Tooltip content={chartTooltip} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Kunlik tushum"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Qisqa indikatorlar</CardTitle>
              <CardDescription>Tanlangan davr bo'yicha jamlama</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Xarajat</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatUZS(get(revenue, "overview.totalExpenses"))}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Refund</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatUZS(get(revenue, "overview.refundAmount"))}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">
                  Successful transactions
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {get(revenue, "overview.successfulTransactions", 0)}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Xarajatlar soni</p>
                <p className="mt-1 text-lg font-semibold">
                  {size(get(revenue, "expenses", []))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Xarajatlar</h2>
                <p className="text-sm text-muted-foreground">
                  Tanlangan davr uchun operatsion expense ro'yxati
                </p>
              </div>
              <Button variant="outline" onClick={handleCreateOpen}>
                <ReceiptIcon data-icon="inline-start" />
                Xarajat qo'shish
              </Button>
            </div>
            <DataGridContainer>
              <ScrollArea className="w-full">
                <DataGrid table={expensesTable}>
                  <DataGridTable />
                </DataGrid>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">So'nggi tranzaksiyalar</h2>
              <p className="text-sm text-muted-foreground">
                Eng yangi payment harakatlari va holati
              </p>
            </div>
            <DataGridContainer>
              <ScrollArea className="w-full">
                <DataGrid table={transactionsTable}>
                  <DataGridTable />
                </DataGrid>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </DataGridContainer>
          </div>
        </div>

        <Drawer
          open={expenseDrawerOpen}
          onOpenChange={(open) => {
            setExpenseDrawerOpen(open);
            if (!open) {
              setEditingExpense(null);
              setExpenseForm(getDefaultExpenseForm());
            }
          }}
          direction="bottom"
        >
          <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto max-h-[90vh]">
            <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
              <DrawerHeader>
                <DrawerTitle>
                  {editingExpense ? "Xarajatni tahrirlash" : "Yangi xarajat"}
                </DrawerTitle>
                <DrawerDescription>
                  Revenue analytics uchun operatsion xarajat yozuvini saqlang
                </DrawerDescription>
              </DrawerHeader>
              <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Kategoriya</Label>
                  <Input
                    value={expenseForm.category}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    placeholder="Masalan: Marketing"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Summa</Label>
                  <Input
                    type="number"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sana</Label>
                  <Input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        expenseDate: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Izoh</Label>
                  <Textarea
                    value={expenseForm.notes}
                    onChange={(event) =>
                      setExpenseForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Kampaniya yoki izoh"
                  />
                </div>
              </div>
              <DrawerFooter className="gap-2 border-t bg-muted/5 p-6">
                <Button
                  onClick={handleExpenseSave}
                  disabled={isCreating || isUpdating}
                >
                  {editingExpense
                    ? isUpdating
                      ? "Saqlanmoqda..."
                      : "Saqlash"
                    : isCreating
                      ? "Qo'shilmoqda..."
                      : "Qo'shish"}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline">Bekor qilish</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>

        <AlertDialog
          open={Boolean(deleteExpenseCandidate)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteExpenseCandidate(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rostdan o'chirmoqchimisiz?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteExpenseCandidate ? (
                  <>
                    <span className="font-medium text-foreground">
                      {deleteExpenseCandidate.category}
                    </span>{" "}
                    expense yozuvi o'chiriladi.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleExpenseDelete}
              >
                O'chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default Revenue;
