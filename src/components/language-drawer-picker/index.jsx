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
import { motion } from "framer-motion";
import { useAppModeStore } from "@/store/index.js";
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
  const { mode } = useAppModeStore();

  const resolvedLanguage =
    find(languages, (language) => language.code === value) || languages[0];

  const handleSelect = React.useCallback(
    (languageCode) => {
      onValueChange?.(languageCode);
      setOpen(false);
    },
    [onValueChange],
  );

  const modes = {
    madagascar: "from-amber-500/18 via-orange-400/10 to-transparent",
    zen: "from-teal-500/15 via-green-400/8 to-transparent",
    focus: "from-slate-500/16 via-zinc-400/9 to-transparent",
  };

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
              <motion.button
                key={language.id || language.code}
                type="button"
                onClick={() => handleSelect(language.code)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex w-full items-center gap-4 rounded-[24px] border bg-background/90 px-4 py-4 text-left transition-all md:gap-5 md:rounded-3xl md:px-5 md:py-5",
                  isSelected
                    ? `bg-gradient-to-br ${modes[mode]}`
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background/80 text-3xl shadow-sm md:size-14 md:text-4xl">
                  {language.flag || "🌐"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold md:text-lg">
                    {language.label || language.name}
                  </p>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {language.native || language.code.toUpperCase()}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 md:size-7",
                    isSelected
                      ? `${language.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  {isSelected ? (
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full md:size-5",
                        language.dotTone,
                      )}
                    >
                      <CheckIcon className="size-3 text-white md:size-3.5" />
                    </div>
                  ) : null}
                </div>
              </motion.button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LanguageDrawerPicker;
