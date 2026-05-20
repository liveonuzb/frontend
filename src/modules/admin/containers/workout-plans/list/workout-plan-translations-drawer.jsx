import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner.jsx";

import { map, toUpper } from "lodash";

export function WorkoutPlanTranslationsDrawer({
  open,
  onOpenChange,
  activeLanguages,
  translationForm,
  setTranslationForm,
  isSaving,
  isLoading,
  onSave,
}) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("admin.workoutPlans.translations.title")}</DrawerTitle>
          <DrawerDescription>
            {t("admin.workoutPlans.translations.description")}
          </DrawerDescription>
        </DrawerHeader>

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center px-4 pb-4 sm:px-6">
            <Spinner className="size-8 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto px-4 pb-4 no-scrollbar sm:px-6">
            {map(activeLanguages, (language) => (
              <div
                key={language.code}
                className="space-y-3 rounded-2xl border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{language.flag || ""}</span>
                  <div>
                    <p className="font-medium">{language.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {toUpper(language.code)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("admin.workoutPlans.translations.name")}</Label>
                  <Input
                    value={translationForm.titles?.[language.code] || ""}
                    onChange={(event) =>
                      setTranslationForm((current) => ({
                        ...current,
                        titles: {
                          ...current.titles,
                          [language.code]: event.target.value,
                        },
                      }))
                    }
                    placeholder={t("admin.workoutPlans.translations.namePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("admin.workoutPlans.translations.planDescription")}</Label>
                  <Textarea
                    value={translationForm.descriptions?.[language.code] || ""}
                    onChange={(event) =>
                      setTranslationForm((current) => ({
                        ...current,
                        descriptions: {
                          ...current.descriptions,
                          [language.code]: event.target.value,
                        },
                      }))
                    }
                    placeholder={t("admin.workoutPlans.translations.descriptionPlaceholder")}
                    className="min-h-24"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <DrawerFooter>
          <Button onClick={onSave} disabled={isSaving || isLoading}>
            {t("admin.workoutPlans.translations.save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
