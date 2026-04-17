"use client"

import { find, map, times } from "lodash";
import { Fragment } from "react";
import { useDataGrid } from "@/components/reui/data-grid/data-grid"
import { flexRender } from "@tanstack/react-table";
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

const headerCellSpacingVariants = cva("", {
  variants: {
    size: {
      dense:
        "px-2.5 h-9",
      default:
        "px-4",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const bodyCellSpacingVariants = cva("", {
  variants: {
    size: {
      dense:
        "px-2.5 py-2",
      default:
        "px-4 py-2.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

function getPinningStyles(column) {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}

function DataGridTableBase({
  children
}) {
  const { props, table } = useDataGrid()

  return (
    <table
      data-slot="data-grid-table"
      className={cn(
        "text-foreground text-sm w-full min-w-full caption-bottom text-left align-middle font-normal rtl:text-right",
        props.tableLayout?.width === "auto" ? "table-auto" : "table-fixed",
        !props.tableLayout?.columnsResizable && "",
        !props.tableLayout?.columnsDraggable &&
          "border-separate border-spacing-0",
        props.tableClassNames?.base
      )}
      style={
        props.tableLayout?.columnsResizable
          ? { width: table.getTotalSize() }
          : undefined
      }>
      {children}
    </table>
  );
}

function DataGridTableHead({
  children
}) {
  const { props } = useDataGrid()

  return (
    <thead
      className={cn(
        props.tableClassNames?.header,
        props.tableLayout?.headerSticky && props.tableClassNames?.headerSticky
      )}>
      {children}
    </thead>
  );
}

function DataGridTableHeadRow(
  {
    children,
    headerGroup
  }
) {
  const { props } = useDataGrid()

  return (
    <tr
      key={headerGroup.id}
      className={cn(
        "bg-muted/40",
        props.tableLayout?.headerBorder && "[&>th]:border-b",
        props.tableLayout?.cellBorder && "*:last:border-e-0",
        props.tableLayout?.stripped && "bg-transparent",
        props.tableLayout?.headerBackground === false && "bg-transparent",
        props.tableClassNames?.headerRow
      )}>
      {children}
    </tr>
  );
}

function DataGridTableHeadRowCell(
  {
    children,
    header,
    dndRef,
    dndStyle
  }
) {
  const { props } = useDataGrid()

  const { column } = header
  const isPinned = column.getIsPinned()
  const isLastLeftPinned = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinned =
    isPinned === "right" && column.getIsFirstColumn("right")
  const headerCellSpacing = headerCellSpacingVariants({
    size: props.tableLayout?.dense ? "dense" : "default",
  })

  return (
    <th
      key={header.id}
      ref={dndRef}
      style={{
        ...((props.tableLayout?.width === "fixed" ||
          props.tableLayout?.columnsResizable) && {
          width: header.getSize(),
        }),
        ...(props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          getPinningStyles(column)),
        ...(dndStyle ? dndStyle : null),
      }}
      data-pinned={isPinned || undefined}
      data-last-col={
        isLastLeftPinned ? "left" : isFirstRightPinned ? "right" : undefined
      }
      className={cn(
        "text-secondary-foreground/80 h-10 relative text-left align-middle font-normal rtl:text-right [&:has([role=checkbox])]:pe-0",
        headerCellSpacing,
        props.tableLayout?.cellBorder && "border-e",
        props.tableLayout?.columnsResizable &&
          column.getCanResize() &&
          "truncate",
        props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          cn(
            "[&[data-pinned][data-last-col]]:border-border data-pinned:bg-muted/90 data-pinned:backdrop-blur-xs [&:not([data-pinned]):has(+[data-pinned])_div.cursor-col-resize:last-child]:opacity-0 [&[data-last-col=left]_div.cursor-col-resize:last-child]:opacity-0",
            !column.columnDef.meta?.noPinnedBorder &&
              "[&[data-pinned=left][data-last-col=left]]:border-e! [&[data-pinned=right]:last-child_div.cursor-col-resize:last-child]:opacity-0 [&[data-pinned=right][data-last-col=right]]:border-s!",
          ),
        header.column.columnDef.meta?.headerClassName,
        column.getIndex() === 0 ||
          column.getIndex() === header.headerGroup.headers.length - 1
          ? props.tableClassNames?.edgeCell
          : ""
      )}>
      {children}
    </th>
  );
}

function DataGridTableHeadRowCellResize(
  {
    header
  }
) {
  const { column } = header

  return (
    <div
      {...{
        onDoubleClick: () => column.resetSize(),
        onMouseDown: header.getResizeHandler(),
        onTouchStart: header.getResizeHandler(),
        className:
          "absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -end-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:-translate-x-px",
      }} />
  );
}

function DataGridTableRowSpacer() {
  return <tbody aria-hidden="true" className="h-2"></tbody>;
}

function DataGridTableBody({
  children
}) {
  const { props } = useDataGrid()

  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", props.tableLayout?.rowRounded &&
        "[&_td:first-child]:rounded-l-none", props.tableLayout?.rowRounded &&
        "[&_td:last-child]:rounded-r-none", props.tableClassNames?.body)}>
      {children}
    </tbody>
  );
}

function DataGridTableBodyRowSkeleton({
  children
}) {
  const { table, props } = useDataGrid()

  return (
    <tr
      className={cn(
        "hover:bg-muted/40 data-[state=selected]:bg-muted/50",
        (props.onRowClick || props.onRowDoubleClick) && "cursor-pointer",
        !props.tableLayout?.stripped &&
          props.tableLayout?.rowBorder &&
          "border-border border-b [&:not(:last-child)>td]:border-b",
        props.tableLayout?.cellBorder && "*:last:border-e-0",
        props.tableLayout?.stripped &&
          "odd:bg-muted/90 odd:hover:bg-muted hover:bg-transparent",
        table.options.enableRowSelection && "*:first:relative",
        props.tableClassNames?.bodyRow
      )}>
      {children}
    </tr>
  );
}

function DataGridTableBodyRowSkeletonCell(
  {
    children,
    column
  }
) {
  const { props, table } = useDataGrid()
  const bodyCellSpacing = bodyCellSpacingVariants({
    size: props.tableLayout?.dense ? "dense" : "default",
  })

  return (
    <td
      style={
        props.tableLayout?.columnsResizable
          ? { width: column.getSize() }
          : undefined
      }
      className={cn(
        "align-middle",
        bodyCellSpacing,
        props.tableLayout?.cellBorder && "border-e",
        props.tableLayout?.columnsResizable &&
          column.getCanResize() &&
          "truncate",
        column.columnDef.meta?.cellClassName,
        props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          cn(
            "[&[data-pinned][data-last-col]]:border-border data-pinned:bg-background/90 data-pinned:backdrop-blur-xs",
            !column.columnDef.meta?.noPinnedBorder &&
              "[&[data-pinned=left][data-last-col=left]]:border-e! [&[data-pinned=right][data-last-col=right]]:border-s!",
          ),
        column.getIndex() === 0 ||
          column.getIndex() === table.getVisibleFlatColumns().length - 1
          ? props.tableClassNames?.edgeCell
          : ""
      )}>
      {children}
    </td>
  );
}

function DataGridTableBodyRow(
  {
    children,
    row,
    dndRef,
    dndStyle
  }
) {
  const { props, table } = useDataGrid()

  return (
    <tr
      ref={dndRef}
      style={{ ...(dndStyle ? dndStyle : null) }}
      data-state={
        table.options.enableRowSelection && row.getIsSelected()
          ? "selected"
          : undefined
      }
      onClick={() => props.onRowClick && props.onRowClick(row.original)}
      onDoubleClick={() => props.onRowDoubleClick && props.onRowDoubleClick(row.original)}
      className={cn(
        "hover:bg-muted/40 data-[state=selected]:bg-muted/50",
        (props.onRowClick || props.onRowDoubleClick) && "cursor-pointer",
        !props.tableLayout?.stripped &&
          props.tableLayout?.rowBorder &&
          "border-border border-b [&:not(:last-child)>td]:border-b",
        props.tableLayout?.cellBorder && "*:last:border-e-0",
        props.tableLayout?.stripped &&
          "odd:bg-muted/90 odd:hover:bg-muted hover:bg-transparent",
        table.options.enableRowSelection && "*:first:relative",
        props.tableClassNames?.bodyRow
      )}>
      {children}
    </tr>
  );
}

function DataGridTableBodyRowExpandded(
  {
    row
  }
) {
  const { props, table } = useDataGrid()
  const expandedColumn = find(
    table.getAllColumns(),
    (column) => column.columnDef.meta?.expandedContent
  )

  if (!expandedColumn) {
    return null
  }

  return (
    <tr
      className={cn(props.tableLayout?.rowBorder && "[&:not(:last-child)>td]:border-b")}>
      <td colSpan={row.getVisibleCells().length}>
        {expandedColumn.columnDef.meta?.expandedContent?.(row.original)}
      </td>
    </tr>
  );
}

function DataGridTableBodyRowCell(
  {
    children,
    cell,
    dndRef,
    dndStyle
  }
) {
  const { props } = useDataGrid()

  const { column, row } = cell
  const isPinned = column.getIsPinned()
  const isLastLeftPinned = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinned =
    isPinned === "right" && column.getIsFirstColumn("right")
  const bodyCellSpacing = bodyCellSpacingVariants({
    size: props.tableLayout?.dense ? "dense" : "default",
  })

  return (
    <td
      key={cell.id}
      ref={dndRef}
      {...(props.tableLayout?.columnsDraggable && !isPinned ? { cell } : {})}
      style={{
        ...(props.tableLayout?.columnsResizable && {
          width: column.getSize(),
        }),
        ...(props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          getPinningStyles(column)),
        ...(dndStyle ? dndStyle : null),
      }}
      data-pinned={isPinned || undefined}
      data-last-col={
        isLastLeftPinned ? "left" : isFirstRightPinned ? "right" : undefined
      }
      className={cn(
        "align-middle",
        bodyCellSpacing,
        props.tableLayout?.cellBorder && "border-e",
        props.tableLayout?.columnsResizable &&
          column.getCanResize() &&
          "truncate",
        cell.column.columnDef.meta?.cellClassName,
        props.tableLayout?.columnsPinnable &&
          column.getCanPin() &&
          cn(
            "[&[data-pinned][data-last-col]]:border-border data-pinned:bg-background/90 data-pinned:backdrop-blur-xs",
            !column.columnDef.meta?.noPinnedBorder &&
              "[&[data-pinned=left][data-last-col=left]]:border-e! [&[data-pinned=right][data-last-col=right]]:border-s!",
          ),
        column.getIndex() === 0 ||
          column.getIndex() === row.getVisibleCells().length - 1
          ? props.tableClassNames?.edgeCell
          : ""
      )}>
      {children}
    </td>
  );
}

function DataGridTableEmpty() {
  const { table, props } = useDataGrid()
  const totalColumns = table.getAllColumns().length

  return (
    <tr>
      <td
        colSpan={totalColumns}
        className="text-muted-foreground text-sm py-6 text-center">
        {props.emptyMessage || "No data available"}
      </td>
    </tr>
  );
}

function DataGridTableLoader() {
  const { props } = useDataGrid()

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        className="text-muted-foreground bg-card rounded-2xl text-sm flex items-center gap-2 border px-4 py-2 leading-none font-medium">
        <svg
          className="text-muted-foreground -ml-1 h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {props.loadingMessage || "Loading..."}
      </div>
    </div>
  );
}

function DataGridTableRowSelect(
  {
    row
  }
) {
  return (
    <>
      <div
        className={cn(
          "bg-primary absolute start-0 top-0 bottom-0 hidden w-[2px]",
          row.getIsSelected() && "block"
        )}></div>
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="align-[inherit]" />
      </div>
    </>
  );
}

function DataGridTableRowSelectAll() {
  const { table, recordCount, isLoading } = useDataGrid()

  const isAllSelected = table.getIsAllPageRowsSelected()
  const isSomeSelected = table.getIsSomePageRowsSelected()

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Checkbox
        checked={
          isSomeSelected && !isAllSelected ? "indeterminate" : isAllSelected
        }
        disabled={isLoading || recordCount === 0}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="align-[inherit]" />
    </div>
  );
}

function DataGridTable() {
  const { table, isLoading, props } = useDataGrid()
  const pagination = table.getState().pagination

  return (
    <DataGridTableBase>
      <DataGridTableHead>
        {map(table.getHeaderGroups(), (headerGroup, index) => {
            return (
              <DataGridTableHeadRow headerGroup={headerGroup} key={index}>
                {map(headerGroup.headers, (header, index) => {
                  const { column } = header

                  return (
                    <DataGridTableHeadRowCell header={header} key={index}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {props.tableLayout?.columnsResizable &&
                        column.getCanResize() && (
                          <DataGridTableHeadRowCellResize header={header} />
                        )}
                    </DataGridTableHeadRowCell>
                  );
                })}
              </DataGridTableHeadRow>
            );
          })}
      </DataGridTableHead>
      {(props.tableLayout?.stripped || !props.tableLayout?.rowBorder) && (
        <DataGridTableRowSpacer />
      )}
      <DataGridTableBody>
        {isLoading &&
        props.loadingMode === "skeleton" &&
        pagination?.pageSize ? (
          // Show skeleton loading immediately
          (times(pagination.pageSize, (rowIndex) => (
            <DataGridTableBodyRowSkeleton key={rowIndex}>
              {map(table.getVisibleFlatColumns(), (column, colIndex) => {
                return (
                  <DataGridTableBodyRowSkeletonCell column={column} key={colIndex}>
                    {column.columnDef.meta?.skeleton}
                  </DataGridTableBodyRowSkeletonCell>
                );
              })}
            </DataGridTableBodyRowSkeleton>
          )))
        ) : isLoading && props.loadingMode === "spinner" ? (
          // Show spinner loading immediately
          (<tr>
            <td colSpan={table.getVisibleFlatColumns().length} className="p-8">
              <div className="flex items-center justify-center">
                <svg
                  className="text-muted-foreground mr-3 -ml-1 h-5 w-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {props.loadingMessage || "Loading..."}
              </div>
            </td>
          </tr>)
        ) : table.getRowModel().rows.length ? (
          // Show actual data when not loading
          (map(table.getRowModel().rows, (row, index) => {
            return (
              <Fragment key={row.id}>
                <DataGridTableBodyRow row={row} key={index}>
                  {map(row.getVisibleCells(), (cell, colIndex) => {
                      return (
                        <DataGridTableBodyRowCell cell={cell} key={colIndex}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </DataGridTableBodyRowCell>
                      );
                    })}
                </DataGridTableBodyRow>
                {row.getIsExpanded() && (
                  <DataGridTableBodyRowExpandded row={row} />
                )}
              </Fragment>
            );
          }))
        ) : (
          <DataGridTableEmpty />
        )}
      </DataGridTableBody>
    </DataGridTableBase>
  );
}

export {
  DataGridTable,
  DataGridTableBase,
  DataGridTableBody,
  DataGridTableBodyRow,
  DataGridTableBodyRowCell,
  DataGridTableBodyRowExpandded,
  DataGridTableBodyRowSkeleton,
  DataGridTableBodyRowSkeletonCell,
  DataGridTableEmpty,
  DataGridTableHead,
  DataGridTableHeadRow,
  DataGridTableHeadRowCell,
  DataGridTableHeadRowCellResize,
  DataGridTableLoader,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
  DataGridTableRowSpacer,
}
