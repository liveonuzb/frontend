/* eslint-disable @typescript-eslint/no-explicit-any */
import { keys, findIndex, indexOf, find, map, includes, forEach } from "lodash";
import * as React from "react"
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  defaultAnimateLayoutChanges,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"
import { Slot } from "radix-ui"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

const KanbanContext = createContext({
  columns: {},
  setColumns: () => {},
  getItemId: () => "",
  columnIds: [],
  activeId: null,
  setActiveId: () => {},
  findContainer: () => undefined,
  isColumn: () => false,
  modifiers: undefined,
})

const ColumnContext = createContext({
  attributes: {},
  listeners: undefined,
  isDragging: false,
  disabled: false,
})

const ItemContext = createContext({
  listeners: undefined,
  isDragging: false,
  disabled: false,
})

const IsOverlayContext = createContext(false)

const animateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
}

function Kanban(
  {
    value,
    onValueChange,
    getItemValue,
    children,
    className,
    asChild = false,
    onMove,
    onDragEnd: onDragEndProp,
    modifiers,
    ...props
  }
) {
  const columns = value
  const setColumns = onValueChange
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10,
    },
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }))

  const columnIds = useMemo(() => keys(columns), [columns])

  const isColumn = useCallback((id) => includes(columnIds, id), [columnIds])

  const findContainer = useCallback((id) => {
    if (isColumn(id)) return id;
    return find(columnIds, (key) =>
      columns[key].some((item) => getItemValue(item) === id));
  }, [columns, columnIds, getItemValue, isColumn])

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragOver = useCallback((event) => {
    if (onMove) {
      return
    }

    const { active, over } = event
    if (!over) return

    if (isColumn(active.id)) return

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    if (!activeContainer || !overContainer) {
      return
    }

    if (activeContainer !== overContainer) {
      const activeItems = columns[activeContainer]
      const overItems = columns[overContainer]

      const activeIndex = findIndex(activeItems, (item) => getItemValue(item) === active.id)
      let overIndex = findIndex(overItems, (item) => getItemValue(item) === over.id)

      // If dropping on the column itself, not an item
      if (isColumn(over.id)) {
        overIndex = overItems.length
      }

      const newActiveItems = [...activeItems]
      const newOverItems = [...overItems]
      const [movedItem] = newActiveItems.splice(activeIndex, 1)
      newOverItems.splice(overIndex, 0, movedItem)

      setColumns({
        ...columns,
        [activeContainer]: newActiveItems,
        [overContainer]: newOverItems,
      })
    } else {
      const container = activeContainer
      const activeIndex = findIndex(columns[container], (item) => getItemValue(item) === active.id)
      const overIndex = findIndex(columns[container], (item) => getItemValue(item) === over.id)

      if (activeIndex !== overIndex) {
        setColumns({
          ...columns,
          [container]: arrayMove(columns[container], activeIndex, overIndex),
        })
      }
    }
  }, [findContainer, getItemValue, isColumn, setColumns, columns, onMove])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    setActiveId(null)

    if (onDragEndProp) {
        onDragEndProp(event);
    }

    if (!over) return

    // Handle item move callback
    if (onMove && !isColumn(active.id)) {
      const activeContainer = findContainer(active.id)
      const overContainer = findContainer(over.id)

      if (activeContainer && overContainer) {
        const activeIndex = findIndex(columns[activeContainer], (item) => getItemValue(item) === active.id)
        const overIndex = isColumn(over.id)
          ? columns[overContainer].length
          : findIndex(columns[overContainer], (item) => getItemValue(item) === over.id)

        onMove({
          event,
          activeContainer,
          activeIndex,
          overContainer,
          overIndex,
        })
      }
      return
    }

    // Handle column reordering
    if (isColumn(active.id) && isColumn(over.id)) {
      const activeIndex = indexOf(columnIds, active.id)
      const overIndex = indexOf(columnIds, over.id)
      if (activeIndex !== overIndex) {
        const newOrder = arrayMove(keys(columns), activeIndex, overIndex)
        const newColumns = {}
        forEach(newOrder, (key) => {
          newColumns[key] = columns[key]
        })
        setColumns(newColumns)
      }
      return
    }

    const activeContainer = findContainer(active.id)
    const overContainer = findContainer(over.id)

    // Handle item reordering within the same column
    if (
      activeContainer &&
      overContainer &&
      activeContainer === overContainer
    ) {
      const container = activeContainer
      const activeIndex = findIndex(columns[container], (item) => getItemValue(item) === active.id)
      const overIndex = findIndex(columns[container], (item) => getItemValue(item) === over.id)

      if (activeIndex !== overIndex) {
        setColumns({
          ...columns,
          [container]: arrayMove(columns[container], activeIndex, overIndex),
        })
      }
    }
  }, [
    columnIds,
    columns,
    findContainer,
    getItemValue,
    isColumn,
    setColumns,
    onMove,
    onDragEndProp,
  ])

  const contextValue = useMemo(() => ({
    columns,
    setColumns,
    getItemId: getItemValue,
    columnIds,
    activeId,
    setActiveId,
    findContainer,
    isColumn,
    modifiers,
  }), [
    columns,
    setColumns,
    getItemValue,
    columnIds,
    activeId,
    findContainer,
    isColumn,
    modifiers,
  ])

  const Comp = asChild ? Slot.Root : "div"

  return (
    <KanbanContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        modifiers={modifiers}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}>
        <Comp
          data-slot="kanban"
          data-dragging={activeId !== null}
          className={cn(activeId !== null && "cursor-grabbing!", className)}
          {...props}>
          {children}
        </Comp>
      </DndContext>
    </KanbanContext.Provider>
  );
}

