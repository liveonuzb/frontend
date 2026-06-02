import React from "react";
import { CheckIcon, Trash2Icon } from "lucide-react";
import map from "lodash/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import ImageUploadTile from "@/components/image-upload-tile";
import { cn } from "@/lib/utils.js";
import { ADMIN_RECIPE_IMAGES } from "../recipe-mock-data.js";

const RecipeImagePickerDrawer = ({
  open,
  imageUrl,
  onOpenChange,
  onPick,
  onSelect,
  onRemove,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
      <DrawerHeader className="border-b border-border/40">
        <DrawerTitle>Retsept rasmini tanlash</DrawerTitle>
        <DrawerDescription>
          Rasm yuklang yoki admin library'dagi tayyor coverlardan foydalaning.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="flex flex-col gap-5 px-4 pb-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Gallery yoki kamera
          </h3>
          <ImageUploadTile
            imageUrl={imageUrl}
            ariaLabel="Retsept rasmi yuklash"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            emptyLabel="Rasm yuklash yoki kamera ochish"
            changeLabel="Rasmni almashtirish"
            removeLabel="Rasmni olib tashlash"
            onPick={(file) => {
              onPick?.(file);
              onOpenChange(false);
            }}
          />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Admin image library
            </h3>
            <Badge variant="secondary">{ADMIN_RECIPE_IMAGES.length} ta</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {map(ADMIN_RECIPE_IMAGES, (image) => {
              const selected = imageUrl === image.imageUrl;

              return (
                <button
                  key={image.id}
                  type="button"
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-muted text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary" : "border-border",
                  )}
                  onClick={() => {
                    onSelect?.(image.imageUrl);
                    onOpenChange(false);
                  }}
                >
                  <span className="block aspect-[4/3]">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="size-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  </span>
                  <span className="block min-w-0 bg-background px-3 py-2">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {image.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {image.category}
                    </span>
                  </span>
                  {selected ? (
                    <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <CheckIcon className="size-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      </DrawerBody>
      <DrawerFooter className="border-t border-border/40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {imageUrl && onRemove ? (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" />
            Rasmni olib tashlash
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Yopish
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
);

export default RecipeImagePickerDrawer;
