import React from "react";
import { useNavigate, Outlet } from "react-router";
import {
  get,
  isArray,
  join,
  toString,
  trim,
  filter as lodashFilter,
} from "lodash";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";
import { MedalIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import {
  useGetQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import PageTransition from "@/components/page-transition";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { useSpecializationFilters } from "./use-filters.js";
import { DeleteAlert } from "./delete-alert.jsx";

const QUERY_KEY = ["admin", "coach-specializations"];

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  if (isArray(message)) {
    return join(message, ", ");
  }
  return message || fallback;
};

const Index = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const {
    search,
    categoryFilter,
    statusFilter,
    filterFields,
    activeFilters,
    handleFiltersChange,
  } = useSpecializationFilters();

  const {
    data: specializationsData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuery({
    url: "/admin/coach-specializations",
    queryProps: {
      queryKey: QUERY_KEY,
    },
  });
  const allItems = get(specializationsData, "data.data", []);

  const { mutateAsync: patchItem, isPending: isUpdating } = usePatchQuery({
    queryKey: QUERY_KEY,
  });
  const { mutateAsync: removeItem, isPending: isDeleting } = useDeleteQuery({
    queryKey: QUERY_KEY,
  });

  const updateItem = React.useCallback(
    async (id, payload) =>
      patchItem({
        url: `/admin/coach-specializations/${id}`,
        attributes: payload,
      }),
    [patchItem],
  );

  const deleteItem = React.useCallback(
    async (id) =>
      removeItem({
        url: `/admin/coach-specializations/${id}`,
      }),
    [removeItem],
  );

  const [itemToDelete, setItemToDelete] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/coach-specializations", title: "Sport yo'nalishlari" },
    ]);
  }, [setBreadcrumbs]);

  const deferredSearch = React.useDeferredValue(search);

  const filteredItems = React.useMemo(() => {
    const searchValue = trim(deferredSearch).toLowerCase();

    return lodashFilter(allItems, (item) => {
      const matchesSearch =
        !searchValue ||
        (get(item, "nameUz", "") || "").toLowerCase().includes(searchValue) ||
        (get(item, "nameRu", "") || "").toLowerCase().includes(searchValue) ||
        (get(item, "nameEn", "") || "").toLowerCase().includes(searchValue) ||
        (get(item, "key", "") || "").toLowerCase().includes(searchValue);

      const matchesCategory =
        categoryFilter === "all" || get(item, "category") === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? get(item, "isActive")
          : !get(item, "isActive"));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [allItems, categoryFilter, deferredSearch, statusFilter]);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(get(itemToDelete, "id"));
      toast.success("Yo'nalish o'chirildi");
      setItemToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Yo'nalishni o'chirib bo'lmadi"));
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await updateItem(get(item, "id"), {
        isActive: !get(item, "isActive"),
      });
      toast.success("Status yangilandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Statusni yangilab bo'lmadi"));
    }
  };

  const columns = useColumns({
    isUpdating,
    onToggleActive: handleToggleActive,
    onEdit: (item) => navigate(`edit/${get(item, "id")}`),
    onDelete: setItemToDelete,
  });

  const table = useReactTable({
    data: filteredItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => toString(get(row, "id")),
  });

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MedalIcon className="text-primary" />
            Sport yo'nalishlari
          </h1>
          <p className="text-sm text-muted-foreground">
            Murabbiylar uchun sport yo'nalishlarini qo'shing va boshqaring
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Filter
            filterFields={filterFields}
            activeFilters={activeFilters}
            handleFiltersChange={handleFiltersChange}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="hidden sm:flex"
              disabled={isFetching}
            >
              <RotateCcwIcon
                className={cn("size-4", isFetching && "animate-spin")}
              />
            </Button>
            <Button onClick={() => navigate("create")} className="gap-1.5">
              <PlusIcon />
              Yo'nalish qo'shish
            </Button>
          </div>
        </div>

        <DataGridContainer>
          <ScrollArea className="w-full">
            <DataGrid
              table={table}
              isLoading={isLoading}
              recordCount={filteredItems.length}
            >
              <DataGridTable />
            </DataGrid>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DataGridContainer>

        <DeleteAlert
          item={itemToDelete}
          open={!!itemToDelete}
          onOpenChange={(open) => !open && setItemToDelete(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />

        <Outlet />
      </div>
    </PageTransition>
  );
};

export default Index;
