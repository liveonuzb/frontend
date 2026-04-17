import React from "react";
import { ImageIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
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
import { cn } from "@/lib/utils";

const PaymentEditDrawer = ({
  editingPayment,
  onClose,
  editAmount,
  setEditAmount,
  editNote,
  setEditNote,
  editMethod,
  setEditMethod,
  editReceiptUrl,
  setEditReceiptUrl,
  isEditUploading,
  onUpdatePayment,
  isUpdatingClientPayment,
  onFileUpload,
  onCancelFromEdit,
}) => {
  return (
    <Drawer
      open={Boolean(editingPayment)}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>To&apos;lovni tahrirlash</DrawerTitle>
          <DrawerDescription>
            {editingPayment?.client?.name} tomonidan qilingan to&apos;lov
            ma&apos;lumotlarini o&apos;zgartirish.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                To&apos;lov usuli
              </Label>
              <div className="flex bg-muted p-1 rounded-lg gap-1 h-11">
                <button
                  type="button"
                  onClick={() => setEditMethod("CASH")}
                  className={cn(
                    "flex-1 rounded-md text-xs font-medium transition-all",
                    editMethod === "CASH"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Naqd
                </button>
                <button
                  type="button"
                  onClick={() => setEditMethod("CLICK")}
                  className={cn(
                    "flex-1 rounded-md text-xs font-medium transition-all",
                    editMethod !== "CASH"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Karta
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Summa (so&apos;mda)
              </Label>
              <NumberField
                value={editAmount ? Number(editAmount) : undefined}
                min={0}
                step={10000}
                onValueChange={(value) =>
                  setEditAmount(
                    value === null || Number.isNaN(value)
                      ? ""
                      : String(value),
                  )
                }
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput
                    placeholder="Masalan: 500000"
                    className="h-11"
                  />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="edit-note"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Izoh
            </Label>
            <Textarea
              id="edit-note"
              value={editNote}
              onChange={(event) => setEditNote(event.target.value)}
              placeholder="Izoh yozing..."
              className="bg-card border-border/50 focus:ring-primary/20 min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
              Kvitansiya (rasm)
            </Label>
            <div className="flex flex-col gap-2">
              {editReceiptUrl ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ImageIcon className="size-4 text-primary shrink-0" />
                    <span className="text-xs text-primary font-medium truncate">
                      {editReceiptUrl.split("/").pop()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditReceiptUrl("")}
                  >
                    <RotateCcwIcon className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => onFileUpload(e, true)}
                    disabled={isEditUploading}
                    accept="image/*"
                  />
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center p-6 border border-dashed rounded-xl transition-all",
                      isEditUploading
                        ? "bg-muted"
                        : "bg-muted/10 hover:bg-muted/20 border-border/50",
                    )}
                  >
                    {isEditUploading ? (
                      <RotateCcwIcon className="size-6 text-primary animate-spin mb-2" />
                    ) : (
                      <PlusIcon className="size-6 text-muted-foreground mb-2" />
                    )}
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isEditUploading
                        ? "Yuklanmoqda..."
                        : "Kvitansiya yuklash"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            onClick={onUpdatePayment}
            disabled={isUpdatingClientPayment}
            size="lg"
          >
            {isUpdatingClientPayment
              ? "Saqlanmoqda..."
              : "O'zgarishlarni saqlash"}
          </Button>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={onCancelFromEdit}
          >
            To&apos;lovni o&apos;chirish
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Orqaga
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default PaymentEditDrawer;
