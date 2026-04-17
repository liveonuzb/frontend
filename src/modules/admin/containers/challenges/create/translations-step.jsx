import React from "react";
import { fromPairs } from "lodash";
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer";

const resolveLocalizedText = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = String(translations?.[language] ?? "").trim();
    if (direct) return direct;

    const uzText = String(translations?.uz ?? "").trim();
    if (uzText) return uzText;
  }

  return String(fallback ?? "").trim();
};

const TranslationsStep = ({
  formData,
  setFormData,
  activeLanguages,
  currentLanguage,
  currentLanguageMeta,
  onSubmit,
  onBack,
  isSubmitting,
  submitLabel = "Yaratish",
}) => {
  const translationTitles = React.useMemo(
    () =>
      fromPairs(
        activeLanguages.map((language) => [
          language.code,
          resolveLocalizedText(
            formData.translations,
            formData.title ?? "",
            language.code,
          ),
        ]),
      ),
    [activeLanguages, formData.translations, formData.title],
  );

  const translationDescriptions = React.useMemo(
    () =>
      fromPairs(
        activeLanguages.map((language) => [
          language.code,
          resolveLocalizedText(
            formData.descriptionTranslations,
            formData.description ?? "",
            language.code,
          ),
        ]),
      ),
    [activeLanguages, formData.descriptionTranslations, formData.description],
  );

  const handleTitleChange = React.useCallback(
    (code, value) => {
      setFormData((current) => ({
        ...current,
        translations: {
          ...(current.translations || {}),
          [code]: value,
        },
        ...(code === currentLanguage ? { title: value } : {}),
      }));
    },
    [currentLanguage, setFormData],
  );

  const handleDescriptionChange = React.useCallback(
    (code, value) => {
      setFormData((current) => ({
        ...current,
        descriptionTranslations: {
          ...(current.descriptionTranslations || {}),
          [code]: value,
        },
        ...(code === currentLanguage ? { description: value } : {}),
      }));
    },
    [currentLanguage, setFormData],
  );

  return (
    <>
      <DrawerBody className="flex flex-col gap-6 py-6">
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">
            Joriy til:{" "}
            {currentLanguageMeta?.flag ? `${currentLanguageMeta.flag} ` : ""}
            {currentLanguageMeta?.name ?? currentLanguage.toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sarlavha va ta'rif alohida saqlanadi.
          </p>
        </div>

        {activeLanguages.map((language) => (
          <div
            key={language.code}
            className="space-y-3 rounded-2xl border border-border/60 bg-muted/15 p-4"
          >
            <p className="text-sm font-medium">
              <span className="mr-2">{language.flag || "Lang"}</span>
              {language.name} ({language.code})
            </p>
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">
                Sarlavha
              </FieldLabel>
              <Input
                value={translationTitles[language.code] ?? ""}
                onChange={(event) =>
                  handleTitleChange(language.code, event.target.value)
                }
                placeholder={`${language.name} tilida sarlavha`}
                className="rounded-xl"
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-semibold text-muted-foreground">
                Ta'rif
              </FieldLabel>
              <Input
                value={translationDescriptions[language.code] ?? ""}
                onChange={(event) =>
                  handleDescriptionChange(language.code, event.target.value)
                }
                placeholder={`${language.name} tilida ta'rif`}
                className="rounded-xl"
              />
            </Field>
          </div>
        ))}

        {!activeLanguages.length ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground text-center">
            Aktiv tillar topilmadi.
          </div>
        ) : null}
      </DrawerBody>

      <DrawerFooter className="mt-5">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <CheckCircle2Icon className="size-4" />
          )}
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          Ortga
        </Button>
      </DrawerFooter>
    </>
  );
};

export default TranslationsStep;