function KanbanBoard({
  className,
  asChild = false,
  children,
  ...props
}) {
  const { columnIds } = useContext(KanbanContext)
  const Comp = asChild ? Slot.Root : "div"

  return (
    <SortableContext items={columnIds} strategy={rectSortingStrategy}>
      <Comp
        data-slot="kanban-board"
        className={cn("grid auto-rows-fr gap-4 sm:grid-cols-3", className)}
        {...props}>
        {children}
      </Comp>
    </SortableContext>
  );
}

function KanbanColumn({
  value,
  className,
  asChild = false,
  disabled,
  children,
  ...props
}) {
  const isOverlay = useContext(IsOverlayContext)

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
    animateLayoutChanges,
  })

  const { activeId, isColumn } = useContext(KanbanContext)
  const isColumnDragging = activeId ? isColumn(activeId) : false

  const style = {
    transition,
    transform: CSS.Transform.toString(transform)
  }

  const Comp = asChild ? Slot.Root : "div"

  if (isOverlay) {
    return (
      <ColumnContext.Provider
        value={{
          attributes: {},
          listeners: undefined,
          isDragging: true,
          disabled: false,
        }}>
        <Comp
          data-slot="kanban-column"
          data-value={value}
          data-dragging={true}
          className={cn("group/kanban-column flex flex-col", className)}
          {...props}>
          {children}
        </Comp>
      </ColumnContext.Provider>
    );
  }

  return (
    <ColumnContext.Provider value={{ attributes, listeners, isDragging: isColumnDragging, disabled }}>
      <Comp
        data-slot="kanban-column"
        data-value={value}
        data-dragging={isSortableDragging}
        data-disabled={disabled}
        ref={setNodeRef}
        style={style}
        className={cn(
          "group/kanban-column flex flex-col",
          isSortableDragging && "z-50 opacity-50",
          disabled && "opacity-50",
          className
        )}
        {...props}>
        {children}
      </Comp>
    </ColumnContext.Provider>
  );
}

function KanbanColumnHandle({
  className,
  asChild = false,
  cursor = true,
  children,
  ...props
}) {
  const { attributes, listeners, isDragging, disabled } =
    useContext(ColumnContext)

  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="kanban-column-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...attributes}
      {...listeners}
      className={cn(
        "opacity-0 transition-opacity group-hover/kanban-column:opacity-100",
        cursor && (isDragging ? "cursor-grabbing!" : "cursor-grab!"),
        className
      )}
      {...props}>
      {children}
    </Comp>
  );
}

function KanbanItem({
  value,
  className,
  asChild = false,
  disabled,
  children,
  ...props
}) {
  const isOverlay = useContext(IsOverlayContext)

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging: isSortableDragging,
  } = useSortable({
    id: value,
    disabled,
    animateLayoutChanges,
  })

  const { activeId, isColumn } = useContext(KanbanContext)
  const isItemDragging = activeId ? !isColumn(activeId) : false

  const style = {
    transition,
    transform: CSS.Transform.toString(transform)
  }

  const Comp = asChild ? Slot.Root : "div"

  if (isOverlay) {
    return (
      <ItemContext.Provider value={{ listeners: undefined, isDragging: true, disabled: false }}>
        <Comp
          data-slot="kanban-item"
          data-value={value}
          data-dragging={true}
          className={cn(className)}
          {...props}>
          {children}
        </Comp>
      </ItemContext.Provider>
    );
  }

  return (
    <ItemContext.Provider value={{ listeners, isDragging: isItemDragging, disabled }}>
      <Comp
        data-slot="kanban-item"
        data-value={value}
        data-dragging={isSortableDragging}
        data-disabled={disabled}
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn(
          isSortableDragging && "z-50 opacity-50",
          disabled && "opacity-50",
          className
        )}
        {...props}>
        {children}
      </Comp>
    </ItemContext.Provider>
  );
}

function KanbanItemHandle({
  className,
  asChild = false,
  cursor = true,
  children,
  ...props
}) {
  const { listeners, isDragging, disabled } = useContext(ItemContext)

  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="kanban-item-handle"
      data-dragging={isDragging}
      data-disabled={disabled}
      {...listeners}
      className={cn(cursor && (isDragging ? "cursor-grabbing!" : "cursor-grab!"), className)}
      {...props}>
      {children}
    </Comp>
  );
}

function KanbanColumnContent({
  value,
  className,
  asChild = false,
  children,
  ...props
}) {
  const { columns, getItemId } = useContext(KanbanContext)

  const itemIds = useMemo(() => map(columns[value], getItemId), [columns, getItemId, value])

  const Comp = asChild ? Slot.Root : "div"

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      <Comp
        data-slot="kanban-column-content"
        className={cn("flex flex-col gap-2", className)}
        {...props}>
        {children}
      </Comp>
    </SortableContext>
  );
}

function KanbanOverlay({
  children,
  className,
  ...props
}) {
  const { activeId, isColumn, modifiers } = useContext(KanbanContext)
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => setMounted(true), [])

  const variant = activeId ? (isColumn(activeId) ? "column" : "item") : "item"

  const content =
    activeId && children
      ? typeof children === "function"
        ? children({ value: activeId, variant })
        : children
      : null

  if (!mounted) return null

  return createPortal(<DragOverlay
    dropAnimation={dropAnimationConfig}
    modifiers={modifiers}
    className={cn("z-50", activeId && "cursor-grabbing", className)}
    {...props}>
    <IsOverlayContext.Provider value={true}>
      {content}
    </IsOverlayContext.Provider>
  </DragOverlay>, document.body);
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanColumnContent,
  KanbanOverlay,
}