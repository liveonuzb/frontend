import React, { useRef } from "react";
import { get, isArray, join } from "lodash";
import {
  ImageIcon,
  LoaderCircleIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePostFileQuery } from "@/hooks/api";

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", response));

const getErrorMessage = (error, fallback) => {
  const message = get(error, "response.data.message");
  return isArray(message) ? join(message, ", ") : message || fallback;
};

export const AdminImagePickerBase = ({
  label = "Rasm",
  value,
  alt = "Rasm",
  folder,
  uploadUrl = "/user/media/upload",
  fileFieldName = "file",
  uploadText = "Rasm yuklash",
  uploadingText = "Yuklanmoqda...",
  maxSizeMb = 5,
  onChange,
  onUploadingChange,
}) => {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { mutateAsync: uploadImage } = usePostFileQuery({});

  const setUploading = React.useCallback(
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

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Rasm ${maxSizeMb}MB dan kichik bo'lishi kerak`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append(fileFieldName, file);
      if (folder) formData.append("folder", folder);

      const response = await uploadImage({
        url: uploadUrl,
        attributes: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
      const uploadedUrl = get(getPayload(response), "url");
      if (!uploadedUrl) {
        throw new Error("Upload response does not contain a URL");
      }

      onChange?.(uploadedUrl, getPayload(response));
      toast.success("Rasm yuklandi");
    } catch (error) {
      toast.error(getErrorMessage(error, "Rasmni yuklab bo'lmadi"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs font-bold">{label}</Label>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange?.("")}
            disabled={isUploading}
          >
            <Trash2Icon data-icon="inline-start" />
            O'chirish
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {value ? (
          <img src={value} alt={alt} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            {isUploading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <ImageIcon />
            )}
            <span className="text-sm font-semibold">
              {isUploading ? uploadingText : uploadText}
            </span>
          </span>
        )}
        {value ? (
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
