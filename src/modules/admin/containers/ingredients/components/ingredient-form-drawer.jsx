import React from "react";
import { useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import OptionDrawerPicker from "@/components/option-drawer-picker";
import MultipleDrawerPicker from "@/components/multiple-drawer-picker";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner.jsx";
import { Button } from "@/components/ui/button";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { useLanguageStore } from "@/store";
import {
  UnsavedChangesAlert,
  useUnsavedChangesGuard,
} from "@/modules/admin/components/unsaved-changes-guard.jsx";
import { useAdminDrawerCloseNavigation } from "@/modules/admin/lib/admin-drawer-navigation.js";
import {
  ALLERGEN_TAG_OPTIONS,
  DIETARY_TAG_OPTIONS,
} from "@/modules/admin/lib/nutrition-tags.js";

import IngredientImagePicker from "./ingredient-image-picker.jsx";
import {
  getPayload,
  ingredientSchema,
  NumberInput,
  QUERY_KEY,
  resolveLabel,
  SERVING_UNITS,
} from "./utils.jsx";

import isArray from "lodash/isArray";
import map from "lodash/map";
import toNumber from "lodash/toNumber";
import toUpper from "lodash/toUpper";

const IngredientFormDrawer = ({ mode }) => {
  const { id } = useParams();
  const closeAdminDrawer = useAdminDrawerCloseNavigation(
    "/admin/ingredients/list",
  );
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const isEdit = mode === "edit";
  const { data, isLoading } = useGetQuery({
    url: `/admin/ingredients/${id}`,
    queryProps: {
      queryKey: ["admin", "ingredients", id],
      enabled: isEdit && Boolean(id),
    },
  });
  const item = getPayload(data);
  const form = useForm({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingUnit: "g",
      dietaryTags: [],
      allergenTags: [],
      isAllergic: false,
      isOnboarding: true,
    },
  });
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteImageMutation = useDeleteQuery();
  const [uploadedImageId, setUploadedImageId] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [removeImage, setRemoveImage] = React.useState(false);
  const isSaving = postMutation.isPending || patchMutation.isPending;
  const unsavedChanges = useUnsavedChangesGuard({
    when:
      (form.formState.isDirty || Boolean(uploadedImageId) || removeImage) &&
      !isSaving,
  });

  React.useEffect(() => {
    if (item) {
      form.reset({
        name: resolveLabel(item.translations, item.name, currentLanguage),
        calories: toNumber(item.calories) || 0,
        protein: toNumber(item.protein) || 0,
        carbs: toNumber(item.carbs) || 0,
        fat: toNumber(item.fat) || 0,
        servingUnit: item.servingUnit || "g",
        dietaryTags: isArray(item.dietaryTags) ? item.dietaryTags : [],
        allergenTags: isArray(item.allergenTags) ? item.allergenTags : [],
        isAllergic: Boolean(item.isAllergic),
        isOnboarding: item.isOnboarding !== false,
      });
    }
  }, [currentLanguage, form, item]);
  const currentImagePreview = removeImage
    ? null
    : imagePreview || item?.imageUrl || null;

  const cleanupImage = React.useCallback(
    async (imageId) => {
      if (!imageId) return;
      await deleteImageMutation
        .mutateAsync({ url: `/admin/ingredient-images/${imageId}` })
        .catch(() => {});
    },
    [deleteImageMutation],
  );

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      translations: {
        ...(item?.translations ?? {}),
        [currentLanguage]: values.name,
      },
      ...(uploadedImageId ? { imageId: uploadedImageId } : {}),
      ...(removeImage ? { removeImage: true } : {}),
    };
    const mutation = isEdit ? patchMutation : postMutation;

    await mutation.mutateAsync({
      url: isEdit ? `/admin/ingredients/${id}` : "/admin/ingredients",
      attributes: payload,
    });
    toast.success(isEdit ? "Ingredient yangilandi" : "Ingredient yaratildi");
    form.reset(values);
    unsavedChanges.runWithoutGuard(closeAdminDrawer);
  };

  const handleClose = React.useCallback(() => {
    void cleanupImage(uploadedImageId);
    closeAdminDrawer();
  }, [cleanupImage, closeAdminDrawer, uploadedImageId]);

  return (
    <>
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) {
            unsavedChanges.requestLeave(handleClose);
          }
        }}
        direction="bottom"
      >
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
          <DrawerHeader className="items-center text-center">
            <DrawerTitle>
              {isEdit ? "Ingredientni tahrirlash" : "Yangi ingredient"}
            </DrawerTitle>
            <DrawerDescription>
              Nutrition qiymatlari 100g uchun kiritiladi
            </DrawerDescription>
          </DrawerHeader>
          {isEdit && isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <DrawerBody>
                <Form {...form}>
                  <form
                    id="ingredient-form"
                    className="flex flex-col gap-4"
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <IngredientImagePicker
                      value={currentImagePreview}
                      uploadedImageId={uploadedImageId}
                      onChange={({
                        imageId,
                        imageUrl,
                        previousUploadedImageId,
                      }) => {
                        setUploadedImageId(imageId);
                        setImagePreview(imageUrl);
                        setRemoveImage(false);
                        if (previousUploadedImageId) {
                          void cleanupImage(previousUploadedImageId);
                        }
                      }}
                      onRemove={() => {
                        setImagePreview(null);
                        setRemoveImage(Boolean(item?.imageUrl));
                        if (uploadedImageId) void cleanupImage(uploadedImageId);
                        setUploadedImageId(null);
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Nomi ({toUpper(currentLanguage)})
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {map(["calories", "protein", "carbs", "fat"], (name) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{name}</FormLabel>
                            <FormControl>
                              <NumberInput
                                value={field.value}
                                onChange={field.onChange}
                                step={name === "calories" ? 1 : 0.1}
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
                          <FormLabel>O'lchov birligi</FormLabel>
                          <FormControl>
                            <OptionDrawerPicker
                              value={field.value}
                              onChange={field.onChange}
                              options={SERVING_UNITS}
                              title="O'lchov birligi"
                              placeholder="Tanlang"
                            />
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
                      name="isAllergic"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
                          <div>
                            <FormLabel>Allergen sifatida ko'rsatish</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              User onboardingda allergiya tanlovida chiqadi
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
                    <FormField
                      control={form.control}
                      name="isOnboarding"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
                          <div>
                            <FormLabel>
                              Onboardingda ustuvor ko'rsatish
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Yoqilgan bo'lsa ingredient onboarding comboboxida
                              birinchi chiqadi
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
              <DrawerFooter>
                <Button
                  form="ingredient-form"
                  type="submit"
                  disabled={isSaving}
                >
                  Saqlash
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
      <UnsavedChangesAlert
        open={unsavedChanges.confirmOpen}
        onCancel={unsavedChanges.cancelLeave}
        onConfirm={unsavedChanges.confirmLeave}
      />
    </>
  );
};

export default IngredientFormDrawer;
