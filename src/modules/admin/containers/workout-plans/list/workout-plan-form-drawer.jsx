import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner.jsx";
import { DIFFICULTY_OPTIONS } from "./workout-plan-utils.js";

export function WorkoutPlanFormDrawer({
  open,
  onOpenChange,
  editingTemplate,
  form,
  setForm,
  isSaving,
  isLoading,
  onContinue,
  onCancel,
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {editingTemplate
              ? "Workout shablonini tahrirlash"
              : "Yangi workout shablon"}
          </DrawerTitle>
          <DrawerDescription>
            Asosiy ma'lumotlarni kiriting. Tarjimalar keyin alohida amalda
            qo'shiladi.
          </DrawerDescription>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center px-4 pb-4 sm:px-6">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 px-4 pb-4 sm:px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workout-plan-name">Reja nomi</Label>
                <Input
                  id="workout-plan-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Masalan: Yog' yoqish uchun 4 haftalik plan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workout-plan-description">Tavsif</Label>
                <Textarea
                  id="workout-plan-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Shablon haqida qisqa tavsif"
                  className="min-h-28"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border bg-muted/20 p-4">
              <div className="space-y-2">
                <Label>Qiyinchilik</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      difficulty: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qiyinchilikni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3">
                <div>
                  <p className="font-medium">Userga ko'rsatish</p>
                  <p className="text-sm text-muted-foreground">
                    Faol bo'lsa ready template sifatida chiqadi.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isActive: Boolean(checked),
                    }))
                  }
                />
              </div>

              <div className="rounded-2xl border bg-background p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Preview
                </p>
                <p className="mt-3 text-lg font-black">
                  {String(form.name ?? "").trim() || "Nomi kiritilmagan"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {String(form.description ?? "").trim() ||
                    "Tavsif kiritilmagan"}
                </p>
              </div>
            </div>
          </div>
        )}

        <DrawerFooter>
          <Button onClick={onContinue} disabled={isSaving || isLoading}>
            Builderga o'tish
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
