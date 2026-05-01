import React from "react";
import { useBlocker } from "react-router";
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

const DEFAULT_TITLE = "O'zgarishlar saqlanmagan";
const DEFAULT_DESCRIPTION =
  "Sahifadan chiqsangiz, kiritilgan o'zgarishlar yo'qoladi.";

export const useUnsavedChangesGuard = ({ when }) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const pendingActionRef = React.useRef(null);
  const bypassRef = React.useRef(false);
  const shouldBlock = React.useCallback(
    () => Boolean(when) && !bypassRef.current,
    [when],
  );
  const blocker = useBlocker(shouldBlock);

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

  React.useEffect(() => {
    if (blocker.state === "blocked") {
      setConfirmOpen(true);
    }
  }, [blocker.state]);

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
    confirmOpen,
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
        <AlertDialogAction onClick={onConfirm}>
          Chiqib ketish
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
