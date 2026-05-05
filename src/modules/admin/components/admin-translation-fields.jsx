import React from "react";
import { get } from "lodash";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DEFAULT_FIELDS = [
  {
    key: "name",
    label: "Nomi",
    placeholder: (language) => `${get(language, "name", "Til")} tilida nom`,
  },
];

export function AdminTranslationFields({
  control,
  languages = [],
  currentLanguage,
  fields = DEFAULT_FIELDS,
  getFieldName = (code, field) => `${code}.${field.key}`,
  emptyText = "Faol til topilmadi.",
  className,
}) {
  if (!languages.length) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {languages.map((language) => {
        const code = get(language, "code");
        const isCurrent = currentLanguage && code === currentLanguage;

        return (
          <section key={code} className="space-y-3 rounded-xl border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{get(language, "flag", "Lang")}</span>
              <span>{get(language, "name", code)}</span>
              {isCurrent ? (
                <span className="text-xs text-muted-foreground">Asosiy</span>
              ) : null}
            </div>

            {fields.map((fieldConfig) => {
              const fieldName = getFieldName(code, fieldConfig);
              const label =
                typeof fieldConfig.label === "function"
                  ? fieldConfig.label(language)
                  : fieldConfig.label;
              const placeholder =
                typeof fieldConfig.placeholder === "function"
                  ? fieldConfig.placeholder(language)
                  : fieldConfig.placeholder;
              const isTextarea = fieldConfig.type === "textarea";
              const FieldComponent = isTextarea ? Textarea : Input;

              return (
                <FormField
                  key={`${code}-${fieldConfig.key}`}
                  control={control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <FieldComponent
                          {...field}
                          value={field.value || ""}
                          placeholder={placeholder}
                          className={cn(
                            isTextarea && "min-h-20",
                            fieldConfig.className,
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
