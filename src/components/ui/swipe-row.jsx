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
    handleDrag,
    handleDragEnd,
  }), [dragX, setDragX, actionRefLeft, actionRefRight, handleDrag, handleDragEnd])

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
  const { actionRefLeft, actionRefRight, dragX, handleDrag, handleDragEnd } =
    useSwipeRowContext()

  return (
    <motion.div
      aria-label="swipe-row-item-content"
      tabIndex={0}
      className={cn("relative cursor-grab p-4 select-none active:cursor-grabbing", className)}
      drag="x"
      dragConstraints={{
        left: actionRefRight?.current
          ? -(actionRefRight?.current?.offsetWidth || 0)
          : 0,
        right: actionRefLeft?.current
          ? actionRefLeft?.current?.offsetWidth || 0
          : 0,
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
  const { actionRefLeft, dragX } = useSwipeRowContext()
  return (
    <motion.div
      role="region"
      aria-label="left-actions"
      ref={actionRefLeft}
      className={cn("absolute top-0 left-0 flex h-full items-center", className)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: dragX > ACTIONS_VIEW_THRESHOLD && actionRefLeft ? 1 : 0,
        x:
          dragX > 0 && actionRefLeft
            ? 0
            : -(actionRefLeft?.current?.offsetWidth || 0),
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
  const { actionRefRight, dragX } = useSwipeRowContext()
  return (
    <motion.div
      role="region"
      aria-label="right-actions"
      ref={actionRefRight}
      className={cn("absolute top-0 right-0 flex h-full items-center", className)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: dragX < -ACTIONS_VIEW_THRESHOLD && actionRefRight ? 1 : 0,
        x:
          dragX < 0 && actionRefRight
            ? 0
            : actionRefRight?.current?.offsetWidth || 0,
      }}
      transition={{ stiffness: 300 }}
      {...props}>
      {children}
    </motion.div>
  );
}
