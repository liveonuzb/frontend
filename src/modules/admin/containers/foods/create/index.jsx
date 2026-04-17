import React from "react";
import { useNavigate } from "react-router";
import { get, isArray, startsWith, toNumber, trim } from "lodash";
import { toast } from "sonner";
import { useLanguageStore } from "@/store";
import { useGetQuery, usePostQuery, useDeleteQuery } from "@/hooks/api";
import FoodFormDrawer from "../components/FoodFormDrawer.jsx";

const createFoodPayload = (form, uploadedImageId, language) => {
  const localizedName = trim(form.name);

  return {
    name: localizedName,
    categoryIds: form.categoryIds,
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

const CreateFoodPage = () => {
  const navigate = useNavigate();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);

  const { data: categoriesData } = useGetQuery({
    url: "/admin/food-categories",
    queryProps: { queryKey: FOOD_CATEGORIES_QUERY_KEY },
  });
  const categories = get(categoriesData, "data.data", []);

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
  const uploadMutation = usePostQuery();
  const imageDeleteMutation = useDeleteQuery();

  const [uploadedImageId, setUploadedImageId] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const uploadedImageIdRef = React.useRef(null);

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

  React.useEffect(() => {
    return () => {
      if (uploadedImageIdRef.current) {
        void deleteFoodImage(uploadedImageIdRef.current).catch(() => {});
      }
    };
  }, [deleteFoodImage]);

  const cleanupUploadedImage = React.useCallback(
    async (imageId = uploadedImageIdRef.current) => {
      if (!imageId) return;
      try {
        await deleteFoodImage(imageId);
      } catch {
        // Silent cleanup
      } finally {
        setUploadedImageId((current) =>
          current === imageId ? null : current,
        );
      }
    },
    [deleteFoodImage],
  );

  const uploadFoodImage = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadMutation.mutateAsync({
        url: "/admin/food-images",
        attributes: formData,
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });
      return get(response, "data");
    },
    [uploadMutation],
  );

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Faqat rasm yuklash mumkin");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm 5MB dan kichik bo'lishi kerak");
      return;
    }

    const previousPreview = imagePreview;
    const previousUploadedImageId = uploadedImageId;
    const localPreview = URL.createObjectURL(file);

    if (startsWith(imagePreview, "blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(localPreview);

    try {
      const uploaded = await uploadFoodImage(file);
      const nextUploadedImageId = get(uploaded, "id", null);

      setUploadedImageId(nextUploadedImageId);
      setImagePreview(get(uploaded, "url", localPreview));

      if (startsWith(localPreview, "blob:")) {
        URL.revokeObjectURL(localPreview);
      }

      if (
        previousUploadedImageId &&
        previousUploadedImageId !== nextUploadedImageId
      ) {
        void cleanupUploadedImage(previousUploadedImageId);
      }
      toast.success("Rasm yuklandi");
    } catch (error) {
      if (startsWith(localPreview, "blob:")) {
        URL.revokeObjectURL(localPreview);
      }

      setUploadedImageId(previousUploadedImageId);
      setImagePreview(previousPreview);

      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Rasmni yuklab bo'lmadi",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    const currentUploadedImageId = uploadedImageIdRef.current;

    if (startsWith(imagePreview, "blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setUploadedImageId(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (currentUploadedImageId) {
      void cleanupUploadedImage(currentUploadedImageId);
    }
  };

  const handleSave = async (data) => {
    const payload = createFoodPayload(
      {
        name: data.name,
        categoryIds: data.categoryIds,
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
      setUploadedImageId(null);
      navigate("../list");
    } catch (error) {
      const message = error?.response?.data?.message;
      toast.error(
        isArray(message)
          ? message.join(", ")
          : message || "Saqlab bo'lmadi",
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
      categories={categories}
      currentLanguage={currentLanguage}
      currentLanguageMeta={currentLanguageMeta}
      imagePreview={imagePreview}
      fileInputRef={fileInputRef}
      isUploadingImage={uploadMutation.isPending}
      isDeletingImage={imageDeleteMutation.isPending}
      isCreating={createMutation.isPending}
      isUpdating={false}
      onImageChange={handleImageChange}
      onRemoveImage={handleRemoveImage}
      onSave={handleSave}
    />
  );
};

export default CreateFoodPage;
