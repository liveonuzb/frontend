/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Columns3Icon,
  EyeIcon,
  RefreshCwIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DataGridColumnVisibility } from "./data-grid-column-visibility";

import { filter, map, toLower, toNumber, trim, take } from "lodash";

const DataGridContext = createContext(undefined);

function useDataGrid() {
  const context = useContext(DataGridContext);
  if (!context) {
    throw new Error("useDataGrid must be used within a DataGridProvider");
  }
  return context;
}

function DataGridProvider({ children, table, ...props }) {
  const hasExplicitRecordCount =
    props.recordCount !== undefined && props.recordCount !== null;
  const normalizedRecordCount = hasExplicitRecordCount
    ? toNumber(props.recordCount)
    : Number.NaN;
  const recordCount = Number.isFinite(normalizedRecordCount)
    ? normalizedRecordCount
    : (table.getFilteredRowModel?.().rows?.length ??
      table.getPrePaginationRowModel?.().rows?.length ??
      table.getRowModel?.().rows?.length ??
      0);

  return (
    <DataGridContext.Provider
      value={{
        props,
        table,
        recordCount,
        isLoading: props.isLoading || false,
      }}
    >
      {children}
    </DataGridContext.Provider>
  );
}

const canUseWindow = () => typeof window !== "undefined";

