import React from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer";

const BasicStep = ({ formData, setFormData, currentLanguage, currentLanguageMeta, onNext }) => {
  const handleImageChange = React.useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFormData((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreviewUrl);
      }
      return {
        ...current,
        imageFile: file,
        imagePreviewUrl: previewUrl,
        removeImage: false,
      };
    });
  }, [setFormData]);

  const handleImageRemove = React.useCallback(() => {
    setFormData((current) => {
      if (current.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.imagePreviewUrl);
      }
      return {
        ...current,
        imageFile: null,
        imagePreviewUrl: "",
        removeImage: Boolean(current.imageId),
      };
    });
  }, [setFormData]);

  React.useEffect(
    () => () => {
      if (formData.imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(formData.imagePreviewUrl);
      }
    },
    [formData.imagePreviewUrl],
  );

  return (
    <>
      <DrawerBody className="flex flex-col gap-8 py-6">
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">
            Joriy til:{" "}
            {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
            {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Shu drawer joriy tildagi matnni yangilaydi. Boshqa tillarni
            Tarjimalar bosqichidan boshqaring.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold text-muted-foreground tracking-wide px-2 uppercase">
            Asosiy ma'lumotlar
          </span>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col gap-4 p-4">
            <Field>
              <FieldLabel className="flex items-center gap-2 font-semibold">
                <ImagePlusIcon className="size-4 text-primary" />
                Cover rasmi
              </FieldLabel>
              <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4">
                <div className="size-20 shrink-0 overflow-hidden rounded-xl border bg-muted/30">
                  {formData.imagePreviewUrl ? (
                    <img loading="lazy"
                      src={formData.imagePreviewUrl}
                      alt="Challenge cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImagePlusIcon className="size-5" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" asChild>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      Rasm tanlash
                    </label>
                  </Button>
                  {formData.imagePreviewUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageRemove}
                    >
                      <XIcon className="mr-1 size-4" />
                      Olib tashlash
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG/PNG/WEBP, maksimal 5MB.
                </p>
              </div>
            </Field>

            <Field>
              <FieldLabel className="font-semibold">{`Sarlavha (${currentLanguage.toUpperCase()})`}</FieldLabel>
              <Input
                value={formData.title}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    title: event.target.value,
                    translations: {
                      ...(current.translations || {}),
                      [currentLanguage]: event.target.value,
                    },
                  }))
                }
                placeholder="Masalan: 30 kunlik fitness marafon"
                className="rounded-xl"
              />
            </Field>

            <Field>
              <FieldLabel className="font-semibold">{`Ta'rif (${currentLanguage.toUpperCase()})`}</FieldLabel>
              <Input
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                    descriptionTranslations: {
                      ...(current.descriptionTranslations || {}),
                      [currentLanguage]: event.target.value,
                    },
                  }))
                }
                placeholder="Musobaqa haqida qisqacha ma'lumot"
                className="rounded-xl"
              />
            </Field>

            <Field>
              <FieldLabel className="font-semibold">Holati</FieldLabel>
              <ToggleGroup
                type="single"
                value={formData.status}
                onValueChange={(value) => {
                  if (value) setFormData((current) => ({ ...current, status: value }));
                }}
                className="w-full justify-start rounded-xl border p-1"
              >
                <ToggleGroupItem value="UPCOMING" className="flex-1 rounded-lg text-xs md:text-sm">Boshlanmagan</ToggleGroupItem>
                <ToggleGroupItem value="ACTIVE" className="flex-1 rounded-lg text-xs md:text-sm">Faol</ToggleGroupItem>
                <ToggleGroupItem value="COMPLETED" className="flex-1 rounded-lg text-xs md:text-sm">Yakunlangan</ToggleGroupItem>
                <ToggleGroupItem value="CANCELLED" className="flex-1 rounded-lg text-xs md:text-sm">Bekor qilingan</ToggleGroupItem>
              </ToggleGroup>
            </Field>
          </div>
        </div>
      </DrawerBody>

      <DrawerFooter className="mt-5">
        <Button onClick={onNext} className="gap-2">
          Keyingisi
        </Button>
      </DrawerFooter>
    </>
  );
};

export default BasicStep;
