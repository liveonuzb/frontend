import React from "react";
import { ImageIcon, Loader2Icon, Trash2Icon, UploadIcon, XIcon } from "lucide-react";
import get from "lodash/get";
import map from "lodash/map";
import size from "lodash/size";
import toArray from "lodash/toArray";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils.js";

const EMPTY_FILES = [];

const getFileName = (file, index) =>
  get(file, "name") || `Image ${index + 1}`;

const getFileKey = (file, index) => {
  const name = getFileName(file, index);
  return [
    name,
    get(file, "lastModified", ""),
    get(file, "size", ""),
    get(file, "type", ""),
  ].join("-");
};

const useFilePreviewUrls = (files) => {
  const previewUrls = React.useMemo(() => {
    const canPreview =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
    if (!canPreview || !size(files)) {
      return EMPTY_FILES;
    }

    return map(files, (file) => URL.createObjectURL(file));
  }, [files]);

  React.useEffect(() => {
    return () => {
      map(previewUrls, (url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  return previewUrls;
};

const ImageUploadTile = ({
  imageUrl,
  files = EMPTY_FILES,
  multiple = false,
  accept = "image/*",
  disabled = false,
  isUploading = false,
  ariaLabel,
  imageAlt = "",
  emptyLabel = "Rasm yuklash",
  changeLabel = "O'zgartirish",
  uploadingLabel = "Yuklanmoqda...",
  removeLabel = "Rasmni o'chirish",
  className,
  tileClassName,
  onPick,
  onRemove,
  onRemoveFile,
}) => {
  const inputRef = React.useRef(null);
  const previewUrls = useFilePreviewUrls(files);

  const handlePick = React.useCallback(
    (event) => {
      const pickedFiles = toArray(get(event, "target.files", []));
      if (multiple) {
        if (size(pickedFiles)) {
          onPick?.(pickedFiles);
        }
      } else {
        const file = get(pickedFiles, "0");
        if (file) {
          onPick?.(file);
        }
      }
      event.target.value = "";
    },
    [multiple, onPick],
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          tileClassName,
        )}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={imageAlt}
              className="size-full object-cover"
              loading="lazy"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
              <UploadIcon className="size-5" />
              <span className="text-xs font-semibold">{changeLabel}</span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="grid size-11 place-items-center rounded-xl bg-background shadow-sm">
              {isUploading ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <ImageIcon className="size-5" />
              )}
            </span>
            <span className="text-sm font-semibold">
              {isUploading ? uploadingLabel : emptyLabel}
            </span>
          </span>
        )}
      </button>

      {imageUrl && onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-destructive hover:text-destructive"
          disabled={disabled || isUploading}
          onClick={onRemove}
        >
          <Trash2Icon data-icon="inline-start" />
          {removeLabel}
        </Button>
      ) : null}

      {multiple && size(files) ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {map(files, (file, index) => {
            const name = getFileName(file, index);
            const previewUrl = get(previewUrls, String(index), "");

            return (
              <div
                key={getFileKey(file, index)}
                className="relative overflow-hidden rounded-2xl border border-border/70 bg-background/80"
              >
                <div className="aspect-square bg-muted/40">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <ImageIcon className="size-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 px-2 py-1.5 text-xs font-semibold">
                  <span className="block truncate">{name}</span>
                </div>
                {onRemoveFile ? (
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm"
                    onClick={() => onRemoveFile(index)}
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label={ariaLabel}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handlePick}
      />
    </div>
  );
};

export default ImageUploadTile;
