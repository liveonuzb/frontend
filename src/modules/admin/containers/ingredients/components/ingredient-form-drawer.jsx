import React from "react";
import { useNavigate, useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import OptionDrawerPicker from "@/components/option-drawer-picker";
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
import { useDeleteQuery, useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { useLanguageStore } from "@/store";

import IngredientImagePicker from "./ingredient-image-picker.jsx";
import {
  getPayload,
  ingredientSchema,
  NumberInput,
  QUERY_KEY,
  resolveLabel,
  SERVING_UNITS,
} from "./utils.jsx";

const IngredientFormDrawer = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
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

  React.useEffect(() => {
    if (item) {
      form.reset({
        name: resolveLabel(item.translations, item.name, currentLanguage),
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
        servingUnit: item.servingUnit || "g",
        isAllergic: Boolean(item.isAllergic),
        isOnboarding: item.isOnboarding !== false,
      });
      setImagePreview(item.imageUrl || null);
    }
  }, [currentLanguage, form, item]);

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
    navigate("/admin/ingredients/list");
  };

  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) {
          void cleanupImage(uploadedImageId);
          navigate("/admin/ingredients/list");
        }
      }}
      direction="bottom"
    >
      <DrawerContent className="mx-auto data-[vaul-drawer-direction=bottom]:md:max-w-md">
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
                    value={imagePreview}
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
                          Nomi ({currentLanguage.toUpperCase()})
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {["calories", "protein", "carbs", "fat"].map((name) => (
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
                          <FormLabel>Onboardingda ustuvor ko'rsatish</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Yoqilgan bo'lsa ingredient onboarding comboboxida birinchi chiqadi
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
                disabled={postMutation.isPending || patchMutation.isPending}
              >
                Saqlash
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default IngredientFormDrawer;
