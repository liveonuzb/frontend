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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SCORE_FIELDS = [
  { key: "moodScore", label: "Kayfiyat" },
  { key: "energyScore", label: "Energiya" },
  { key: "adherenceScore", label: "Rejaga amal qilish" },
];

const WeeklyCheckInDrawer = ({ checkIn, form, setForm, onSubmit, isSubmitting, onClose }) => (
  <Drawer
    open={Boolean(checkIn)}
    onOpenChange={(open) => { if (!open) onClose(); }}
    direction="bottom"
  >
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
      <DrawerHeader>
        <DrawerTitle>{checkIn?.title || "Weekly check-in"}</DrawerTitle>
        <DrawerDescription>
          {checkIn?.coach?.name
            ? `${checkIn.coach.name} uchun qisqa haftalik hisobot`
            : "Haftalik qisqa hisobotni to'ldiring"}
        </DrawerDescription>
      </DrawerHeader>
      <div className="space-y-4 px-4">
        {checkIn?.note ? (
          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {checkIn.note}
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="weekly-checkin-weight">Joriy vazn (kg)</Label>
          <Input
            id="weekly-checkin-weight"
            type="number"
            value={form.weightKg}
            onChange={(e) => setForm((prev) => ({ ...prev, weightKg: e.target.value }))}
            placeholder="Masalan, 78.5"
          />
        </div>
        {SCORE_FIELDS.map((item) => (
          <div key={item.key} className="space-y-2">
            <Label>{item.label}</Label>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const isActive = form[item.key] === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setForm((prev) => ({ ...prev, [item.key]: value }))}
                  >
                    {value}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="space-y-2">
          <Label htmlFor="weekly-checkin-notes">Izoh</Label>
          <Textarea
            id="weekly-checkin-notes"
            value={form.responseNotes}
            onChange={(e) => setForm((prev) => ({ ...prev, responseNotes: e.target.value }))}
            placeholder="Bu hafta o'zingizni qanday his qildingiz?"
          />
        </div>
      </div>
      <DrawerFooter>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          Yuborish
        </Button>
        <Button variant="outline" onClick={onClose}>
          Bekor qilish
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

export default WeeklyCheckInDrawer;
