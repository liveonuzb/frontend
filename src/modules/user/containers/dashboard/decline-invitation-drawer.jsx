import React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DECLINE_REASON_TEMPLATES = [
  "Hozircha murabbiy bilan ishlashga tayyor emasman",
  "Taklifdagi summa menga mos kelmadi",
  "Mashg'ulot vaqtlari menga to'g'ri kelmadi",
  "Boshqa murabbiy bilan ishlayapman",
];

const DeclineInvitationDrawer = ({ target, reason, setReason, isDeclining, onDecline, onClose }) => (
  <Drawer
    open={Boolean(target)}
    onOpenChange={(open) => { if (!open) onClose(); }}
    direction="bottom"
  >
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Taklifni rad etish</DrawerTitle>
        <DrawerDescription>
          Murabbiyga sabab yuboriladi. Tayyor variantni tanlang yoki o&apos;zingiz yozing.
        </DrawerDescription>
      </DrawerHeader>

      <div className="space-y-4 px-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {DECLINE_REASON_TEMPLATES.map((template) => (
            <Button
              key={template}
              type="button"
              variant={reason === template ? "default" : "outline"}
              className="h-auto whitespace-normal text-left"
              onClick={() => setReason(template)}
            >
              {template}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="decline-reason">Sizning izohingiz</Label>
          <Textarea
            id="decline-reason"
            rows={5}
            placeholder="Masalan, vaqtlarim to'g'ri kelmadi yoki keyinroq qaytaman..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      <DrawerFooter>
        <Button variant="outline" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button
          variant="destructive"
          disabled={!target || isDeclining}
          onClick={() => target ? onDecline(target.id) : null}
        >
          Rad etishni yuborish
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

export default DeclineInvitationDrawer;
