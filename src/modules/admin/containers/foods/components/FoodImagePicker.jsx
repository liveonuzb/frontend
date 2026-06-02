import React, { useRef } from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import join from "lodash/join";
import startsWith from "lodash/startsWith";
import {
  ImageIcon,
  LoaderCircleIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usePostQuery } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

const FoodImagePicker = ({
  value,
  uploadedImageId,
  onChange,
  onRemove,
  onUploadingChange,
  disabled,
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = React.useState(value || "");
  const [isUploading, setIsUploading] = React.useState(false);
  const { mutateAsync: uploadImage } = usePostQuery();

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(value || "");
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (startsWith(preview, "blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const updateUploading = React.useCallback(
    (nextUploading) => {
      setIsUploading(nextUploading);
      onUploadingChange?.(nextUploading);
    },
    [onUploadingChange],
  );

  const handleUpload = async (file) => {
    if (!file.type?.startsWith("image/")) {
      toast.error("Faqat rasm yuklash mumkin");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm 5MB dan kichik bo'lishi kerak");
      return;
    }

    const previousPreview = preview;
    const previousUploadedImageId = uploadedImageId;
    const localPreview = URL.createObjectURL(file);

    if (startsWith(preview, "blob:")) {
      URL.revokeObjectURL(preview);
    }

    setPreview(localPreview);
    updateUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await uploadImage({
        url: "/admin/food-images",
        attributes: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });

      const uploaded = getResponsePayload(response);
      const nextImageId = get(uploaded, "id", null);
      const nextImageUrl = get(uploaded, "url", localPreview);

      onChange?.({
        imageId: nextImageId,
        imageUrl: nextImageUrl,
        previousUploadedImageId,
      });
      setPreview(nextImageUrl);

      if (startsWith(localPreview, "blob:")) {
        URL.revokeObjectURL(localPreview);
      }

      toast.success("Rasm yuklandi");
    } catch (error) {
      if (startsWith(localPreview, "blob:")) {
        URL.revokeObjectURL(localPreview);
      }

      setPreview(previousPreview);
      toast.error(getErrorMessage(error, "Rasmni yuklab bo'lmadi"));
    } finally {
      updateUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-medium">Ovqat rasmi</Label>
        {preview ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreview("");
              onRemove?.();
            }}
            disabled={disabled || isUploading}
          >
            <Trash2Icon data-icon="inline-start" />
            Olib tashlash
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {preview ? (
          <img src={preview} alt="Ovqat rasmi" className="size-full object-cover" />
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
        aria-label="Ovqat rasmi faylini tanlash"
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

export default FoodImagePicker;
