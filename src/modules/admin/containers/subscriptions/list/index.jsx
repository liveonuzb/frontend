import React from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { get, isArray, map } from "lodash";
import {
  CrownIcon,
  CalendarIcon,
  BanIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { useQueryClient } from "@tanstack/react-query";
import { useBreadcrumbStore } from "@/store";
import { useGetQuery, usePatchQuery } from "@/hooks/api";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useSubscriptionFilters } from "./use-filters.js";
import { CancelAlert } from "./delete-alert.jsx";

const ITEMS_PER_PAGE = 10;

const Index = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    currentPage,
    pageSize,
    filterFields,
    activeFilters,
    handleFiltersChange,
    search,
    statusFilter,
  } = useSubscriptionFilters();

  const [cancelCandidate, setCancelCandidate] = React.useState(null);
  const [extendCandidate, setExtendCandidate] = React.useState(null);
  const [extendDays, setExtendDays] = React.useState("30");

  const queryParams = React.useMemo(
    () => ({
      q: get(search, "length") ? search.trim() : undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
    [search, statusFilter, currentPage],
  );

  const queryClient = useQueryClient();

  const { data: subscriptionsData, isLoading } = useGetQuery({
    url: "/admin/subscriptions",
    params: queryParams,
    queryProps: {
      queryKey: ["admin", "subscriptions", queryParams],
    },
  });

  const subscriptions = get(subscriptionsData, "data.data", []);
  const stats = get(subscriptionsData, "data.meta.stats", {
    total: 0,
    active: 0,
    expired: 0,
    cancelled: 0,
  });

  const cancelMutation = usePatchQuery({
    queryKey: ["admin", "users"],
    listKey: ["admin", "dashboard"],
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        await queryClient.invalidateQueries({ queryKey: ["admin", "user-detail"] });
      },
    },
  });

  const extendMutation = usePatchQuery({
    queryKey: ["admin", "users"],
    listKey: ["admin", "dashboard"],
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
        await queryClient.invalidateQueries({ queryKey: ["admin", "user-detail"] });
      },
    },
  });

  const isUpdating = cancelMutation.isPending || extendMutation.isPending;

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/subscriptions", title: "Obunalar" },
    ]);
  }, [setBreadcrumbs]);

  const handleCancel = async () => {
    if (!cancelCandidate) return;
    try {
      await cancelMutation.mutateAsync({
        url: `/admin/subscriptions/${get(cancelCandidate, "id")}/cancel`,
        attributes: {},
      });
      toast.success("Obuna bekor qilindi");
      setCancelCandidate(null);
    } catch (_) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleExtend = async () => {
    if (!extendCandidate) return;
    try {
      const days = Number(extendDays);
      await extendMutation.mutateAsync({
        url: `/admin/subscriptions/${get(extendCandidate, "id")}/extend`,
        attributes: days ? { days } : {},
      });
      toast.success("Obuna muddati uzaytirildi");
      setExtendCandidate(null);
      setExtendDays("30");
    } catch (_) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const columns = useColumns({
    onExtend: setExtendCandidate,
    onCancel: setCancelCandidate,
  });

  const table = useReactTable({
    data: subscriptions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const statCards = [
    {
      label: "Jami",
      val: get(stats, "total"),
      icon: CrownIcon,
      color: "text-primary",
    },
    {
      label: "Faol",
      val: get(stats, "active"),
      icon: RefreshCwIcon,
      color: "text-green-500",
    },
    {
      label: "Tugagan",
      val: get(stats, "expired"),
      icon: CalendarIcon,
      color: "text-blue-500",
    },
    {
      label: "Bekor qilingan",
      val: get(stats, "cancelled"),
      icon: BanIcon,
      color: "text-red-500",
    },
  ];

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CrownIcon className="text-amber-500" />
            Obunalar boshqaruvi
          </h1>
          <p className="text-sm text-muted-foreground">
            Premium obunalarni ko'rish, muddatini uzaytirish va bekor qilish
            markazi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {map(statCards, (s, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black">
                    {isLoading ? "..." : s.val}
                  </p>
                </div>
                <div className={cn("p-2 rounded-lg bg-muted/50", s.color)}>
                  <s.icon />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 shadow-sm">
          <div className="bg-muted/20 pb-4 border-b p-4">
            <Filter
              filterFields={filterFields}
              activeFilters={activeFilters}
              handleFiltersChange={handleFiltersChange}
            />
          </div>
        </Card>

        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGrid table={table} isLoading={isLoading}>
              <DataGridTable />
            </DataGrid>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>

        {/* Extend Drawer */}
        <Drawer
          open={Boolean(extendCandidate)}
          onOpenChange={(open) => !open && setExtendCandidate(null)}
        >
          <DrawerContent className="max-w-md mx-auto">
            <DrawerHeader>
              <DrawerTitle>Obunani uzaytirish</DrawerTitle>
              <DrawerDescription>
                {get(extendCandidate, "user.firstName")} uchun obuna muddatini
                necha kunga uzaytirmoqchisiz?
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Kunlar soni</Label>
                <Input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(get(e, "target.value"))}
                  placeholder="30"
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleExtend} disabled={isUpdating}>
                Uzaytirish
              </Button>
              <Button
                variant="ghost"
                onClick={() => setExtendCandidate(null)}
              >
                Bekor qilish
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Cancel Dialog */}
        <CancelAlert
          subscription={cancelCandidate}
          open={Boolean(cancelCandidate)}
          onOpenChange={(open) => !open && setCancelCandidate(null)}
          onConfirm={handleCancel}
        />
      </div>
    </PageTransition>
  );
};

export default Index;
