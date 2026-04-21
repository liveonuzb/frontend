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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const getInitialValues = (session) => ({
  title: session?.title || "Coach sessiyasi",
  clientId: session?.client?.id || "",
  date: session?.date || "",
  slot: session?.selectedSlot || session?.slots?.[0] || "09:00",
  durationMinutes: session?.durationMinutes || 60,
  note: session?.note || "",
  timezone: session?.timezone || "Asia/Tashkent",
});

export const SessionBookingDrawer = ({
  open,
  mode = "create",
  session,
  clients = [],
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}) => {
  const [values, setValues] = React.useState(() => getInitialValues(session));

  React.useEffect(() => {
    if (open) {
      setValues(getInitialValues(session));
    }
  }, [open, session]);

  const updateValue = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
  };

  const selectedClient = clients.find((client) => client.id === values.clientId);
  const selectedRoomId =
    selectedClient?.roomId || selectedClient?.chatRoomId || session?.roomId;
  const isCreate = mode === "create";

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...values,
      roomId: selectedRoomId,
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>
            {isCreate ? "Yangi sessiya taklifi" : "Sessiyani ko'chirish"}
          </DrawerTitle>
          <DrawerDescription>
            {isCreate
              ? "Client chatiga sessiya booking taklifini yuboring."
              : "Rejalangan yoki taklif qilingan sessiya vaqtini yangilang."}
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4">
            {isCreate ? (
              <div className="space-y-2">
                <Label htmlFor="session-client">Client</Label>
                <select
                  id="session-client"
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  value={values.clientId}
                  onChange={updateValue("clientId")}
                  required
                >
                  <option value="">Client tanlang</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="session-title">Nomi</Label>
              <Input
                id="session-title"
                value={values.title}
                onChange={updateValue("title")}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="session-date">Sana</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={values.date}
                  onChange={updateValue("date")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-slot">Vaqt</Label>
                <Input
                  id="session-slot"
                  type="time"
                  value={values.slot}
                  onChange={updateValue("slot")}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="session-duration">Davomiyligi</Label>
                <Input
                  id="session-duration"
                  type="number"
                  min="15"
                  max="240"
                  value={values.durationMinutes}
                  onChange={updateValue("durationMinutes")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timezone">Timezone</Label>
                <Input
                  id="session-timezone"
                  value={values.timezone}
                  onChange={updateValue("timezone")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-note">Izoh</Label>
              <Textarea
                id="session-note"
                value={values.note}
                onChange={updateValue("note")}
                placeholder="Session maqsadi yoki clientga qisqa izoh"
              />
            </div>

            {isCreate && values.clientId && !selectedRoomId ? (
              <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                Bu client uchun chat room topilmadi. Session booking yaratish
                uchun avval chat ulanishi kerak.
              </p>
            ) : null}
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="submit"
              disabled={isSubmitting || (isCreate && !selectedRoomId)}
            >
              {isCreate ? "Taklif yuborish" : "Ko'chirish"}
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

export default SessionBookingDrawer;
