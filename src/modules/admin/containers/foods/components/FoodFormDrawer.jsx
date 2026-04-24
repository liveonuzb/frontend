import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  get,
  includes,
  map as lodashMap,
  filter as lodashFilter,
} from "lodash";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import {
  PencilIcon,
  PlusIcon,
  TagIcon,
  UploadIcon,
  UtensilsIcon,
} from "lucide-react";

// ── Schema ──────────────────────────────────────────────────────────────────
const foodSchema = z.object({
  name: z.string().min(1, "Ovqat nomini kiriting"),
  categoryIds: z.array(z.number()).min(1, "Kamida bitta kategoriya tanlang"),
  calories: z.number({ invalid_type_error: "Kaloriya kiriting" }).min(0),
  maxIntake: z.number().min(0).optional(),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  servingUnit: z.enum(["g", "ml", "dona", "qoshiq"]),
  servingSize: z.number().min(0),
});

const SERVING_UNITS = [
  { value: "g", label: "Gram" },
  { value: "ml", label: "mL" },
  { value: "dona", label: "Dona" },
  { value: "qoshiq", label: "Qoshiq" },
];

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const val = get(translations, language, "");
    if (val && String(val).trim()) return String(val).trim();
    const uz = get(translations, "uz", "");
    if (uz && String(uz).trim()) return String(uz).trim();
  }
  return fallback;
};

// ── NumberField adapter ──────────────────────────────────────────────────────
const RHFNumberField = ({
  value,
  onChange,
  minValue = 0,
  step = 1,
  placeholder = "0",
  formatOptions,
}) => (
  <NumberField
    value={value ?? undefined}
    onValueChange={(v) => onChange(v ?? 0)}
    minValue={minValue}
    step={step}
    formatOptions={formatOptions}
  >
    <NumberFieldGroup className="h-10 rounded-xl bg-background w-full">
      <NumberFieldDecrement className="px-3 rounded-s-xl" />
      <NumberFieldInput
        placeholder={placeholder}
        className="px-3 text-sm flex-1"
      />
      <NumberFieldIncrement className="px-3 rounded-e-xl" />
    </NumberFieldGroup>
  </NumberField>
);

