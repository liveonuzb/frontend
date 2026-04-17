import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeftIcon,
  CalendarPlusIcon,
  ClockIcon as LucideClockIcon,
  DropletsIcon,
  DumbbellIcon,
  MoonIcon,
  SaladIcon,
  SearchIcon,
  TargetIcon,
  UtensilsCrossedIcon,
  WalletCardsIcon,
  WeightIcon,
  XCircleIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAuthStore, useBreadcrumbStore } from "@/store";
import { useCoachClientDetail } from "@/hooks/app/use-coach.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import { toast } from "sonner";
import ClientAISummaryWidget from "./components/ai-summary-widget";
import { cn } from "@/lib/utils";
import SectionCard from "@/components/reui/section-card";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
  });
};

const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CoachClientDetailContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    detail,
    isLoading,
    isError,
    refetch,
    updateClientPricing,
    isUpdatingClientPricing,
    removeClient,
    isRemovingClient,
    cancelPayment,
  } = useCoachClientDetail(id);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = React.useState(false);
  const [pricingAmount, setPricingAmount] = React.useState("");
  const [isPricingDirty, setIsPricingDirty] = React.useState(false);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/clients", title: "Mijozlar" },
      {
        url: `/coach/clients/${id}`,
        title: get(detail, "client.name") || "Mijoz",
      },
    ]);
  }, [get(detail, "client.name"), id, setBreadcrumbs]);

  if (isError) {
    return (
      <Card className="py-6">
        <CardContent className="flex flex-col items-start gap-4">
          <Button variant="ghost" onClick={() => navigate("/coach/clients")}>
            <ArrowLeftIcon className="mr-2 size-4" />
            Mijozlarga qaytish
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Mijoz topilmadi</h1>
            <p className="text-sm text-muted-foreground">
              Mijoz tafsilotlarini yuklab bo'lmadi.
            </p>
          </div>
          <Button onClick={() => refetch()}>Qayta urinish</Button>
        </CardContent>
      </Card>
    );
  }

  const client = get(detail, "client");
  const measurements = get(detail, "measurements") ?? [];
  const dailyLogs = get(detail, "dailyLogs") ?? [];
  const assignedTemplates = get(detail, "assignedTemplates") ?? [];

  const latestLog = dailyLogs[0];
  const paymentSummary = get(detail, "overview.paymentSummary") ?? null;
  const pricingAmountRaw = trim(String(pricingAmount ?? ""));
  const hasPricingAmount = pricingAmountRaw !== "";
  const pricingAmountNumber = Number(pricingAmountRaw);
  const isPricingAmountValid =
    !hasPricingAmount ||
    (Number.isFinite(pricingAmountNumber) && pricingAmountNumber >= 0);
  const currentPricingAmountRaw =
    get(paymentSummary, "agreedAmount") !== null &&
    get(paymentSummary, "agreedAmount") !== undefined
      ? String(paymentSummary.agreedAmount)
      : "";
  const isPricingChanged =
    isPricingDirty && pricingAmountRaw !== currentPricingAmountRaw;

  React.useEffect(() => {
    if (isPricingDirty) return;
    setPricingAmount(currentPricingAmountRaw);
  }, [currentPricingAmountRaw, isPricingDirty]);


  const handleRemoveClient = async () => {
    try {
      await removeClient();
      toast.success("Shogirt ro'yxatdan chiqarildi");
      navigate("/coach/clients");
    } catch (error) {
      toast.error(
        get(error, "response.data.message") ||
          "Shogirtni chiqarib bo'lmadi",
      );
    }
  };

  const paymentColumns = React.useMemo(
    () => [
      {
        accessorKey: "paidAt",
        header: "Sana",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: "amount",
        header: "Summa",
        cell: ({ getValue }) => formatMoney(getValue()),
      },
      {
        accessorKey: "note",
        header: "Izoh",
        cell: ({ getValue }) => getValue() || "—",
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (confirm("Bu to'lovni bekor qilmoqchimisiz?")) {
                  void cancelPayment(row.original.id);
                }
              }}
            >
              <XCircleIcon className="size-4 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [cancelPayment],
  );

  const paymentTable = useReactTable({
    data: detail.payments ?? [],
    columns: paymentColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleUpdatePricing = async () => {
    if (!isPricingAmountValid) {
      toast.error("Narxni to'g'ri kiriting yoki bo'sh qoldiring.");
      return;
    }

    try {
      await updateClientPricing({
        agreedAmount: hasPricingAmount ? Math.round(pricingAmountNumber) : null,
      });
      toast.success(
        hasPricingAmount
          ? "Mijoz narxi yangilandi."
          : "Mijoz narxi kelishuv asosida qoldirildi.",
      );
      setIsPricingDirty(false);
      setIsPricingOpen(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Mijoz narxini yangilab bo'lmadi",
      );
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/coach/clients")}>
        <ArrowLeftIcon className="mr-2 size-4" />
        Mijozlarga qaytish
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden border-none shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-orange-500/5" />
          <div className="absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-[100px]" />
          
          <CardContent className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              {isLoading ? (
                <Skeleton className="size-24 rounded-full" />
              ) : (
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-orange-400 blur-sm opacity-50" />
                  <Avatar className="size-24 border-4 border-background shadow-xl">
                    <AvatarImage src={client?.avatar} alt={client?.name} />
                    <AvatarFallback className="text-xl font-black">
                      {getInitials(client?.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="space-y-1.5">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-black tracking-tight">{client?.name}</h1>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {client.status === "active" ? "Faol" : client.status === "paused" ? "Pauza" : "Faolsiz"}
                      </Badge>
                    </div>
                    <p className="text-base text-muted-foreground font-medium">
                      {client?.email || client?.phone || "Kontakt ma'lumotlari yo'q"}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="outline" className="rounded-lg py-1">
                        <TargetIcon className="mr-1.5 size-3" />
                        {client.goal || "Maqsad belgilanmagan"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isLoading && client && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-2xl font-bold bg-background/50 backdrop-blur-md"
                  onClick={() => {
                    setPricingAmount(currentPricingAmountRaw);
                    setIsPricingDirty(false);
                    setIsPricingOpen(true);
                  }}
                >
                  Narxni yangilash
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="h-11 rounded-2xl font-bold shadow-lg shadow-destructive/20"
                  onClick={() => setIsRemoveOpen(true)}
                >
                  Ro&apos;yxatdan chiqarish
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Progress",
            value: `${client?.progress ?? 0}%`,
            icon: TargetIcon,
            color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
          },
          {
            label: "Joriy vazn",
            value: client?.currentWeight != null ? `${client.currentWeight} kg` : "—",
            icon: WeightIcon,
            color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          },
          {
            label: "Bugungi suv",
            value: latestLog?.waterMl != null ? `${latestLog.waterMl} ml` : "—",
            icon: DropletsIcon,
            color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
          },
          {
            label: "Kaloriya",
            value: latestLog?.calories != null ? `${latestLog.calories} kcal` : "—",
            icon: UtensilsCrossedIcon,
            color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * (idx + 1) }}
          >
            <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-none bg-card/60 backdrop-blur-sm">
              <CardContent className="flex flex-col gap-4 p-6">
                <div className={cn("flex size-10 items-center justify-center rounded-xl border-2 transition-transform group-hover:scale-110 shadow-sm", item.color)}>
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">{item.label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-8 w-24 rounded-lg" />
                  ) : (
                    <p className="mt-0.5 text-2xl font-black tabular-nums tracking-tight">{item.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!isLoading && client && (
        <ClientAISummaryWidget clientName={client.name} clientId={client.id} />
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="py-6">
          <CardHeader>
            <CardTitle>Vazn progressi</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : measurements.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground bg-muted/5">
                O&apos;lchamlar kiritilmagan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={measurements}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border bg-background/95 p-3 shadow-xl backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              {formatDate(label)}
                            </p>
                            <p className="text-sm font-black text-primary">
                              {payload[0].value} <span className="text-[10px] font-normal text-muted-foreground">kg</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    minTickGap={30}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="hsl(var(--muted-foreground) / 0.1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    dot={{
                      r: 4,
                      fill: "hsl(var(--background))",
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "hsl(var(--primary))",
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="py-6">
          <CardHeader>
            <CardTitle>Biriktirilgan template'lar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={`assigned-template-skeleton-${index}`}
                  className="h-20 w-full rounded-2xl"
                />
              ))
            ) : assignedTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground bg-muted/5">
                Hozircha template biriktirilmagan.
              </div>
            ) : (
              <div className="grid gap-3">
                {assignedTemplates.map((plan) => {
                  const isWorkout = plan.type === "WORKOUT" || plan.title?.toLowerCase().includes("workout") || plan.title?.toLowerCase().includes("mashq");
                  return (
                    <div
                      key={plan.id}
                      className="group flex items-start gap-4 rounded-2xl border bg-card p-4 transition-all hover:bg-muted/30 hover:shadow-md"
                    >
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-transform group-hover:scale-110",
                        isWorkout 
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-600" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                      )}>
                        {isWorkout ? <DumbbellIcon className="size-5" /> : <SaladIcon className="size-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold tracking-tight">
                            {plan.title}
                          </p>
                          <Badge variant="outline" className="h-5 text-[10px] px-1.5 shrink-0 bg-background/50 backdrop-blur-sm">
                            {isWorkout ? "Mashq" : "Taomnoma"}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                          {plan.description || "Tavsif berilmagan."}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground/70">
                          <div className="flex items-center gap-1">
                            <LucideClockIcon className="size-3" />
                            {formatDate(plan.assignedAt)}
                          </div>
                          {plan.status && (
                            <div className="flex items-center gap-1 font-medium capitalize">
                              <div className={cn("size-1.5 rounded-full", plan.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                              {plan.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="py-6">
          <CardHeader>
            <CardTitle>Profil va goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Joriy vazn</p>
                    <p className="font-medium">
                      {client?.currentWeight ?? "—"} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Maqsad vazni</p>
                    <p className="font-medium">
                      {client?.targetWeight ?? "—"} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Boshlangan sana</p>
                    <p className="font-medium">{formatDate(client?.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sleep</p>
                    <p className="font-medium flex items-center gap-2">
                      <MoonIcon className="size-4 text-muted-foreground" />
                      {latestLog?.sleepHours ?? "—"} soat
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bio</p>
                  <p className="mt-1 text-sm leading-6">
                    {detail?.overview?.bio || "Bio kiritilmagan."}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      <SectionCard 
        title="To'lovlar tarixi" 
        description="Mijoz tomonidan qilingan barcha to'lovlar ro'yxati"
        badge={detail.payments?.length ?? 0}
        className="mt-6"
      >
        <DataGridContainer>
          <DataGrid
            table={paymentTable}
            isLoading={isLoading}
            recordCount={detail.payments?.length ?? 0}
            loadingMode="spinner"
            emptyMessage="To'lovlar tarixi mavjud emas."
          >
            <DataGridTable />
          </DataGrid>
        </DataGridContainer>
      </SectionCard>

      <Drawer open={isPricingOpen} onOpenChange={setIsPricingOpen} direction="bottom">
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
          <DrawerHeader className="px-6 py-4">
            <DrawerTitle>Mijoz narxini belgilash</DrawerTitle>
            <DrawerDescription>
              Har bir mijoz uchun alohida narx belgilashingiz mumkin.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-6 py-4">
            <div className="space-y-2">
              <Label>Kelishilgan summa (so&apos;m)</Label>
              <NumberField
                minValue={0}
                step={10000}
                value={pricingAmount !== "" ? Number(pricingAmount) : undefined}
                onValueChange={(value) => {
                  setPricingAmount(
                    value !== undefined ? String(Math.round(value)) : "",
                  );
                  setIsPricingDirty(true);
                }}
                formatOptions={{
                  useGrouping: true,
                  maximumFractionDigits: 0,
                }}
              >
                <NumberFieldGroup className="h-11 rounded-2xl bg-card">
                  <NumberFieldDecrement className="rounded-s-2xl px-3" />
                  <NumberFieldInput
                    className="px-3 text-sm"
                    placeholder="Kelishiladi (bo'sh qoldiring)"
                  />
                  <NumberFieldIncrement className="rounded-e-2xl px-3" />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </div>
          <DrawerFooter className="px-6 py-4">
            <Button
              onClick={handleUpdatePricing}
              disabled={
                !isPricingAmountValid ||
                !isPricingChanged ||
                isUpdatingClientPricing
              }
            >
              {isUpdatingClientPricing ? "Saqlanmoqda..." : "Narxni saqlash"}
            </Button>
            <Button variant="outline" onClick={() => setIsPricingOpen(false)}>
              Bekor qilish
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Shogirtni ro&apos;yxatdan chiqarasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Siz va shogirt bir-biringiz ro&apos;yxatidan chiqasiz. Siz yuborgan
              coach rejalari userda oddiy reja bo&apos;lib qoladi, lekin endi sync
              qilinmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRemoveClient();
              }}
              disabled={isRemovingClient}
            >
              {isRemovingClient ? "Chiqarilmoqda..." : "Ro'yxatdan chiqarish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
