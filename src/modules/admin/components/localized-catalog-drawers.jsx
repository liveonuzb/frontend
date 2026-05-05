import React from "react";
import { get, map } from "lodash";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  translationForm,
  translationsDrawerOpen,
}) => (
  <>
    <Drawer
      open={drawerOpen}
      onOpenChange={(open) => !open && onCloseDrawer()}
      direction="bottom"
    >
      <DrawerContent>
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
                    currentLanguage.toUpperCase(),
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Qo'shimcha tarjimalar alohida drawerda boshqariladi.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Nomi ({currentLanguage.toUpperCase()})</Label>
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
      <DrawerContent>
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
