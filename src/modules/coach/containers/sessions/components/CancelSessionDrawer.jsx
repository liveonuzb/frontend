import React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const CancelSessionDrawer = ({
  open,
  session,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [reason, setReason] = React.useState(session?.cancellationReason || "");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ reason: reason.trim() || undefined });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Sessiyani bekor qilish</DrawerTitle>
          <DrawerDescription>
            Sabab chatdagi booking widgetga ham sinxronlanadi.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-cancel-reason">Sabab</Label>
              <Textarea
                id="session-cancel-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Masalan: client boshqa vaqt so'radi"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              Bekor qilish
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Qaytish
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default CancelSessionDrawer;
