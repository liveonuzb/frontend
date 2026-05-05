import React from "react";
import { RotateCcwIcon } from "lucide-react";
import PageTransition from "@/components/page-transition";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
  DataGridTableDndRows,
} from "@/components/reui/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const AdminListPageShell = ({ children, className }) => (
  <PageTransition>
    <div className={cn("flex w-full flex-col gap-6", className)}>
      {children}
    </div>
  </PageTransition>
);

export const AdminListHeader = ({
  icon: Icon,
  title,
  description,
  actions,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
      className,
    )}
  >
    <div className="flex flex-col gap-2">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        {Icon ? <Icon className="size-6 text-primary" aria-hidden="true" /> : null}
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);

export const AdminListToolbar = ({ filters, actions, className }) => (
  <div
    className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
      className,
    )}
  >
    {filters ? <div className="min-w-0 flex-1">{filters}</div> : <div />}
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);

export const AdminListRefetchButton = ({
  isFetching,
  onClick,
  className,
  ...props
}) => (
  <Button
    type="button"
    variant="outline"
    size="icon"
    onClick={onClick}
    className={cn("hidden sm:flex", className)}
    disabled={isFetching || props.disabled}
    {...props}
  >
    <RotateCcwIcon
      className={cn("size-4", isFetching && "animate-spin")}
      aria-hidden="true"
    />
    <span className="sr-only">Yangilash</span>
  </Button>
);

export const AdminListDataGrid = ({
  table,
  isLoading,
  recordCount,
  tableLayout,
  onRowClick,
  dataIds,
  onDragEnd,
  canUseDnd = false,
  reorderHint,
  paginationInfo,
  rowsPerPageLabel = "Sahifada:",
  sizes = [10, 25, 50, 100],
  paginationProps,
  children,
}) => (
  <DataGrid
    table={table}
    tableLayout={tableLayout}
    isLoading={isLoading}
    recordCount={recordCount}
    onRowClick={onRowClick}
  >
    <div className="flex w-full flex-col gap-2.5">
      <DataGridContainer>
        <ScrollArea className="w-full">
          {children ??
            (canUseDnd ? (
              <DataGridTableDndRows
                dataIds={dataIds}
                handleDragEnd={onDragEnd}
              />
            ) : (
              <DataGridTable />
            ))}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>
      {reorderHint ? (
        <div className="px-2 text-xs text-muted-foreground">{reorderHint}</div>
      ) : null}
      <DataGridPagination
        info={paginationInfo}
        rowsPerPageLabel={rowsPerPageLabel}
        sizes={sizes}
        {...paginationProps}
      />
    </div>
  </DataGrid>
);
