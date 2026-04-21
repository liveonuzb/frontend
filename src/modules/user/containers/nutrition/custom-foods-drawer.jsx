import React, { useRef, useState } from "react";
import { get } from "lodash";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  PencilIcon,
  Trash2Icon,
  PlusCircleIcon,
  PlusIcon,
  CameraIcon,
  ImageIcon,
  Loader2Icon,
  ArrowLeftIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePostFileQuery, usePostQuery } from "@/hooks/api";
import useApi from "@/hooks/api/use-api";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import GaugeProgress from "@/components/meal-plan-builder/gauge-progress.jsx";

const CUSTOM_FOODS_KEY = ["me", "custom-foods"];

const EMPTY_FORM = {
  name: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  servingSize: 100,
  servingUnit: "g",
  imageUrl: "",
};

const validateForm = (form) => {
  if (!form.name.trim()) return "Taom nomi kiritilmagan";
  if (form.calories == null || Number.isNaN(form.calories) || form.calories < 0)
    return "Kaloriya miqdori noto'g'ri";
  return null;
};

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", null));

/** Macros scaled to the chosen portion grams */
const scaleToGrams = (item, grams) => {
  const servingSize = item.servingSize || 100;
  const factor = grams / servingSize;
  return {
    cal: Math.round((item.calories ?? 0) * factor),
    protein: Math.round((item.protein ?? 0) * factor),
    carbs: Math.round((item.carbs ?? 0) * factor),
    fat: Math.round((item.fat ?? 0) * factor),
  };
};

const safeNum = (v) => (Number.isNaN(v) || v == null ? 0 : v);