const getStorage = () => {
  if (!canUseWindow()) return null;
  if (
    !window.localStorage ||
    typeof window.localStorage.getItem !== "function"
  ) {
    return null;
  }
  return window.localStorage;
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const resolveGridStorageKey = (props) => {
  if (props.storageKey || props.gridId || props.id) {
    return String(props.storageKey || props.gridId || props.id);
  }

  if (!canUseWindow()) return "data-grid";

  return `data-grid:${window.location.pathname.replace(/[^a-z0-9]+/gi, ":")}`;
};

const getCurrentSearch = () => {
  if (!canUseWindow()) return "";
  return window.location.search.replace(/^\?/, "");
};

const applySearch = (search) => {
  if (!canUseWindow()) return;

  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
  window.history.pushState(null, "", nextUrl);
  window.dispatchEvent(
    typeof PopStateEvent === "function"
      ? new PopStateEvent("popstate")
      : new Event("popstate"),
  );
};

function DataGridSavedViews({ table, storageKey }) {
  const viewsStorageKey = `${storageKey}:views`;
  const columnsStorageKey = `${storageKey}:columns`;
  const [views, setViews] = useState(() =>
    safeParse(getStorage()?.getItem(viewsStorageKey), []),
  );
  const [viewName, setViewName] = useState("");

  useEffect(() => {
    const storage = getStorage();
    if (!storage) return;

    const persistedColumns = safeParse(
      storage.getItem(columnsStorageKey),
      null,
    );

    if (persistedColumns && typeof table.setColumnVisibility === "function") {
      table.setColumnVisibility(persistedColumns);
    }
  }, [columnsStorageKey, table]);

  const columnVisibility = table.getState().columnVisibility;

  useEffect(() => {
    const storage = getStorage();
    if (!storage) return;

    storage.setItem(columnsStorageKey, JSON.stringify(columnVisibility ?? {}));
  }, [columnVisibility, columnsStorageKey]);

  const persistViews = useCallback(
    (nextViews) => {
      setViews(nextViews);
      getStorage()?.setItem(viewsStorageKey, JSON.stringify(nextViews));
    },
    [viewsStorageKey],
  );

  const handleSaveView = useCallback(() => {
    const trimmedName = trim(viewName);
    if (!trimmedName) return;

    const nextView = {
      id: toLower(trimmedName).replace(/[^a-z0-9]+/gi, "-"),
      name: trimmedName,
      search: getCurrentSearch(),
      sorting: table.getState().sorting ?? [],
      pagination: {
        pageSize: table.getState().pagination?.pageSize,
      },
      columnVisibility: table.getState().columnVisibility ?? {},
      createdAt: Date.now(),
    };
    const nextViews = take([
      nextView,
      ...filter(views, (item) => item.id !== nextView.id),
    ], 8);

    persistViews(nextViews);
    setViewName("");
  }, [persistViews, table, viewName, views]);

  const handleApplyView = useCallback(
    (view) => {
      if (typeof table.setColumnVisibility === "function") {
        table.setColumnVisibility(view.columnVisibility ?? {});
      }
      if (typeof table.setSorting === "function") {
        table.setSorting(view.sorting ?? []);
      }
      if (
        view.pagination?.pageSize &&
        typeof table.setPageSize === "function"
      ) {
        table.setPageSize(view.pagination.pageSize);
      }
      applySearch(view.search ?? "");
    },
    [table],
  );

  const handleDeleteView = useCallback(
    (viewId) => {
      persistViews(filter(views, (item) => item.id !== viewId));
    },
    [persistViews, views],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <EyeIcon className="size-4" />
          Viewlar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Saqlangan viewlar</DropdownMenuLabel>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Input
            value={viewName}
            onChange={(event) => setViewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSaveView();
              }
            }}
            placeholder="View nomi"
            className="h-8"
          />
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0"
            disabled={!trim(viewName)}
            onClick={handleSaveView}
          >
            <SaveIcon className="size-3.5" />
          </Button>
        </div>
        <DropdownMenuSeparator />
        {views.length === 0 ? (
          <DropdownMenuItem disabled>Saqlangan view yo'q</DropdownMenuItem>
        ) : (
          map(views, (view) => (
            <div key={view.id} className="flex items-center gap-1 px-1">
              <DropdownMenuItem
                className="min-w-0 flex-1"
                onClick={() => handleApplyView(view)}
              >
                <span className="truncate">{view.name}</span>
              </DropdownMenuItem>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-lg"
                onClick={() => handleDeleteView(view.id)}
              >
                <span className="sr-only">Viewni o'chirish</span>
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DataGridToolbar() {
  const { props, recordCount, table, isLoading } = useDataGrid();
  const storageKey = useMemo(() => resolveGridStorageKey(props), [props]);
  const manualSorting = Boolean(table.options?.manualSorting);
  const manualPagination = Boolean(table.options?.manualPagination);
  const showServerBadge = manualSorting || manualPagination || props.serverSide;
  const visibleColumnCount = table.getVisibleFlatColumns().length;
  if (props.toolbar !== true) {
    return null;
  }

  return (
    <div className="mb-2.5 flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="rounded-xl font-medium">
          {isLoading ? "Yuklanmoqda" : `${recordCount} ta yozuv`}
        </Badge>
        {showServerBadge ? (
          <Badge variant="outline" className="rounded-xl font-medium">
            Server-side grid
          </Badge>
        ) : null}
        <span className="hidden sm:inline">
          {visibleColumnCount} ta ustun ko'rinyapti
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {typeof props.onRefresh === "function" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onRefresh}
            disabled={props.isRefreshing || isLoading}
          >
            <RefreshCwIcon
              className={cn(
                "size-4",
                (props.isRefreshing || isLoading) && "animate-spin",
              )}
            />
            Yangilash
          </Button>
        ) : null}
        <DataGridSavedViews table={table} storageKey={storageKey} />
        <DataGridColumnVisibility
          table={table}
          label="Ustunlar"
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Columns3Icon className="size-4" />
              Ustunlar
            </Button>
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => table.resetColumnVisibility?.()}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function DataGrid({ children, table, ...props }) {
  const defaultProps = {
    toolbar: true,
    loadingMode: "skeleton",
    tableLayout: {
      dense: false,
      cellBorder: false,
      rowBorder: true,
      rowRounded: false,
      stripped: false,
      headerSticky: false,
      headerBackground: true,
      headerBorder: true,
      width: "fixed",
      columnsVisibility: false,
      columnsResizable: false,
      columnsPinnable: false,
      columnsMovable: false,
      columnsDraggable: false,
      rowsDraggable: false,
    },
    tableClassNames: {
      base: "",
      header: "",
      headerRow: "",
      headerSticky: "sticky top-0 z-10 bg-background/90 backdrop-blur-xs",
      body: "",
      bodyRow: "",
      footer: "",
      edgeCell: "",
    },
  };

  const mergedProps = {
    ...defaultProps,
    ...props,
    tableLayout: {
      ...defaultProps.tableLayout,
      ...(props.tableLayout || {}),
    },
    tableClassNames: {
      ...defaultProps.tableClassNames,
      ...(props.tableClassNames || {}),
    },
  };

  // Ensure table is provided
  if (!table) {
    throw new Error('DataGrid requires a "table" prop');
  }

  return (
    <DataGridProvider table={table} {...mergedProps}>
      <DataGridToolbar />
      {children}
    </DataGridProvider>
  );
}

function DataGridContainer({ children, className, border = true }) {
  return (
    <div
      data-slot="data-grid"
      className={cn(
        "w-full overflow-hidden",
        border && "border-border rounded-2xl border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { useDataGrid, DataGridProvider, DataGrid, DataGridContainer };
