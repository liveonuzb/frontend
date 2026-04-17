import React from "react";
import { CameraIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ImageUploadField = ({
  value,
  alt,
  isUploading,
  isDragging,
  inputRef,
  onTrigger,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onClear,
  emptyLabel,
  idleHint,
  replaceHint,
  pickLabel,
  replaceLabel,
  imageClassName,
}) => {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative">
        <button
          type="button"
          disabled={isUploading}
          onClick={onTrigger}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "relative size-48 overflow-hidden rounded-full border-2 border-dashed transition-all",
            isDragging
              ? "scale-105 border-primary bg-primary/10"
              : value
                ? "border-primary"
                : "border-border bg-muted/30 hover:border-primary/60 hover:bg-muted/50",
          )}
        >
          {value ? (
            <img
              src={value}
              alt={alt}
              className={cn("size-full object-cover", imageClassName)}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              {isUploading ? (
                <Loader2Icon className="size-8 animate-spin text-primary" />
              ) : (
                <>
                  <CameraIcon className="size-8" />
                  <span className="text-xs font-medium">{emptyLabel}</span>
                </>
              )}
            </div>
          )}

          {value && !isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <CameraIcon className="size-7 text-white" />
            </div>
          ) : null}

          {isUploading && value ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2Icon className="size-8 animate-spin text-white" />
            </div>
          ) : null}
        </button>

        {value && !isUploading ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-red-600/20 bg-red-500 shadow-xl transition-all hover:bg-red-600 text-white active:scale-90"
          >
            <Trash2Icon className="size-4" />
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">{value ? replaceHint : idleHint}</p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WEBP • Maksimum 5MB
        </p>
      </div>
    </div>
  );
};
