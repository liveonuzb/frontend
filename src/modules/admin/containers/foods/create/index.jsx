import React from "react";
import { useNavigate } from "react-router";
import {
  find,
  get,
  isArray,
  startsWith,
  toNumber,
  trim,
} from "lodash";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useLanguageStore } from "@/store";
import { useGetQuery, usePostQuery, useDeleteQuery } from "@/hooks/api";
import {
  Drawer,
  DrawerBody,
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
import OptionDrawerPicker from "@/components/option-drawer-picker";
import MultipleDrawerPicker from "@/components/multiple-drawer-picker";
import {
  UnsavedChangesAlert,
  useUnsavedChangesGuard,
} from "@/modules/admin/components/unsaved-changes-guard";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field";
import FoodImagePicker from "../components/FoodImagePicker.jsx";

const foodSchema = z.object({
  name: z.string().min(1, "Ovqat nomini kiriting"),
  categoryIds: z.array(z.number()).min(1, "Kamida bitta kategoriya tanlang"),
  cuisineIds: z.array(z.number()).optional(),
  nutritionMode: z.enum(["manual", "recipe"]),
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

const NUTRITION_MODES = [
  { value: "manual", label: "Qo'lda kiritish" },
  { value: "recipe", label: "Recipe orqali" },
];

const resolveCategoryLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const val = get(translations, language, "");
    if (val && String(val).trim()) return String(val).trim();
    const uz = get(translations, "uz", "");
    if (uz && String(uz).trim()) return String(uz).trim();
  }
  return fallback;
};

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

const FoodFormDrawer = ({
  open,
  onOpenChange,
  currentLanguage,
  currentLanguageMeta,
  imagePreview,
  uploadedImageId,
  isUploadingImage,
  isDeletingImage,
  isCreating,
  onImageUploaded,
  onRemoveImage,
  onUploadingImageChange,
  onSave,
}) => {
  const form = useForm({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: "",
      categoryIds: [],
      cuisineIds: [],
      nutritionMode: "manual",
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
  const watchedUnitLabel =
    get(
      find(SERVING_UNITS, (unit) => unit.value === watchedUnit),
      "label",
    ) || watchedUnit;

  const isPending = isCreating || isUploadingImage || isDeletingImage;
  const unsavedChanges = useUnsavedChangesGuard({
    when:
      (form.formState.isDirty || Boolean(uploadedImageId)) && !isPending,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const result = await onSave(data);
    form.reset(data);
    result?.afterReset?.();
  });

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      unsavedChanges.requestLeave(() => onOpenChange(false));
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-lg font-bold">Yangi ovqat</DrawerTitle>
          <DrawerDescription className="mt-1">
            {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
            {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()} tilida
            ma&apos;lumot kiriting
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody>
          <Form {...form}>
            <form
              id="food-create-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <FoodImagePicker
                value={imagePreview}
                uploadedImageId={uploadedImageId}
                onChange={onImageUploaded}
                onRemove={onRemoveImage}
                onUploadingChange={onUploadingImageChange}
                disabled={isDeletingImage}
              />

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

              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kategoriyalar <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <MultipleDrawerPicker
                        value={field.value}
                        onChange={field.onChange}
                        url="/admin/food-categories"
                        queryKey={FOOD_CATEGORIES_QUERY_KEY}
                        valueKey="id"
                        title="Kategoriyalarni tanlang"
                        description="Ovqat tegishli bo'lgan kategoriyalarni belgilang"
                        placeholder="Kategoriyalarni tanlang"
                        searchPlaceholder="Kategoriya qidirish..."
                        emptyText="Kategoriya topilmadi"
                        triggerClassName="h-11"
                        getOptionLabel={(category) =>
                          resolveCategoryLabel(
                            category.translations,
                            category.name,
                            currentLanguage,
                          )
                        }
                        getOptionDescription={(category) =>
                          `ID: ${category.id}`
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cuisineIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oshxonalar</FormLabel>
                    <FormControl>
                      <MultipleDrawerPicker
                        value={field.value}
                        onChange={field.onChange}
                        url="/admin/cuisines"
                        queryKey={CUISINES_QUERY_KEY}
                        valueKey="id"
                        title="Oshxonalarni tanlang"
                        description="Ovqat tegishli bo'lgan oshxonalarni belgilang"
                        placeholder="Oshxonalarni tanlang"
                        searchPlaceholder="Oshxona qidirish..."
                        emptyText="Oshxona topilmadi"
                        triggerClassName="h-11"
                        getOptionLabel={(cuisine) =>
                          resolveCategoryLabel(
                            cuisine.translations,
                            cuisine.name,
                            currentLanguage,
                          )
                        }
                        getOptionDescription={(cuisine) =>
                          `ID: ${cuisine.id}`
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutritionMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nutrition mode</FormLabel>
                    <FormControl>
                      <OptionDrawerPicker
                        value={field.value}
                        onChange={field.onChange}
                        options={NUTRITION_MODES}
                        title="Nutrition mode"
                        placeholder="Mode tanlang"
                        triggerClassName="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kaloriya <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RHFNumberField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxIntake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maks. kunlik miqdor</FormLabel>
                    <FormControl>
                      <RHFNumberField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {[
                ["protein", "Protein (g)"],
                ["carbs", "Uglevod (g)"],
                ["fat", "Yog' (g)"],
              ].map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <RHFNumberField
                          value={field.value}
                          onChange={field.onChange}
                          step={0.1}
                          placeholder="0.0"
                          formatOptions={{ maximumFractionDigits: 1 }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={form.control}
                name="servingUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O&apos;lchov birligi</FormLabel>
                    <FormControl>
                      <OptionDrawerPicker
                        value={field.value}
                        onChange={field.onChange}
                        options={SERVING_UNITS}
                        title="O'lchov birligini tanlang"
                        description="Porsiya va maksimal kunlik miqdor uchun birlik"
                        placeholder="O'lchov birligini tanlang"
                        triggerClassName="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            step={0.1}
                            placeholder="100"
                            formatOptions={{ maximumFractionDigits: 1 }}
                          />
                        </div>
                        <span className="shrink-0 rounded-xl border bg-muted/60 px-3 py-2 text-sm font-semibold text-muted-foreground min-w-[56px] text-center">
                          {watchedUnitLabel || "g"}
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
          <Button type="submit" form="food-create-form" disabled={isPending}>
            Yaratish
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
      <UnsavedChangesAlert
        open={unsavedChanges.confirmOpen}
        onCancel={unsavedChanges.cancelLeave}
        onConfirm={unsavedChanges.confirmLeave}
      />
    </Drawer>
  );
};

const createFoodPayload = (form, uploadedImageId, language) => {
  const localizedName = trim(form.name);

  return {
    name: localizedName,
    categoryIds: form.categoryIds,
    cuisineIds: form.cuisineIds ?? [],
    nutritionMode: form.nutritionMode ?? "manual",
    calories: toNumber(form.calories) || 0,
    protein: toNumber(form.protein) || 0,
    carbs: toNumber(form.carbs) || 0,
    fat: toNumber(form.fat) || 0,
    servingSize: toNumber(form.servingSize) || 0,
    servingUnit: form.servingUnit,
    translations: {
      [language]: localizedName,
    },
    ...(form.maxIntake !== ""
      ? { maxIntake: toNumber(form.maxIntake) || 0 }
      : {}),
    ...(form.removeImage ? { removeImage: true } : {}),
    ...(!form.removeImage && uploadedImageId
      ? { imageId: uploadedImageId }
      : {}),
  };
};

const FOODS_QUERY_KEY = ["admin", "foods"];
const FOOD_CATEGORIES_QUERY_KEY = ["admin", "food-categories"];
const FOOD_CATEGORY_FOODS_QUERY_KEY = ["admin", "food-category-foods"];
const CUISINES_QUERY_KEY = ["admin", "cuisines"];

const CreateFoodPage = () => {
  const navigate = useNavigate();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const activeLanguages = React.useMemo(
    () => (languages || []).filter((language) => language.isActive),
    [languages],
  );

  const currentLanguageMeta = React.useMemo(
    () => activeLanguages.find((language) => language.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const createMutation = usePostQuery({
    queryKey: FOODS_QUERY_KEY,
    listKey: [...FOOD_CATEGORY_FOODS_QUERY_KEY, ...FOOD_CATEGORIES_QUERY_KEY],
  });
  const imageDeleteMutation = useDeleteQuery();

  const [uploadedImageId, setUploadedImageId] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const uploadedImageIdRef = React.useRef(null);
  const cleanupOnUnmountRef = React.useRef(true);

  React.useEffect(() => {
    uploadedImageIdRef.current = uploadedImageId;
  }, [uploadedImageId]);

  React.useEffect(() => {
    return () => {
      if (startsWith(imagePreview, "blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const deleteFoodImage = React.useCallback(
    async (imageId) =>
      imageDeleteMutation.mutateAsync({ url: `/admin/food-images/${imageId}` }),
    [imageDeleteMutation],
  );

  React.useEffect(
    () => () => {
      if (cleanupOnUnmountRef.current && uploadedImageIdRef.current) {
        void deleteFoodImage(uploadedImageIdRef.current).catch(() => {});
      }
    },
    // This cleanup must run only on unmount. Running it on every mutation
    // render can repeatedly delete the same temporary image.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const cleanupUploadedImage = React.useCallback(
    async (imageId = uploadedImageIdRef.current) => {
      if (!imageId) return;
      try {
        await deleteFoodImage(imageId);
      } catch {
        // Silent cleanup
      } finally {
        setUploadedImageId((current) => (current === imageId ? null : current));
      }
    },
    [deleteFoodImage],
  );

  const handleImageUploaded = React.useCallback(
    ({ imageId, imageUrl, previousUploadedImageId }) => {
      setUploadedImageId(imageId);
      setImagePreview(imageUrl);

      if (previousUploadedImageId && previousUploadedImageId !== imageId) {
        void cleanupUploadedImage(previousUploadedImageId);
      }
    },
    [cleanupUploadedImage],
  );

  const handleRemoveImage = () => {
    const currentUploadedImageId = uploadedImageIdRef.current;

    if (startsWith(imagePreview, "blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setUploadedImageId(null);
    setImagePreview(null);

    if (currentUploadedImageId) {
      void cleanupUploadedImage(currentUploadedImageId);
    }
  };

  const handleSave = async (data) => {
    const payload = createFoodPayload(
      {
        name: data.name,
        categoryIds: data.categoryIds,
        cuisineIds: data.cuisineIds ?? [],
        nutritionMode: data.nutritionMode,
        calories: String(data.calories),
        protein: String(data.protein),
        carbs: String(data.carbs),
        fat: String(data.fat),
        servingSize: String(data.servingSize),
        servingUnit: data.servingUnit,
        maxIntake: data.maxIntake !== undefined ? String(data.maxIntake) : "",
        translations: {},
        removeImage: false,
      },
      uploadedImageId,
      currentLanguage,
    );

    try {
      await createMutation.mutateAsync({
        url: "/admin/foods",
        attributes: payload,
      });
      toast.success("Ovqat yaratildi");
      cleanupOnUnmountRef.current = false;
      setUploadedImageId(null);
      uploadedImageIdRef.current = null;
      return {
        afterReset: () => navigate(-1),
      };
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message) ? message.join(", ") : message || "Saqlab bo'lmadi",
      );
      throw error;
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      void cleanupUploadedImage();
      navigate("../list");
    }
  };

  return (
    <FoodFormDrawer
      open
      onOpenChange={handleOpenChange}
      editingFood={null}
      initialValues={null}
      currentLanguage={currentLanguage}
      currentLanguageMeta={currentLanguageMeta}
      imagePreview={imagePreview}
      uploadedImageId={uploadedImageId}
      isUploadingImage={isUploadingImage}
      isDeletingImage={imageDeleteMutation.isPending}
      isCreating={createMutation.isPending}
      isUpdating={false}
      onImageUploaded={handleImageUploaded}
      onRemoveImage={handleRemoveImage}
      onUploadingImageChange={setIsUploadingImage}
      onSave={handleSave}
    />
  );
};

export default CreateFoodPage;
