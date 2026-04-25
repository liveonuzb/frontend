import React from "react";
import { find, map } from "lodash";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const LanguageDrawerPicker = ({
  value,
  onValueChange,
  languages = [],
  className,
  compact = false,
  title = "Til tanlash",
  description = "Ilova uchun faol tilni tanlang.",
  ariaLabel = "Til tanlash",
}) => {
  const [open, setOpen] = React.useState(false);

  const resolvedLanguage =
    find(languages, (language) => language.code === value) || languages[0];

  const handleSelect = React.useCallback(
    (languageCode) => {
      onValueChange?.(languageCode);
      setOpen(false);
    },
    [onValueChange],
  );

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <Button
        type="button"
        variant={"ghost"}
        className={cn(
          compact
            ? "size-11 shrink-0 p-0"
            : "justify-start gap-2 bg-background/80 supports-[backdrop-filter]:bg-background/70 w-[148px]",
          className,
        )}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        {resolvedLanguage?.flag ? (
          <span className="text-sm leading-none">{resolvedLanguage.flag}</span>
        ) : (
          <LanguagesIcon className="size-4 text-muted-foreground" />
        )}
        {compact ? (
          <span className="sr-only">{resolvedLanguage?.name || "Til"}</span>
        ) : null}
        {!compact ? (
          <span className="truncate">{resolvedLanguage?.name || "Til"}</span>
        ) : null}
      </Button>

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-2 px-4 pb-4">
          {map(languages, (language) => {
            const isSelected = language.code === resolvedLanguage?.code;

            return (
              <button
                key={language.id || language.code}
                type="button"
                className="block w-full text-left"
                onClick={() => handleSelect(language.code)}
              >
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl border p-4",
                    isSelected && "border-primary",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-base leading-none">
                      {language.flag || "🌐"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{language.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {language.code.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckIcon className="size-4 text-primary" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LanguageDrawerPicker;
