import React from "react";
import { useTranslation } from "react-i18next";
import { isEqual, filter } from "lodash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DrawerFooter } from "@/components/ui/drawer";
import LanguageDrawerPicker from "@/components/language-drawer-picker";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import useAppLanguages from "@/hooks/app/use-app-languages";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import { useLanguageStore } from "@/store";

const FALLBACK_LANGUAGES = [
  { code: "uz", name: "O'zbek tili", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

const createInitialForm = (settings) => ({
  language: settings.language || "uz",
});
const GeneralTabContent = ({
  activeLanguages,
  form,
  isDirty,
  isSavingGeneral,
  embedded,
  initialForm,
  setForm,
  handleSave,
  t,
}) => (
  <Card className="py-6">
    <CardHeader className="pb-2">
      <CardTitle className="text-xl font-semibold">{t("profile.tabs.general")}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6 p-6">
      <FieldGroup>
        <Field>
          <LanguageDrawerPicker
            className="w-full"
            description={t("profile.language.description")}
            languages={activeLanguages}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, language: value }))
            }
            title={t("profile.language.title")}
            value={form.language}
          />
          <FieldDescription>
            {t("profile.language.hint")}
          </FieldDescription>
        </Field>
      </FieldGroup>

      {!embedded ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            disabled={!isDirty || isSavingGeneral}
            onClick={handleSave}
          >
            {isSavingGeneral ? t("profile.general.saving") : t("profile.general.save")}
          </Button>
        </div>
      ) : null}
    </CardContent>
  </Card>
);

export const GeneralTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const setCurrentLanguage = useLanguageStore(
    (state) => state.setCurrentLanguage,
  );
  const { languages } = useAppLanguages();
  const { settings, saveGeneralSettings, isSavingGeneral } =
    useProfileSettings();
  const activeLanguages = React.useMemo(() => {
    const source = languages.length ? languages : FALLBACK_LANGUAGES;
    return filter(source, (language) => language.isActive !== false);
  }, [languages]);
  const initialForm = React.useMemo(
    () => createInitialForm(settings),
    [settings],
  );
  const [form, setForm] = React.useState(initialForm);

  React.useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const isDirty = !isEqual(form, initialForm);

  const handleSave = React.useCallback(async () => {
    try {
      await saveGeneralSettings(form);
      setCurrentLanguage(form.language);
      toast.success(t("profile.language.success"));
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, t("profile.language.error")),
      );
    }
  }, [form, saveGeneralSettings, setCurrentLanguage, t]);

  const content = (
    <GeneralTabContent
      activeLanguages={activeLanguages}
      embedded={embedded}
      form={form}
      handleSave={handleSave}
      initialForm={initialForm}
      isDirty={isDirty}
      isSavingGeneral={isSavingGeneral}
      setForm={setForm}
      t={t}
    />
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8 sm:px-6">
          {content}
        </div>
        <DrawerFooter>
          <Button
            type="button"
            disabled={!isDirty || isSavingGeneral}
            onClick={handleSave}
          >
            {isSavingGeneral ? t("profile.general.saving") : t("profile.general.save")}
          </Button>
        </DrawerFooter>
      </div>
    );
  }

  return content;
};
