import React from "react";
import { get, map as lodashMap, trim, pickBy } from "lodash";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = trim(String(get(translations, language, "")));
    if (direct) return direct;
    const uz = trim(String(get(translations, "uz", "")));
    if (uz) return uz;
  }
  return fallback;
};

const FoodTranslationsDrawer = ({
  open,
  onOpenChange,
  translatingFood,
  translationForm,
  setTranslationForm,
  activeLanguages,
  currentLanguage,
  currentLanguageMeta,
  isUpdating,
  onSave,
}) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle>Tarjimalarni boshqarish</DrawerTitle>
          <DrawerDescription>
            Barcha faol tillar shu yerdan tahrirlanadi. Istasangiz joriy locale
            nomini ham shu drawerda yangilashingiz mumkin.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-6 py-4 space-y-5 overflow-y-auto max-h-[60vh] no-scrollbar">
          {/* Food name badge */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium">
              {translatingFood
                ? resolveLabel(
                    translatingFood.translations,
                    translatingFood.name,
                    currentLanguage,
                  )
                : "Ovqat"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Joriy til:{" "}
              {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
              {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()}. Shu
              til qiymati saqlansa, asosiy nom ham yangilanadi.
            </p>
          </div>

          {/* Language fields */}
          {activeLanguages.length > 0 ? (
            <div className="space-y-4">
              {lodashMap(activeLanguages, (language) => (
                <div key={language.id} className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <span>{language.flag}</span>
                    {language.name}
                    {language.code === currentLanguage ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Asosiy
                      </span>
                    ) : null}
                  </Label>
                  <Input
                    value={translationForm[language.code] || ""}
                    onChange={(e) =>
                      setTranslationForm((cur) => ({
                        ...cur,
                        [language.code]: e.target.value,
                      }))
                    }
                    placeholder={`${language.name} tilidagi tarjima`}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <DrawerFooter className="border-t bg-muted/5 gap-2 px-6 py-4">
          <Button
            onClick={onSave}
            disabled={isUpdating || !activeLanguages.length}
          >
            Tarjimalarni saqlash
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Bekor qilish</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FoodTranslationsDrawer;
