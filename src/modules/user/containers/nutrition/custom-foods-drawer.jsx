import React, { useRef, useState } from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import trim from "lodash/trim";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostFileQuery,
  usePostQuery,
} from "@/hooks/api";
import {
  NUTRITION_CUSTOM_FOODS_API_ROOT,
  NUTRITION_FOODS_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { NutritionDrawerContent } from "./nutrition-drawer-layout.jsx";
import useHealthGoals from "@/hooks/app/use-health-goals";
import FoodDetailPortionDrawer from "./food-detail-portion-drawer.jsx";

const CUSTOM_FOODS_KEY = ["user", "nutrition", "custom-foods"];
const customFoodsApiPath = (path = "") =>
  nutritionApiPath(NUTRITION_CUSTOM_FOODS_API_ROOT, path);

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
  if (!trim(form.name)) return "Taom nomi kiritilmagan";
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
            <img loading="lazy"
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
        aria-label="Maxsus ovqat rasmi faylini tanlash"
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
        url: nutritionApiPath(NUTRITION_FOODS_API_ROOT, "upload-meal-capture"),
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
      name: trim(form.name),
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
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loggingId, setLoggingId] = useState(null);

  // Portion editor state
  const [portionItem, setPortionItem] = useState(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const { goals } = useHealthGoals();

  const { data, isLoading } = useGetQuery({
    url: customFoodsApiPath(),
    queryProps: {
      queryKey: CUSTOM_FOODS_KEY,
      enabled: open,
    },
  });

  const items = isArray(get(data, "data.data.items"))
    ? get(data, "data.data.items", [])
    : get(data, "data.items", []);

  const createMutation = usePostQuery({ queryKey: CUSTOM_FOODS_KEY });
  const updateMutation = usePatchQuery({ queryKey: CUSTOM_FOODS_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: CUSTOM_FOODS_KEY });
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleCreate = async (formData) => {
    try {
      await createMutation.mutateAsync({
        url: customFoodsApiPath(),
        attributes: formData,
      });
      setView("list");
      toast.success("Taom qo'shildi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        url: customFoodsApiPath(editingItem.id),
        attributes: formData,
      });
      setView("list");
      setEditingItem(null);
      toast.success("Taom yangilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync({
        url: customFoodsApiPath(id),
      });
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

  const handleLog = async (payload = {}) => {
    if (!onAddMeal || !dateKey || !mealType || !portionItem) return;
    const item = portionItem;
    const selectedGrams = payload.grams ?? portionGrams;
    const macros = payload.macros || scaleToGrams(item, selectedGrams);
    const selectedIngredients = payload.ingredients ?? item.ingredients ?? [];
    setLoggingId(item.id);
    try {
      await onAddMeal(dateKey, mealType, {
        name: item.name,
        cal: macros.cal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        fiber: macros.fiber,
        grams: selectedGrams,
        unit: item.servingUnit ?? "g",
        image: item.imageUrl || null,
        source: "manual",
        ingredients: selectedIngredients,
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

  const portionFood = portionItem
    ? {
        ...portionItem,
        cal: portionItem.calories ?? portionItem.cal ?? 0,
        baseCal: portionItem.calories ?? portionItem.cal ?? 0,
        baseProtein: portionItem.protein ?? 0,
        baseCarbs: portionItem.carbs ?? 0,
        baseFat: portionItem.fat ?? 0,
        defaultAmount: portionItem.servingSize || 100,
        unit: portionItem.servingUnit || "g",
        serving: `${portionItem.servingSize || 100} ${portionItem.servingUnit || "g"}`,
        image: portionItem.imageUrl || null,
        sourceLabel: "Saqlangan taom",
      }
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
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
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
                {map([0, 1, 2], (i) => (
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
                {map(items, (item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3"
                  >
                    {item.imageUrl ? (
                      <img loading="lazy"
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
          <FoodDetailPortionDrawer
            item={portionFood}
            type="food"
            grams={portionGrams}
            goals={goals}
            ingredients={portionItem?.ingredients}
            onGramsChange={setPortionGrams}
            onSave={handleLog}
            isSaving={loggingId === portionItem?.id}
            macroCalculator={(food, amount) =>
              scaleToGrams(
                {
                  ...food,
                  calories: food.calories ?? food.cal ?? 0,
                  servingSize: food.servingSize || food.defaultAmount || 100,
                },
                amount,
              )
            }
            sliderMax={sliderMax}
            sliderStep={sliderStep}
            gaugeMax={gaugeMax}
          />
        </NutritionDrawerContent>
      </Drawer>
    </>
  );
};

export default CustomFoodsDrawer;
