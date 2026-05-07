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
  denseOptions = false,
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
        <div className={cn(denseOptions ? "space-y-1.5 px-4 pb-3" : "space-y-2 px-4 pb-4")}>
          {map(languages, (language) => {
            const isSelected = language.code === resolvedLanguage?.code;

            return (
              <motion.button
                key={language.id || language.code}
                type="button"
                onClick={() => handleSelect(language.code)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  denseOptions
                    ? "relative flex w-full items-center gap-3 rounded-2xl border bg-background/90 px-3 py-3 text-left transition-all md:px-4 md:py-3.5"
                    : "relative flex w-full items-center gap-4 rounded-[24px] border bg-background/90 px-4 py-4 text-left transition-all md:gap-5 md:rounded-3xl md:px-5 md:py-5",
                  isSelected
                    ? `bg-gradient-to-br ${modes[mode]}`
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center bg-background/80 shadow-sm",
                    denseOptions
                      ? "size-10 rounded-xl text-2xl"
                      : "size-12 rounded-2xl text-3xl md:size-14 md:text-4xl",
                  )}
                >
                  {language.flag || "🌐"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={cn("font-bold", denseOptions ? "text-sm md:text-base" : "text-base md:text-lg")}>
                    {language.label || language.name}
                  </p>
                  <p className={cn("text-muted-foreground", denseOptions ? "text-xs" : "text-xs md:text-sm")}>
                    {language.native || language.code.toUpperCase()}
                  </p>
                </div>

                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border-2",
                    denseOptions ? "size-5" : "size-6 md:size-7",
                    isSelected
                      ? `${language.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  {isSelected ? (
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-full",
                        denseOptions ? "size-3.5" : "size-4 md:size-5",
                        language.dotTone,
                      )}
                    >
                      <CheckIcon className={cn("text-white", denseOptions ? "size-2.5" : "size-3 md:size-3.5")} />
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
