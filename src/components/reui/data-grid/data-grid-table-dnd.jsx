import { times, map } from "lodash";
import { Fragment, useId, useRef } from "react";
import { useDataGrid } from "@/components/reui/data-grid/data-grid"
import {
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
  DataGridTableRowSpacer,
} from "@/components/reui/data-grid/data-grid-table"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { flexRender } from "@tanstack/react-table";

import { Button } from "@/components/ui/button"
import { GripVerticalIcon } from "lucide-react"

function DataGridTableDndHeader(
  {
    header
  }
) {
  const { props } = useDataGrid()
  const { column } = header

  // Check if column ordering is enabled for this column
  const canOrder =
    (column.columnDef)
      .enableColumnOrdering !== false

  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: header.column.id,
  })

  const style = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition,
    whiteSpace: "nowrap",
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <DataGridTableHeadRowCell header={header} dndStyle={style} dndRef={setNodeRef}>
      <div className="flex items-center justify-start gap-0.5">
        {canOrder && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="-ms-2 size-6 cursor-move"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder">
            <GripVerticalIcon className="opacity-60 hover:opacity-100" aria-hidden="true" />
          </Button>
        )}
        <span className="grow truncate">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {props.tableLayout?.columnsResizable && column.getCanResize() && (
          <DataGridTableHeadRowCellResize header={header} />
        )}
      </div>
    </DataGridTableHeadRowCell>
  );
}

function DataGridTableDndCell(
  {
    cell
  }
) {
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: cell.column.id,
  })

  const style = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition,
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <DataGridTableBodyRowCell cell={cell} dndStyle={style} dndRef={setNodeRef}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </DataGridTableBodyRowCell>
  );
}

function DataGridTableDnd(
  {
    handleDragEnd
  }
) {
  const { table, isLoading, props } = useDataGrid()
  const pagination = table.getState().pagination
  const containerRef = useRef(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // Custom modifier to restrict dragging within table bounds with edge offset
  const restrictToTableBounds = ({ draggingNodeRect, transform }) => {
    if (!draggingNodeRect || !containerRef.current) {
      return { ...transform, y: 0 }
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const edgeOffset = 0

    const minX = containerRect.left - draggingNodeRect.left - edgeOffset
    const maxX =
      containerRect.right -
      draggingNodeRect.left -
      draggingNodeRect.width +
      edgeOffset

    return {
      ...transform,
      x: Math.min(Math.max(transform.x, minX), maxX),
      y: 0, // Lock vertical movement
    };
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      id={useId()}
      modifiers={[restrictToTableBounds]}
      onDragEnd={handleDragEnd}
      sensors={sensors}>
      <div ref={containerRef}>
        <DataGridTableBase>
          <DataGridTableHead>
            {map(table.getHeaderGroups(), (headerGroup, index) => {
                return (
                  <DataGridTableHeadRow headerGroup={headerGroup} key={index}>
                    <SortableContext
                      items={table.getState().columnOrder}
                      strategy={horizontalListSortingStrategy}>
                      {map(headerGroup.headers, (header) => (
                        <DataGridTableDndHeader header={header} key={header.id} />
                      ))}
                    </SortableContext>
                  </DataGridTableHeadRow>
                );
              })}
          </DataGridTableHead>

          {(props.tableLayout?.stripped || !props.tableLayout?.rowBorder) && (
            <DataGridTableRowSpacer />
          )}

          <DataGridTableBody>
            {props.loadingMode === "skeleton" &&
            isLoading &&
            pagination?.pageSize ? (
              times(pagination.pageSize, (rowIndex) => (
                <DataGridTableBodyRowSkeleton key={rowIndex}>
                  {map(table.getVisibleFlatColumns(), (column, colIndex) => {
                    return (
                      <DataGridTableBodyRowSkeletonCell column={column} key={colIndex}>
                        {column.columnDef.meta?.skeleton}
                      </DataGridTableBodyRowSkeletonCell>
                    );
                  })}
                </DataGridTableBodyRowSkeleton>
              ))
            ) : table.getRowModel().rows.length ? (
              map(table.getRowModel().rows, (row) => {
                return (
                  <Fragment key={row.id}>
                    <DataGridTableBodyRow row={row}>
                      {map(row.getVisibleCells(), (cell) => {
                          return (
                            <SortableContext
                              key={cell.id}
                              items={table.getState().columnOrder}
                              strategy={horizontalListSortingStrategy}>
                              <DataGridTableDndCell cell={cell} />
                            </SortableContext>
                          );
                        })}
                    </DataGridTableBodyRow>
                    {row.getIsExpanded() && (
                      <DataGridTableBodyRowExpandded row={row} />
                    )}
                  </Fragment>
                );
              })
            ) : (
              <DataGridTableEmpty />
            )}
          </DataGridTableBody>
        </DataGridTableBase>
      </div>
    </DndContext>
  );
}

export { DataGridTableDnd }
