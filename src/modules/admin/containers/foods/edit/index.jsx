import React from "react";
import { useParams } from "react-router";
import find from "lodash/find";
import get from "lodash/get";
import isArray from "lodash/isArray";
import isObject from "lodash/isObject";
import startsWith from "lodash/startsWith";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import filter from "lodash/filter";
import map from "lodash/map";
import toUpper from "lodash/toUpper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useLanguageStore } from "@/store";
import { useGetQuery, usePatchQuery, useDeleteQuery } from "@/hooks/api";
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
import { Spinner } from "@/components/ui/spinner.jsx";
import { Switch } from "@/components/ui/switch";
import OptionDrawerPicker from "@/components/option-drawer-picker";
import MultipleDrawerPicker from "@/components/multiple-drawer-picker";
import {
  UnsavedChangesAlert,
  useUnsavedChangesGuard,
} from "@/modules/admin/components/unsaved-changes-guard";
import {
  ALLERGEN_TAG_OPTIONS,
  DIETARY_TAG_OPTIONS,
} from "@/modules/admin/lib/nutrition-tags.js";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
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
  dietaryTags: z.array(z.string()).default([]),
  allergenTags: z.array(z.string()).default([]),
  isOnboarding: z.boolean().default(true),
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

const resolveLabel = (translations, fallback, language) => {
  if (isObject(translations)) {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;

    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;
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
  editingFood,
  initialValues,
  currentLanguage,
  currentLanguageMeta,
  imagePreview,
  uploadedImageId,
  isUploadingImage,
  isDeletingImage,
  isUpdating,
  isLoading,
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
      dietaryTags: [],
      allergenTags: [],
      isOnboarding: true,
    },
  });

  const watchedUnit = form.watch("servingUnit");
  const watchedUnitLabel =
    get(
      find(SERVING_UNITS, (unit) => unit.value === watchedUnit),
      "label",
    ) || watchedUnit;

  React.useEffect(() => {
    if (open && initialValues) {
      form.reset({
        name: initialValues.name ?? "",
        categoryIds: initialValues.categoryIds ?? [],
        cuisineIds: initialValues.cuisineIds ?? [],
        nutritionMode: initialValues.nutritionMode ?? "manual",
        calories: toNumber(initialValues.calories) || 0,
        maxIntake:
          initialValues.maxIntake !== "" && initialValues.maxIntake != null
            ? toNumber(initialValues.maxIntake)
            : undefined,
        protein: toNumber(initialValues.protein) || 0,
        carbs: toNumber(initialValues.carbs) || 0,
        fat: toNumber(initialValues.fat) || 0,
        servingUnit: initialValues.servingUnit || "g",
        servingSize: toNumber(initialValues.servingSize) || 100,
        dietaryTags: isArray(initialValues.dietaryTags)
          ? initialValues.dietaryTags
          : [],
        allergenTags: isArray(initialValues.allergenTags)
          ? initialValues.allergenTags
          : [],
        isOnboarding: initialValues.isOnboarding !== false,
      });
    }
  }, [form, initialValues, open]);

  const isPending = isUpdating || isUploadingImage || isDeletingImage;
  const unsavedChanges = useUnsavedChangesGuard({
    when: (form.formState.isDirty || Boolean(uploadedImageId)) && !isPending,
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
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader className="text-center">
          <DrawerTitle className="text-lg font-bold">
            Ovqatni tahrirlash
          </DrawerTitle>
          <DrawerDescription className="mt-1">
            {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
            {currentLanguageMeta?.name ?? toUpper(currentLanguage)} tilida
            ma&apos;lumot kiriting
          </DrawerDescription>
        </DrawerHeader>

        {isLoading || !editingFood ? (
          <div className="flex min-h-72 items-center justify-center px-4 py-8">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : (
          <>
            <DrawerBody>
              <Form {...form}>
                <form
                  id="food-edit-form"
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
                          Nomi ({toUpper(currentLanguage)}){" "}
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
                          Kategoriyalar{" "}
                          <span className="text-destructive">*</span>
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
                              resolveLabel(
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
                              resolveLabel(
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
                          <RHFNumberField
                            value={field.value}
                            onChange={field.onChange}
                          />
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
                          <RHFNumberField
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {map([
                    ["protein", "Protein (g)"],
                    ["carbs", "Uglevod (g)"],
                    ["fat", "Yog' (g)"],
                  ], ([name, label]) => (
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
                  <FormField
                    control={form.control}
                    name="dietaryTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary taglar</FormLabel>
                        <FormControl>
                          <MultipleDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={DIETARY_TAG_OPTIONS}
                            title="Dietary taglar"
                            placeholder="Tag tanlang"
                            doneLabel="Tayyor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allergenTags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergen taglar</FormLabel>
                        <FormControl>
                          <MultipleDrawerPicker
                            value={field.value}
                            onChange={field.onChange}
                            options={ALLERGEN_TAG_OPTIONS}
                            title="Allergen taglar"
                            placeholder="Allergen tanlang"
                            doneLabel="Tayyor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isOnboarding"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
                        <div>
                          <FormLabel>Onboardingda ustuvor ko'rsatish</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Yoqilgan bo'lsa ovqat onboarding comboboxida
                            birinchi chiqadi.
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </DrawerBody>

            <DrawerFooter className="border-t bg-muted/5 gap-2 px-5 py-4">
              <Button type="submit" form="food-edit-form" disabled={isPending}>
                Saqlash
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleOpenChange(false)}
              >
                Bekor qilish
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
      <UnsavedChangesAlert
        open={unsavedChanges.confirmOpen}
        onCancel={unsavedChanges.cancelLeave}
        onConfirm={unsavedChanges.confirmLeave}
      />
    </Drawer>
  );
};

const createFormFromFood = (food, language) => ({
  name: resolveLabel(food?.translations, food?.name ?? "", language),
  categoryIds: isArray(food?.categoryIds) ? food.categoryIds : [],
  cuisineIds: isArray(food?.cuisineIds) ? food.cuisineIds : [],
  nutritionMode: get(food, "nutritionMode", "manual"),
  calories: String(get(food, "calories", "")),
  protein: String(get(food, "protein", "")),
  carbs: String(get(food, "carbs", "")),
  fat: String(get(food, "fat", "")),
  servingSize: String(get(food, "servingSize", "")),
  servingUnit: get(food, "servingUnit", "g"),
  dietaryTags: isArray(get(food, "dietaryTags"))
    ? get(food, "dietaryTags")
    : [],
  allergenTags: isArray(get(food, "allergenTags"))
    ? get(food, "allergenTags")
    : [],
  maxIntake:
    get(food, "maxIntake") !== null && get(food, "maxIntake") !== undefined
      ? String(get(food, "maxIntake"))
      : "",
  translations: isObject(food?.translations) ? food.translations : {},
  isOnboarding: get(food, "isOnboarding", true),
  removeImage: false,
});

const createFoodPayload = (form, uploadedImageId, editingFood, language) => {
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
    dietaryTags: form.dietaryTags ?? [],
    allergenTags: form.allergenTags ?? [],
    translations: {
      ...form.translations,
      [language]: localizedName,
    },
    ...(form.maxIntake !== ""
      ? { maxIntake: toNumber(form.maxIntake) || 0 }
      : {}),
    ...(editingFood ? { isActive: Boolean(editingFood.isActive) } : {}),
    isOnboarding: form.isOnboarding !== false,
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
const FOODS_LIST_PATH = "/admin/foods/list";

const EditFoodPage = () => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(FOODS_LIST_PATH);
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: foodData, isLoading: isFoodLoading } = useGetQuery({
    url: `/admin/foods/${id}`,
    queryProps: {
      queryKey: ["admin", "food", id],
      enabled: Boolean(id),
    },
  });
  const editingFood =
    get(foodData, "data.data", null) || get(foodData, "data", null);

  const { data: languagesData } = useGetQuery({
    url: "/admin/languages",
    queryProps: { queryKey: ["admin", "languages"] },
  });
  const languages = get(languagesData, "data.data", []);

  const activeLanguages = React.useMemo(
    () => filter((languages || []), (language) => language.isActive),
    [languages],
  );

  const currentLanguageMeta = React.useMemo(
    () => find(activeLanguages, (language) => language.code === currentLanguage),
    [activeLanguages, currentLanguage],
  );

  const patchMutation = usePatchQuery({
    queryKey: FOODS_QUERY_KEY,
    listKey: [...FOOD_CATEGORY_FOODS_QUERY_KEY],
  });
  const imageDeleteMutation = useDeleteQuery();

  const [uploadedImageId, setUploadedImageId] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [imageInitialized, setImageInitialized] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [removeImage, setRemoveImage] = React.useState(false);
  const uploadedImageIdRef = React.useRef(null);
  const cleanupOnUnmountRef = React.useRef(true);

  React.useEffect(() => {
    uploadedImageIdRef.current = uploadedImageId;
  }, [uploadedImageId]);

  React.useEffect(() => {
    if (editingFood && !imageInitialized) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImagePreview(editingFood?.imageUrl || null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImageInitialized(true);
    }
  }, [editingFood, imageInitialized]);

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
      setRemoveImage(false);

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
    setRemoveImage(Boolean(editingFood?.imageUrl));

    if (currentUploadedImageId) {
      void cleanupUploadedImage(currentUploadedImageId);
    }
  };

  const initialValues = React.useMemo(
    () =>
      editingFood ? createFormFromFood(editingFood, currentLanguage) : null,
    [editingFood, currentLanguage],
  );

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
        dietaryTags: data.dietaryTags,
        allergenTags: data.allergenTags,
        isOnboarding: data.isOnboarding,
        maxIntake: data.maxIntake !== undefined ? String(data.maxIntake) : "",
        translations: editingFood?.translations ?? {},
        removeImage,
      },
      uploadedImageId,
      editingFood,
      currentLanguage,
    );

    try {
      await patchMutation.mutateAsync({
        url: `/admin/foods/${id}`,
        attributes: payload,
      });
      toast.success("Ovqat yangilandi");
      cleanupOnUnmountRef.current = false;
      setUploadedImageId(null);
      uploadedImageIdRef.current = null;
      return {
        afterReset: closeAdminDrawer,
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
      closeAdminDrawer();
    }
  };

  if (isFoodLoading || !editingFood) {
    return (
      <FoodFormDrawer
        open
        onOpenChange={handleOpenChange}
        editingFood={null}
        initialValues={null}
        currentLanguage={currentLanguage}
        currentLanguageMeta={currentLanguageMeta}
        imagePreview={null}
        uploadedImageId={null}
        isUploadingImage={false}
        isDeletingImage={false}
        isCreating={false}
        isUpdating={false}
        onImageUploaded={() => {}}
        onRemoveImage={() => {}}
        onUploadingImageChange={() => {}}
        onSave={() => {}}
      />
    );
  }

  return (
    <FoodFormDrawer
      open
      onOpenChange={handleOpenChange}
      editingFood={editingFood}
      initialValues={initialValues}
      currentLanguage={currentLanguage}
      currentLanguageMeta={currentLanguageMeta}
      imagePreview={imagePreview}
      uploadedImageId={uploadedImageId}
      isUploadingImage={isUploadingImage}
      isDeletingImage={imageDeleteMutation.isPending}
      isCreating={false}
      isUpdating={patchMutation.isPending}
      onImageUploaded={handleImageUploaded}
      onRemoveImage={handleRemoveImage}
      onUploadingImageChange={setIsUploadingImage}
      onSave={handleSave}
    />
  );
};

export default EditFoodPage;
