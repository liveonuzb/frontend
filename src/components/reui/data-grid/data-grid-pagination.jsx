import { map, clamp } from "lodash";
import React from "react";
import { useDataGrid } from "@/components/reui/data-grid/data-grid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

function DataGridPagination(props) {
  const { table, recordCount, isLoading } = useDataGrid()

  const defaultProps = {
    sizes: [5, 10, 25, 50, 100],
    sizesLabel: "Show",
    sizesDescription: "per page",
    sizesSkeleton: <Skeleton className="h-8 w-44" />,
    moreLimit: 5,
    more: false,
    info: "{from} - {to} of {count}",
    infoSkeleton: <Skeleton className="h-8 w-60" />,
    rowsPerPageLabel: "Rows per page",
    previousPageLabel: "Go to previous page",
    nextPageLabel: "Go to next page",
    ellipsisText: "...",
  }

  const mergedProps = { ...defaultProps, ...props }

  const btnBaseClasses = "size-7 p-0 text-sm"
  const btnArrowClasses = btnBaseClasses + " rtl:transform rtl:rotate-180"
  const pagination = table.getState().pagination || {}
  const pageIndex = pagination.pageIndex ?? 0
  const pageSize = pagination.pageSize ?? mergedProps.sizes?.[0] ?? 10
  const safeRecordCount = Number.isFinite(recordCount) ? recordCount : 0
  const from = safeRecordCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = clamp((pageIndex + 1) * pageSize, 0, safeRecordCount)
  const pageCount = table.getPageCount()

  // Replace placeholders in paginationInfo
  const paginationInfo = mergedProps?.info
    ? mergedProps.info
        .replace("{from}", from.toString())
        .replace("{to}", to.toString())
        .replace("{count}", safeRecordCount.toString())
    : `${from} - ${to} of ${safeRecordCount}`

  // Pagination limit logic
  const paginationMoreLimit = mergedProps?.moreLimit || 5

  // Determine the start and end of the pagination group
  const currentGroupStart =
    Math.floor(pageIndex / paginationMoreLimit) * paginationMoreLimit
  const currentGroupEnd = Math.min(currentGroupStart + paginationMoreLimit, pageCount)

  // Render page buttons based on the current group
  const renderPageButtons = () => {
    const buttons = []
    for (let i = currentGroupStart; i < currentGroupEnd; i++) {
      buttons.push(<Button
        key={i}
        size="icon-sm"
        variant="ghost"
        className={cn(btnBaseClasses, "text-muted-foreground", {
          "bg-accent text-accent-foreground": pageIndex === i,
        })}
        onClick={() => {
          if (pageIndex !== i) {
            table.setPageIndex(i)
          }
        }}>
        {i + 1}
      </Button>)
    }
    return buttons
  }

  // Render a "previous" ellipsis button if there are previous pages to show
  const renderEllipsisPrevButton = () => {
    if (currentGroupStart > 0) {
      return (
        <Button
          size="icon-sm"
          className={btnBaseClasses}
          variant="ghost"
          onClick={() => table.setPageIndex(currentGroupStart - 1)}>
          {mergedProps.ellipsisText}
        </Button>
      );
    }
    return null
  }

  // Render a "next" ellipsis button if there are more pages to show after the current group
  const renderEllipsisNextButton = () => {
    if (currentGroupEnd < pageCount) {
      return (
        <Button
          className={btnBaseClasses}
          variant="ghost"
          size="icon-sm"
          onClick={() => table.setPageIndex(currentGroupEnd)}>
          {mergedProps.ellipsisText}
        </Button>
      );
    }
    return null
  }

  return (
    <div
      data-slot="data-grid-pagination"
      className={cn(
        "flex grow flex-col flex-wrap items-center justify-between gap-2.5 py-2.5 sm:flex-row sm:py-0",
        mergedProps?.className
      )}>
      <div
        className="order-2 flex flex-wrap items-center space-x-2.5 pb-2.5 sm:order-1 sm:pb-0">
        {isLoading ? (
          mergedProps?.sizesSkeleton
        ) : (
          <>
            <div className="text-muted-foreground text-sm">
              {mergedProps.rowsPerPageLabel}
            </div>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                const newPageSize = Number(value)
                table.setPageSize(newPageSize)
              }}>
              <SelectTrigger className="w-18" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top" className="min-w-18">
                {map(mergedProps?.sizes, (size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      <div
        className="order-1 flex flex-col items-center justify-center gap-2.5 pt-2.5 sm:order-2 sm:flex-row sm:justify-end sm:pt-0">
        {isLoading ? (
          mergedProps?.infoSkeleton
        ) : (
          <>
            <div className="text-muted-foreground text-sm order-2 text-nowrap sm:order-1">
              {paginationInfo}
            </div>
            {pageCount > 1 && (
              <div className="order-1 flex items-center space-x-1 sm:order-2">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className={btnArrowClasses}
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}>
                  <span className="sr-only">
                    {mergedProps.previousPageLabel}
                  </span>
                  <ChevronLeftIcon className="size-4" />
                </Button>

                {renderEllipsisPrevButton()}

                {renderPageButtons()}

                {renderEllipsisNextButton()}

                <Button
                  size="icon-sm"
                  variant="ghost"
                  className={btnArrowClasses}
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}>
                  <span className="sr-only">{mergedProps.nextPageLabel}</span>
                  <ChevronRightIcon className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export { DataGridPagination };
