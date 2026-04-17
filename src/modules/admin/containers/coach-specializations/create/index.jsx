import React, { useState } from "react";
import { useNavigate } from "react-router";
import { get, trim, isArray, join } from "lodash";
import { usePostQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2Icon,
  LoaderCircleIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "FITNESS", label: "\uD83D\uDCAA Fitness" },
  { value: "YOGA", label: "\uD83E\uDDD8 Yoga" },
  { value: "BOXING", label: "\uD83E\uDD4A Boks" },
  { value: "FOOTBALL", label: "\u26BD Futbol" },
  { value: "SWIMMING", label: "\uD83C\uDFCA Suzish" },
  { value: "TENNIS", label: "\uD83C\uDFBE Tennis" },
  { value: "BASKETBALL", label: "\uD83C\uDFC0 Basketbol" },
  { value: "MARTIAL_ARTS", label: "\uD83E\uDD4B Jang san'ati" },
  { value: "RUNNING", label: "\uD83C\uDFC3 Yugurish" },
  { value: "GYMNASTICS", label: "\uD83E\uDD38 Gimnastika" },
  { value: "DANCE", label: "\uD83D\uDC83 Raqs" },
  { value: "CHEERLEADING", label: "\uD83D\uDCE3 Cheerleading" },
  { value: "SKATING", label: "\u26F8\uFE0F Muz uchish" },
  { value: "CYCLING", label: "\uD83D\uDEB4 Velosiped" },
  { value: "CLIMBING", label: "\uD83E\uDDD7 Toqqa chiqish" },
  { value: "OTHER", label: "\uD83C\uDFC5 Boshqa" },
];

const emptyForm = {
  category: "",
  key: "",
  nameUz: "",
  nameRu: "",
  nameEn: "",
  emoji: "",
  sortOrder: 0,
  isActive: true,
};

const CreateSpecialization = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);

  const { mutateAsync: postItem, isPending: isCreating } = usePostQuery({
    queryKey: ["admin", "coach-specializations"],
  });

  const handleSave = async () => {
    if (!trim(get(form, "category"))) {
      toast.error("Kategoriyani tanlang");
      return;
    }
    if (!trim(get(form, "key"))) {
      toast.error("Kalit (key) kiriting");
      return;
    }
    if (!trim(get(form, "nameUz"))) {
      toast.error("Nomi (UZ) kiriting");
      return;
    }

    try {
      await postItem({
        url: "/admin/coach-specializations",
        attributes: form,
      });
      toast.success("Yangi yo'nalish qo'shildi");
      navigate("/admin/coach-specializations/list");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        isArray(message)
          ? join(message, ", ")
          : message || "Yo'nalishni saqlab bo'lmadi",
      );
    }
  };

  const handleOpenChange = (open) => {
    if (!open) navigate("/admin/coach-specializations/list");
  };

  return (
    <Drawer open onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <PlusIcon />
            Yangi yo'nalish qo'shish
          </DrawerTitle>
          <DrawerDescription>
            Yangi sport yo'nalishini qo'shing
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold">Kategoriya *</Label>
            <Select
              value={get(form, "category", "")}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategoriyani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold">Kalit (key) *</Label>
            <Input
              value={get(form, "key", "")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  key: get(event, "target.value"),
                }))
              }
              placeholder="masalan: weight_loss"
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold">Nomi (UZ) *</Label>
            <Input
              value={get(form, "nameUz", "")}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nameUz: get(event, "target.value"),
                }))
              }
              placeholder="Vazn yo'qotish"
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Nomi (RU)</Label>
              <Input
                value={get(form, "nameRu", "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameRu: get(event, "target.value"),
                  }))
                }
                placeholder="Похудение"
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Nomi (EN)</Label>
              <Input
                value={get(form, "nameEn", "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nameEn: get(event, "target.value"),
                  }))
                }
                placeholder="Weight Loss"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Emoji</Label>
              <Input
                value={get(form, "emoji", "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    emoji: get(event, "target.value"),
                  }))
                }
                placeholder="\uD83C\uDFCB\uFE0F"
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold">Tartib raqami</Label>
              <Input
                type="number"
                value={get(form, "sortOrder", 0)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: Number(get(event, "target.value")) || 0,
                  }))
                }
                placeholder="0"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
            <div>
              <Label>Status</Label>
              <p className="text-xs text-muted-foreground">
                Faol bo'lsa, ilovada ko'rinadi.
              </p>
            </div>
            <Switch
              checked={get(form, "isActive", true)}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isActive: checked }))
              }
            />
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={handleSave}
            disabled={isCreating}
            className="gap-2"
          >
            {isCreating ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CheckCircle2Icon />
            )}
            Qo'shish
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/coach-specializations/list")}
          >
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateSpecialization;
