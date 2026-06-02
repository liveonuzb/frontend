/* eslint-disable react-refresh/only-export-components */
import React from "react";
import * as ReactRouter from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import toLower from "lodash/toLower";

const DEFAULT_TITLE = "O'zgarishlar saqlanmagan";
const DEFAULT_DESCRIPTION =
  "Sahifadan chiqsangiz, kiritilgan o'zgarishlar yo'qoladi.";
const NULL_CONTEXT = React.createContext(null);
const IDLE_BLOCKER = {
  state: "unblocked",
  proceed: undefined,
  reset: undefined,
  location: undefined,
};

const getReactRouterExport = (name) => {
  try {
    return ReactRouter[name];
  } catch {
    return undefined;
  }
};

const stripBasename = (pathname, basename) => {
  if (!basename || basename === "/") return pathname;

  const normalizedBasename = basename.endsWith("/")
    ? basename.slice(0, -1)
    : basename;

  if (!toLower(pathname).startsWith(toLower(normalizedBasename))) {
    return null;
  }

  const nextChar = pathname.charAt(normalizedBasename.length);
  if (nextChar && nextChar !== "/") return null;

  return pathname.slice(normalizedBasename.length) || "/";
};

const useOptionalDataRouterBlocker = (shouldBlock) => {
  const DataRouterContext =
    getReactRouterExport("UNSAFE_DataRouterContext") ?? NULL_CONTEXT;
  const DataRouterStateContext =
    getReactRouterExport("UNSAFE_DataRouterStateContext") ?? NULL_CONTEXT;
  const dataRouterContext = React.useContext(DataRouterContext);
  const dataRouterState = React.useContext(DataRouterStateContext);
  const router = dataRouterContext?.router;
  const basename = dataRouterContext?.basename ?? "/";
  const blockerKey = React.useId();
  const blockerFunction = React.useCallback(
    (arg) => {
      if (typeof shouldBlock !== "function") return Boolean(shouldBlock);
      if (basename === "/") return shouldBlock(arg);

      const { currentLocation, nextLocation, historyAction } = arg;
      return shouldBlock({
        currentLocation: {
          ...currentLocation,
          pathname:
            stripBasename(currentLocation.pathname, basename) ||
            currentLocation.pathname,
        },
        nextLocation: {
          ...nextLocation,
          pathname:
            stripBasename(nextLocation.pathname, basename) ||
            nextLocation.pathname,
        },
        historyAction,
      });
    },
    [basename, shouldBlock],
  );

  React.useEffect(() => {
    if (!router) return undefined;
    return () => {
      router.deleteBlocker?.(blockerKey);
    };
  }, [router, blockerKey]);

  React.useEffect(() => {
    if (!router) return;
    router.getBlocker?.(blockerKey, blockerFunction);
  }, [router, blockerKey, blockerFunction]);

  if (!router || !dataRouterState) {
    return getReactRouterExport("IDLE_BLOCKER") ?? IDLE_BLOCKER;
  }

  return (
    dataRouterState.blockers?.get(blockerKey) ??
    getReactRouterExport("IDLE_BLOCKER") ??
    IDLE_BLOCKER
  );
};

export const useUnsavedChangesGuard = ({ when }) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const pendingActionRef = React.useRef(null);
  const bypassRef = React.useRef(false);
  const shouldBlock = React.useCallback(
    () => Boolean(when) && !bypassRef.current,
    [when],
  );
  const blocker = useOptionalDataRouterBlocker(shouldBlock);
  const isRouterBlocked = blocker.state === "blocked";

  React.useEffect(() => {
    if (!when) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [when]);

  const requestLeave = React.useCallback(
    (action) => {
      if (!when) {
        action?.();
        return true;
      }

      pendingActionRef.current = action;
      setConfirmOpen(true);
      return false;
    },
    [when],
  );

  const confirmLeave = React.useCallback(() => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    setConfirmOpen(false);

    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }

    pendingAction?.();
  }, [blocker]);

  const runWithoutGuard = React.useCallback((action) => {
    bypassRef.current = true;
    action?.();
    window.setTimeout(() => {
      bypassRef.current = false;
    }, 0);
  }, []);

  const cancelLeave = React.useCallback(() => {
    pendingActionRef.current = null;
    setConfirmOpen(false);

    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  return {
    confirmOpen: confirmOpen || isRouterBlocked,
    requestLeave,
    confirmLeave,
    cancelLeave,
    runWithoutGuard,
  };
};

export const UnsavedChangesAlert = ({
  open,
  onCancel,
  onConfirm,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}) => (
  <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>Qolish</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Chiqib ketish</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
