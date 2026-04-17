import React from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const SessionActionDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  isPending,
  requiresReason = false,
  reason,
  onReasonChange,
  onConfirm,
  children,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      {children}

      {requiresReason ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Sabab</p>
          <Textarea
            value={reason}
            onChange={(event) => onReasonChange?.(event.target.value)}
            placeholder="Qisqa izoh qoldiring"
            maxLength={300}
          />
        </div>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Bekor qilish
        </Button>
        <Button type="button" onClick={onConfirm} disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : null}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SessionActionDialog;
