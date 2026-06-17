import React from "react";
import get from "lodash/get";
import map from "lodash/map";
import toUpper from "lodash/toUpper";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const dietaryTagOptions = [
  { value: "halal", label: "Halal" },
  { value: "lactose-free", label: "Lactose free" },
  { value: "diabetic-friendly", label: "Diabetic friendly" },
  { value: "gluten-free", label: "Gluten free" },
];

const allergenTagOptions = [
  { value: "gluten", label: "Gluten" },
  { value: "lactose", label: "Lactose" },
  { value: "nuts", label: "Nuts" },
  { value: "seafood", label: "Seafood" },
];

const toggleArrayValue = (values = [], value, checked) =>
  checked
    ? Array.from(new Set([...values, value]))
    : values.filter((item) => item !== value);

const TagCheckboxGroup = ({ label, options, values = [], onChange }) => (
  <div className="flex flex-col gap-2 rounded-2xl border px-4 py-3">
    <Label>{label}</Label>
    <div className="flex flex-wrap gap-2">
      {map(options, (option) => {
        const checked = values.includes(option.value);
        return (
          <label
            key={option.value}
            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(nextChecked) =>
                onChange(toggleArrayValue(values, option.value, Boolean(nextChecked)))
              }
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  </div>
);

export const LocalizedCatalogDrawers = ({
  activeLanguages,
  currentLanguage,
  currentLanguageMeta,
  drawerOpen,
  editingItem,
  form,
  isCreating,
  isDrawerItemLoading,
  isUpdating,
  onCloseDrawer,
  onCloseTranslationsDrawer,
  onSubmitDrawer,
  onSubmitTranslations,
  setForm,
  setTranslationForm,
  singularLabel,
  showNutritionTagMapping,
  translationForm,
  translationsDrawerOpen,
}) => (
  <>
    <Drawer
      open={drawerOpen}
      onOpenChange={(open) => !open && onCloseDrawer()}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>
            {editingItem
              ? `${singularLabel}ni tahrirlash`
              : `Yangi ${singularLabel}`}
          </DrawerTitle>
          <DrawerDescription>
            Joriy til uchun asosiy ma'lumotlarni kiriting.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-4">
          {isDrawerItemLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl border px-4 py-3 text-sm">
                <p className="font-medium">
                  Joriy til:{" "}
                  {get(currentLanguageMeta, "flag")
                    ? `${get(currentLanguageMeta, "flag")} `
                    : ""}
                  {get(
                    currentLanguageMeta,
                    "name",
                    toUpper(currentLanguage),
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Qo'shimcha tarjimalar alohida drawerda boshqariladi.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Nomi ({toUpper(currentLanguage)})</Label>
                <Input
                  value={get(form, "name")}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: get(event, "target.value"),
                    }))
                  }
                  placeholder={`${singularLabel} nomini kiriting`}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                <div>
                  <Label>Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Faol bo'lsa workout formida ko'rinadi.
                  </p>
                </div>
                <Switch
                  checked={get(form, "isActive")}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isActive: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                <div>
                  <Label>Onboardingda ko'rsatish</Label>
                  <p className="text-xs text-muted-foreground">
                    Yoqilgan bo'lsa user onboarding ro'yxatida ko'rinadi.
                  </p>
                </div>
                <Switch
                  checked={get(form, "isOnboarding")}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isOnboarding: checked,
                    }))
                  }
                />
              </div>

              {showNutritionTagMapping ? (
                <>
                  <div className="rounded-2xl border px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {map(get(form, "dietaryTags", []), (tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      {map(get(form, "allergenTags", []), (tag) => (
                        <Badge key={tag} variant="destructive">
                          avoid {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Mapping meal plan compatibility va recipe filters uchun
                      ishlatiladi.
                    </p>
                  </div>
                  <TagCheckboxGroup
                    label="Dietary tags"
                    options={dietaryTagOptions}
                    values={get(form, "dietaryTags", [])}
                    onChange={(nextValues) =>
                      setForm((current) => ({
                        ...current,
                        dietaryTags: nextValues,
                      }))
                    }
                  />
                  <TagCheckboxGroup
                    label="Avoid allergen tags"
                    options={allergenTagOptions}
                    values={get(form, "allergenTags", [])}
                    onChange={(nextValues) =>
                      setForm((current) => ({
                        ...current,
                        allergenTags: nextValues,
                      }))
                    }
                  />
                </>
              ) : null}
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={() => void onSubmitDrawer()}
            disabled={isCreating || isUpdating || isDrawerItemLoading}
            className="gap-2"
          >
            {isCreating || isUpdating ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CheckCircle2Icon />
            )}
            Saqlash
          </Button>
          <Button variant="outline" onClick={onCloseDrawer}>
            Bekor qilish
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Drawer
      open={translationsDrawerOpen}
      onOpenChange={(open) => !open && onCloseTranslationsDrawer()}
      direction="bottom"
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Tarjimalarni boshqarish</DrawerTitle>
          <DrawerDescription>
            Har bir faol til uchun alohida tarjima kiriting.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-4">
          {isDrawerItemLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            map(activeLanguages, (language) => (
              <div key={get(language, "id")} className="flex flex-col gap-2">
                <Label>
                  {get(language, "flag")} {get(language, "name")}
                </Label>
                <Input
                  value={get(translationForm, get(language, "code"), "")}
                  onChange={(event) =>
                    setTranslationForm((current) => ({
                      ...current,
                      [language.code]: event.target.value,
                    }))
                  }
                  placeholder={`${language.name} tarjimasi`}
                />
              </div>
            ))
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={() => void onSubmitTranslations()}
            disabled={isUpdating || isDrawerItemLoading}
            className="gap-2"
          >
            {isUpdating ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CheckCircle2Icon />
            )}
            Tarjimalarni saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </>
);
