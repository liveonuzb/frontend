/* eslint-disable react-refresh/only-export-components */
import React from "react"
import { motion } from "motion/react";

import { cn } from "@/lib/utils.js"

const DRAG_THRESHOLD = 100
const ACTIONS_VIEW_THRESHOLD = 50

const SwipeRowContext = React.createContext(null)

export function useSwipeRowContext() {
  const ctx = React.useContext(SwipeRowContext)
  if (!ctx)
    throw new Error("Swipe Row components must be used inside <SwipeRow>")
  return ctx
}

export function SwipeRow({
  className,
  children
}) {
  const [dragX, setDragX] = React.useState(0)
  const [leftActionWidth, setLeftActionWidth] = React.useState(0)
  const [rightActionWidth, setRightActionWidth] = React.useState(0)

  const actionRefLeft = React.useRef(null)
  const actionRefRight = React.useRef(null)

  const handleDragEnd = React.useCallback((_, info) => {
    const absoluteOffset = Math.abs(info.offset.x)

    if (
      actionRefLeft.current &&
      absoluteOffset > DRAG_THRESHOLD &&
      info.offset.x > 0
    ) {
      setDragX(actionRefLeft.current.offsetWidth)
    } else if (
      actionRefRight.current &&
      absoluteOffset > DRAG_THRESHOLD &&
      info.offset.x < 0
    ) {
      setDragX(-actionRefRight.current.offsetWidth)
    } else {
      setDragX(0)
    }
  }, [])

  const handleDrag = React.useCallback((_, info) => {
    setDragX(info.offset.x)
  }, [])

  const contextValue = React.useMemo(() => ({
    dragX,
    setDragX,
    actionRefLeft,
    actionRefRight,
    leftActionWidth,
    rightActionWidth,
    setLeftActionWidth,
    setRightActionWidth,
    handleDrag,
    handleDragEnd,
  }), [
    dragX,
    setDragX,
    actionRefLeft,
    actionRefRight,
    leftActionWidth,
    rightActionWidth,
    setLeftActionWidth,
    setRightActionWidth,
    handleDrag,
    handleDragEnd,
  ])

  return (
    <SwipeRowContext.Provider value={contextValue}>
      <div
        role="group"
        aria-roledescription="swipe-row-list-item"
        aria-label="swipe-row-item"
        className={cn("relative w-full overflow-hidden", className)}>
        {children}
      </div>
    </SwipeRowContext.Provider>
  );
}

export function SwipeRowContent({
  children,
  className,
  ...props
}) {
  const {
    actionRefLeft,
    actionRefRight,
    dragX,
    handleDrag,
    handleDragEnd,
    leftActionWidth,
    rightActionWidth,
  } =
    useSwipeRowContext()

  return (
    <motion.div
      aria-label="swipe-row-item-content"
      tabIndex={0}
      className={cn("relative cursor-grab p-4 select-none active:cursor-grabbing", className)}
      drag="x"
      dragConstraints={{
        left: -rightActionWidth,
        right: leftActionWidth,
      }}
      dragElastic={0.1}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ x: dragX }}
      transition={{ stiffness: 300 }}
      {...props}>
      {children}
    </motion.div>
  );
}

export function SwipeLeftActions({
  className,
  children,
  ...props
}) {
  const { actionRefLeft, dragX, leftActionWidth, setLeftActionWidth } =
    useSwipeRowContext()

  React.useLayoutEffect(() => {
    setLeftActionWidth(actionRefLeft.current?.offsetWidth || 0)
  }, [actionRefLeft, children, setLeftActionWidth])

  return (
    <motion.div
      role="region"
      aria-label="left-actions"
      ref={actionRefLeft}
      className={cn("absolute top-0 left-0 flex h-full items-center", className)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: dragX > ACTIONS_VIEW_THRESHOLD && leftActionWidth ? 1 : 0,
        x:
          dragX > 0 && leftActionWidth
            ? 0
            : -leftActionWidth,
      }}
      transition={{ stiffness: 300 }}
      {...props}>
      {children}
    </motion.div>
  );
}

export function SwipeRightActions({
  className,
  children,
  ...props
}) {
  const { actionRefRight, dragX, rightActionWidth, setRightActionWidth } =
    useSwipeRowContext()

  React.useLayoutEffect(() => {
    setRightActionWidth(actionRefRight.current?.offsetWidth || 0)
  }, [actionRefRight, children, setRightActionWidth])

  return (
    <motion.div
      role="region"
      aria-label="right-actions"
      ref={actionRefRight}
      className={cn("absolute top-0 right-0 flex h-full items-center", className)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: dragX < -ACTIONS_VIEW_THRESHOLD && rightActionWidth ? 1 : 0,
        x:
          dragX < 0 && rightActionWidth
            ? 0
            : rightActionWidth,
      }}
      transition={{ stiffness: 300 }}
      {...props}>
      {children}
    </motion.div>
  );
}