// ---------------------------------------------------------------------------
// Square image upload — avatar style
// ---------------------------------------------------------------------------
const ImageUploadSquare = ({ imageUrl, isUploading, onPick, onRemove }) => {
  const fileInputRef = useRef(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="relative group size-28 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/40 hover:border-primary/60 hover:bg-muted/70 transition-all disabled:opacity-60 flex flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Taom rasmi"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <CameraIcon className="size-5 text-white" />
              <span className="text-[11px] text-white/90 font-semibold">
                O&apos;zgartirish
              </span>
            </div>
          </>
        ) : isUploading ? (
          <>
            <Loader2Icon className="size-6 text-muted-foreground animate-spin" />
            <span className="text-[11px] text-muted-foreground font-medium">
              Yuklanmoqda…
            </span>
          </>
        ) : (
          <>
            <div className="size-11 rounded-xl bg-background shadow-sm flex items-center justify-center">
              <ImageIcon className="size-5 text-muted-foreground" />
            </div>
            <span className="text-[11px] text-muted-foreground font-semibold">
              Rasm yuklash
            </span>
          </>
        )}
      </button>

      {imageUrl ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-destructive hover:underline"
        >
          Rasmni o&apos;chirish
        </button>
      ) : (
        <span className="text-xs text-muted-foreground">Ixtiyoriy</span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// CustomFoodForm
// ---------------------------------------------------------------------------
const CustomFoodForm = ({
  initial = EMPTY_FORM,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [error, setError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const uploadMutation = usePostFileQuery({});

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageFile = async (file) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await uploadMutation.mutateAsync({
        url: "/foods/upload-meal-capture",
        attributes: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
      const payload = getPayload(response);
      const imageUrl = get(payload, "imageUrl", null);
      if (imageUrl) {
        setField("imageUrl", imageUrl);
      } else {
        toast.error("Rasm yuklab bo'lmadi");
      }
    } catch {
      toast.error("Rasm yuklab bo'lmadi");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = () => {
    const err = validateForm(form);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    onSave({
      name: form.name.trim(),
      calories: safeNum(form.calories),
      protein: safeNum(form.protein),
      carbs: safeNum(form.carbs),
      fat: safeNum(form.fat),
      servingSize: safeNum(form.servingSize) || 100,
      servingUnit: form.servingUnit || "g",
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
    });
  };

  return (
    <div className="space-y-5">
      {/* Square image upload */}
      <ImageUploadSquare
        imageUrl={form.imageUrl}
        isUploading={isUploadingImage}
        onPick={handleImageFile}
        onRemove={() => setField("imageUrl", "")}
      />

      {/* Name */}
      <Field>
        <FieldLabel>Taom nomi *</FieldLabel>
        <Input
          placeholder="Masalan: Uy plov"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />
      </Field>

      {/* Macros — 2-column grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <Field>
          <FieldLabel>Kaloriya (kcal) *</FieldLabel>
          <NumberField
            value={form.calories}
            onValueChange={(v) => setField("calories", safeNum(v))}
            minValue={0}
            step={1}
            formatOptions={{ maximumFractionDigits: 0 }}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput placeholder="0" />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          </NumberField>
        </Field>

        <Field>
          <FieldLabel>Oqsil (g)</FieldLabel>
          <NumberField
            value={form.protein}
            onValueChange={(v) => setField("protein", safeNum(v))}
            minValue={0}
            step={1}
            formatOptions={{ maximumFractionDigits: 1 }}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput placeholder="0" />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          </NumberField>
        </Field>

        <Field>
          <FieldLabel>Uglevodlar (g)</FieldLabel>
          <NumberField
            value={form.carbs}
            onValueChange={(v) => setField("carbs", safeNum(v))}
            minValue={0}
            step={1}
            formatOptions={{ maximumFractionDigits: 1 }}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput placeholder="0" />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          </NumberField>
        </Field>

        <Field>
          <FieldLabel>Yog&apos; (g)</FieldLabel>
          <NumberField
            value={form.fat}
            onValueChange={(v) => setField("fat", safeNum(v))}
            minValue={0}
            step={1}
            formatOptions={{ maximumFractionDigits: 1 }}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput placeholder="0" />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          </NumberField>
        </Field>

        <Field>
          <FieldLabel>Porsiya hajmi</FieldLabel>
          <NumberField
            value={form.servingSize}
            onValueChange={(v) => setField("servingSize", safeNum(v) || 100)}
            minValue={1}
            step={10}
            formatOptions={{ maximumFractionDigits: 0 }}
          >
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput placeholder="100" />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          </NumberField>
        </Field>

        <Field>
          <FieldLabel>Birlik</FieldLabel>
          <Input
            placeholder="g"
            value={form.servingUnit}
            onChange={(e) => setField("servingUnit", e.target.value)}
          />
        </Field>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          className="flex-1"
          disabled={isSaving || isUploadingImage}
          onClick={handleSave}
        >
          {isSaving ? "Saqlanmoqda…" : "Saqlash"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Bekor qilish
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CustomFoodsDrawer
// ---------------------------------------------------------------------------
const CustomFoodsDrawer = ({
  open,
  onOpenChange,
  dateKey,
  mealType,
  onAddMeal,
}) => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loggingId, setLoggingId] = useState(null);

  // Portion editor state
  const [portionItem, setPortionItem] = useState(null);
  const [portionGrams, setPortionGrams] = useState(100);

  const { data, isLoading } = useGetQuery({
    url: "/users/me/custom-foods",
    queryProps: {
      queryKey: CUSTOM_FOODS_KEY,
      enabled: open,
    },
  });

  const items = Array.isArray(get(data, "data.data.items"))
    ? get(data, "data.data.items", [])
    : get(data, "data.items", []);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: CUSTOM_FOODS_KEY });

  const handleCreate = async (formData) => {
    setIsSaving(true);
    try {
      await request.post("/users/me/custom-foods", formData);
      await invalidate();
      setView("list");
      toast.success("Taom qo'shildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await request.patch(`/users/me/custom-foods/${editingItem.id}`, formData);
      await invalidate();
      setView("list");
      setEditingItem(null);
      toast.success("Taom yangilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await request.delete(`/users/me/custom-foods/${id}`);
      await invalidate();
      toast.success("Taom o'chirildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setDeletingId(null);
    }
  };

  const openPortionEditor = (item) => {
    setPortionItem(item);
    setPortionGrams(item.servingSize || 100);
  };

  const handleLog = async () => {
    if (!onAddMeal || !dateKey || !mealType || !portionItem) return;
    const item = portionItem;
    setLoggingId(item.id);
    try {
      const macros = scaleToGrams(item, portionGrams);
      await onAddMeal(dateKey, mealType, {
        name: item.name,
        cal: macros.cal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        grams: portionGrams,
        unit: item.servingUnit ?? "g",
        image: item.imageUrl || null,
        source: "manual",
      });
      toast.success(`${item.name} qo'shildi`);
      setPortionItem(null);
    } catch {
      toast.error("Ovqatni qo'shib bo'lmadi");
    } finally {
      setLoggingId(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setView("list");
    setEditingItem(null);
  };

  const portionMacros = portionItem
    ? scaleToGrams(portionItem, portionGrams)
    : null;
  const sliderMax = portionItem
    ? Math.max((portionItem.servingSize || 100) * 5, 500)
    : 1000;
  const sliderStep =
    portionItem?.servingUnit === "g" || portionItem?.servingUnit === "ml"
      ? 10
      : 1;
  const gaugeMax = portionItem
    ? scaleToGrams(portionItem, sliderMax).cal
    : 2650;

  return (
    <>
      <Drawer open={open} onOpenChange={handleClose} direction="bottom">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {view === "create"
                ? "Yangi taom yaratish"
                : view === "edit"
                  ? "Taomni tahrirlash"
                  : "Mening taomlarim"}
            </DrawerTitle>
            <DrawerDescription>
              {view === "list"
                ? "O'z retseptlaringizni va maxsus taomlaringizni boshqaring"
                : "Taom ma'lumotlarini to'ldiring"}
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-4">
            {view === "create" ? (
              <CustomFoodForm
                onSave={handleCreate}
                onCancel={() => setView("list")}
                isSaving={isSaving}
              />
            ) : view === "edit" ? (
              <CustomFoodForm
                initial={{
                  name: editingItem?.name ?? "",
                  calories: editingItem?.calories ?? 0,
                  protein: editingItem?.protein ?? 0,
                  carbs: editingItem?.carbs ?? 0,
                  fat: editingItem?.fat ?? 0,
                  servingSize: editingItem?.servingSize ?? 100,
                  servingUnit: editingItem?.servingUnit ?? "g",
                  imageUrl: editingItem?.imageUrl ?? "",
                }}
                onSave={handleUpdate}
                onCancel={() => {
                  setView("list");
                  setEditingItem(null);
                }}
                isSaving={isSaving}
              />
            ) : isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-2xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <PlusCircleIcon className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Hali taomlar yo&apos;q. Birinchi taomingizni yarating!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-10 rounded-xl object-cover shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.calories} kcal · {item.protein}g oqsil ·{" "}
                        {item.servingSize}
                        {item.servingUnit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {onAddMeal ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-primary"
                          disabled={loggingId === item.id}
                          onClick={() => openPortionEditor(item)}
                          title="Ovqatga qo'shish"
                        >
                          <PlusIcon className="size-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        onClick={() => {
                          setEditingItem(item);
                          setView("edit");
                        }}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        disabled={deletingId === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DrawerBody>

          {view === "list" ? (
            <DrawerFooter>
              <Button
                type="button"
                className="w-full rounded-2xl"
                onClick={() => setView("create")}
              >
                <PlusCircleIcon className="mr-2 size-4" />
                Yangi taom yaratish
              </Button>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>

      {/* Portion editor */}
      <Drawer
        open={!!portionItem}
        onOpenChange={(o) => !o && setPortionItem(null)}
        direction="bottom"
      >
        <NutritionDrawerContent size="sm">
          <DrawerHeader className="relative">
            <button
              type="button"
              onClick={() => setPortionItem(null)}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeftIcon className="size-5" />
            </button>
            <DrawerTitle>{portionItem?.name}</DrawerTitle>
            <DrawerDescription>
              Porsiya hajmini tanlang ({portionItem?.servingUnit || "g"})
            </DrawerDescription>
          </DrawerHeader>

          {portionItem ? (
            <DrawerBody className="space-y-6">
              {portionItem.imageUrl ? (
                <div className="h-36 w-full rounded-2xl overflow-hidden bg-muted/30 -mt-2">
                  <img
                    src={portionItem.imageUrl}
                    alt={portionItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              {/* Calorie gauge */}
              <GaugeProgress
                value={portionMacros?.cal ?? 0}
                max={gaugeMax}
                id={`custom-food-${portionItem.id}`}
                label="QO'SHILMOQDA"
              />

              {/* Macro summary */}
              <div className="rounded-2xl border bg-muted/30 p-4 grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Kaloriya
                  </span>
                  <span className="text-base font-black text-foreground">
                    {portionMacros?.cal}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    kcal
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-l border-border/40">
                  <span className="text-xs text-muted-foreground font-medium">
                    Oqsil
                  </span>
                  <span className="text-base font-black text-red-500">
                    {portionMacros?.protein}
                  </span>
                  <span className="text-[10px] text-muted-foreground">g</span>
                </div>
                <div className="flex flex-col gap-1 border-l border-border/40">
                  <span className="text-xs text-muted-foreground font-medium">
                    Uglevod
                  </span>
                  <span className="text-base font-black text-amber-500">
                    {portionMacros?.carbs}
                  </span>
                  <span className="text-[10px] text-muted-foreground">g</span>
                </div>
                <div className="flex flex-col gap-1 border-l border-border/40">
                  <span className="text-xs text-muted-foreground font-medium">
                    Yog&apos;
                  </span>
                  <span className="text-base font-black text-blue-500">
                    {portionMacros?.fat}
                  </span>
                  <span className="text-[10px] text-muted-foreground">g</span>
                </div>
              </div>

              {/* Amount slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Miqdori:
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {portionGrams}
                    <span className="text-sm font-semibold text-muted-foreground ml-1">
                      {portionItem.servingUnit || "g"}
                    </span>
                  </span>
                </div>
                <Slider
                  value={[portionGrams]}
                  min={sliderStep}
                  max={sliderMax}
                  step={sliderStep}
                  onValueChange={([v]) => setPortionGrams(v)}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>
                    {sliderStep}
                    {portionItem.servingUnit || "g"}
                  </span>
                  <span>
                    {sliderMax}
                    {portionItem.servingUnit || "g"}
                  </span>
                </div>
              </div>
            </DrawerBody>
          ) : null}

          <DrawerFooter>
            <Button variant="outline" onClick={() => setPortionItem(null)}>
              Bekor qilish
            </Button>
            <Button
              disabled={loggingId === portionItem?.id}
              onClick={handleLog}
            >
              {loggingId === portionItem?.id ? "Qo'shilmoqda…" : "Qo'shish"}
            </Button>
          </DrawerFooter>
        </NutritionDrawerContent>
      </Drawer>
    </>
  );
};

export default CustomFoodsDrawer;