// ── Component ────────────────────────────────────────────────────────────────
const FoodFormDrawer = ({
  open,
  onOpenChange,
  editingFood,
  initialValues, // pre-filled form data (from createFormFromFood)
  categories,
  currentLanguage,
  currentLanguageMeta,
  imagePreview,
  fileInputRef,
  isUploadingImage,
  isDeletingImage,
  isCreating,
  isUpdating,
  onImageChange,
  onRemoveImage,
  onSave, // (data: foodSchema) => Promise<void>
}) => {
  const form = useForm({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: "",
      categoryIds: [],
      calories: 0,
      maxIntake: undefined,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingUnit: "g",
      servingSize: 100,
    },
  });

  const watchedUnit = form.watch("servingUnit");

  // Sync initialValues when editingFood changes or drawer opens
  useEffect(() => {
    if (open && initialValues) {
      form.reset({
        name: initialValues.name ?? "",
        categoryIds: initialValues.categoryIds ?? [],
        calories: Number(initialValues.calories) || 0,
        maxIntake:
          initialValues.maxIntake !== "" && initialValues.maxIntake != null
            ? Number(initialValues.maxIntake)
            : undefined,
        protein: Number(initialValues.protein) || 0,
        carbs: Number(initialValues.carbs) || 0,
        fat: Number(initialValues.fat) || 0,
        servingUnit: initialValues.servingUnit || "g",
        servingSize: Number(initialValues.servingSize) || 100,
      });
    } else if (open && !editingFood) {
      form.reset();
    }
  }, [open, editingFood]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data);
    form.reset();
  });

  const isPending =
    isCreating || isUpdating || isUploadingImage || isDeletingImage;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        {/* ── Centered header ── */}
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-lg font-bold">
            {editingFood ? "Ovqatni tahrirlash" : "Yangi ovqat"}
          </DrawerTitle>
          <DrawerDescription className="mt-1">
            {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
            {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()} tilida
            ma&apos;lumot kiriting
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Form {...form}>
            <form
              id="food-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              {/* ── Image ── */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium leading-none">
                  Ovqat rasmi
                </span>
                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-2xl border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                    {imagePreview ? (
                      <img loading="lazy"
                        src={imagePreview}
                        alt="preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <UtensilsIcon className="size-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onImageChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingImage || isDeletingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadIcon data-icon="inline-start" />
                      {isUploadingImage ? "Yuklanmoqda..." : "Rasm yuklash"}
                    </Button>
                    {imagePreview ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUploadingImage || isDeletingImage}
                        onClick={onRemoveImage}
                      >
                        Olib tashlash
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* ── Name ── */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nomi ({currentLanguage.toUpperCase()}){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Masalan: Olma" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Categories ── */}
              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kategoriyalar <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {lodashMap(categories, (category) => (
                          <Badge
                            key={category.id}
                            variant={
                              includes(field.value, category.id)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer h-7 px-3 text-xs"
                            onClick={() => {
                              const next = includes(field.value, category.id)
                                ? lodashFilter(
                                    field.value,
                                    (id) => id !== category.id,
                                  )
                                : [...field.value, category.id];
                              field.onChange(next);
                            }}
                          >
                            {resolveLabel(
                              category.translations,
                              category.name,
                              currentLanguage,
                            )}
                          </Badge>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Calories ── */}
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kaloriya <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RHFNumberField
                        value={field.value}
                        onChange={field.onChange}
                        minValue={0}
                        step={1}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Max intake ── */}
              <FormField
                control={form.control}
                name="maxIntake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maks. kunlik miqdor</FormLabel>
                    <FormControl>
                      <RHFNumberField
                        value={field.value}
                        onChange={field.onChange}
                        minValue={0}
                        step={1}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Protein ── */}
              <FormField
                control={form.control}
                name="protein"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protein (g)</FormLabel>
                    <FormControl>
                      <RHFNumberField
                        value={field.value}
                        onChange={field.onChange}
                        minValue={0}
                        step={0.1}
                        placeholder="0.0"
                        formatOptions={{ maximumFractionDigits: 1 }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Carbs ── */}
              <FormField
                control={form.control}
                name="carbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uglevod (g)</FormLabel>
                    <FormControl>
                      <RHFNumberField
                        value={field.value}
                        onChange={field.onChange}
                        minValue={0}
                        step={0.1}
                        placeholder="0.0"
                        formatOptions={{ maximumFractionDigits: 1 }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Fat ── */}
              <FormField
                control={form.control}
                name="fat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yog&apos; (g)</FormLabel>
                    <FormControl>
                      <RHFNumberField
                        value={field.value}
                        onChange={field.onChange}
                        minValue={0}
                        step={0.1}
                        placeholder="0.0"
                        formatOptions={{ maximumFractionDigits: 1 }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Serving unit (ToggleGroup) ── */}
              <FormField
                control={form.control}
                name="servingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O&apos;lchov birligi</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        value={field.value}
                        onValueChange={(v) => {
                          if (v) field.onChange(v);
                        }}
                        className="w-full"
                      >
                        {SERVING_UNITS.map((unit) => (
                          <ToggleGroupItem
                            key={unit.value}
                            value={unit.value}
                            className="flex-1 text-xs font-semibold"
                          >
                            {unit.label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Serving size ── */}
              <FormField
                control={form.control}
                name="servingSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porsiya miqdori</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <RHFNumberField
                            value={field.value}
                            onChange={field.onChange}
                            minValue={0}
                            step={0.1}
                            placeholder="100"
                            formatOptions={{ maximumFractionDigits: 1 }}
                          />
                        </div>
                        <span className="shrink-0 rounded-xl border bg-muted/60 px-3 py-2 text-sm font-semibold text-muted-foreground min-w-[56px] text-center">
                          {watchedUnit || "g"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </DrawerBody>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-5 py-4">
          <Button type="submit" form="food-form" disabled={isPending}>
            {editingFood ? "Saqlash" : "Yaratish"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" type="button">
              Bekor qilish
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FoodFormDrawer;
