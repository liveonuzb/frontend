import React, { useRef } from "react";
import { get, startsWith } from "lodash";
import {
  ImageIcon,
  LoaderCircleIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { usePostQuery } from "@/hooks/api";

import { getErrorMessage, getPayload } from "./utils.jsx";

const IngredientImagePicker = ({
  value,
  uploadedImageId,
  onChange,
  onRemove,
  disabled,
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = React.useState(value || "");
  const [isUploading, setIsUploading] = React.useState(false);
  const { mutateAsync } = usePostQuery();

  React.useEffect(() => {
    setPreview(value || "");
  }, [value]);

  React.useEffect(
    () => () => {
      if (startsWith(preview, "blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const handleUpload = async (file) => {
    if (!file.type?.startsWith("image/")) {
      toast.error("Faqat rasm yuklash mumkin");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await mutateAsync({
        url: "/admin/ingredient-images",
        attributes: formData,
        config: { headers: { "Content-Type": "multipart/form-data" } },
      });
      const uploaded = getPayload(response);

      onChange?.({
        imageId: get(uploaded, "id"),
        imageUrl: get(uploaded, "url"),
        previousUploadedImageId: uploadedImageId,
      });
      setPreview(get(uploaded, "url"));
      URL.revokeObjectURL(localPreview);
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreview(value || "");
      toast.error(getErrorMessage(error, "Rasmni yuklab bo'lmadi"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <FormLabel>Ingredient rasmi</FormLabel>
        {preview ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => {
              setPreview("");
              onRemove?.();
            }}
          >
            <Trash2Icon data-icon="inline-start" />
            Olib tashlash
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-muted/30"
      >
        {preview ? (
          <img
            src={preview}
            alt="Ingredient rasmi"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <ImageIcon />
            )}
            <span className="text-sm font-semibold">
              {isUploading ? "Yuklanmoqda..." : "Rasm yuklash"}
            </span>
          </span>
        )}
        {preview ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition group-hover:opacity-100">
            <UploadIcon />
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
};

export default IngredientImagePicker;
