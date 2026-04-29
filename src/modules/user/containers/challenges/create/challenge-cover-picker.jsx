import React from "react";
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChallengeCoverPicker = ({
  imageFile,
  imagePreviewUrl,
  onImageChange,
  onImageRemove,
}) => {
  const inputRef = React.useRef(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">Rasm</span>
        {imageFile ? (
          <Button type="button" variant="ghost" size="sm" onClick={onImageRemove}>
            <Trash2Icon className="mr-2 size-4" />
            O'chirish
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 text-left transition hover:border-primary/50 hover:bg-primary/5"
      >
        {imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt="Challenge cover"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-sm font-medium">Rasm yuklash</span>
          </div>
        )}
        {imagePreviewUrl ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition group-hover:opacity-100">
            <UploadIcon className="size-6" />
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
          if (file) onImageChange(file);
          event.target.value = "";
        }}
      />
    </div>
  );
};

export default ChallengeCoverPicker;
