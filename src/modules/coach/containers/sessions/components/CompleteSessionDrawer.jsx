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

export const CompleteSessionDrawer = ({
  open,
  session,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [privateNote, setPrivateNote] = React.useState("");
  const [clientSummary, setClientSummary] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setPrivateNote(session?.privateNote || "");
      setClientSummary(session?.clientSummary || "");
    }
  }, [open, session]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ privateNote, clientSummary });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Sessiyani tugatish</DrawerTitle>
          <DrawerDescription>
            Private note va clientga ko&apos;rinadigan summary yozing.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-summary">Client summary</Label>
              <Textarea
                id="client-summary"
                value={clientSummary}
                onChange={(event) => setClientSummary(event.target.value)}
                placeholder="Bugungi session natijasi va keyingi qadamlar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="private-note">Private note</Label>
              <Textarea
                id="private-note"
                value={privateNote}
                onChange={(event) => setPrivateNote(event.target.value)}
                placeholder="Faqat coach uchun ichki eslatma"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting}>
              Tugatish
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default CompleteSessionDrawer;
