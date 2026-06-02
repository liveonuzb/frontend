import React from "react";
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-toggle";

const THEME_OPTIONS = [
  {
    value: "light",
    icon: SunIcon,
    titleKey: "profile.appearance.theme.light",
    descriptionKey: "profile.appearance.theme.lightDesc",
  },
  {
    value: "dark",
    icon: MoonIcon,
    titleKey: "profile.appearance.theme.dark",
    descriptionKey: "profile.appearance.theme.darkDesc",
  },
];

export default function ThemeDrawer({ open, onOpenChange }) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = React.useState(theme);

  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        setSelected(theme);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, theme],
  );

  const handleApply = React.useCallback(() => {
    setTheme(selected);
    onOpenChange(false);
  }, [onOpenChange, selected, setTheme]);

  return (
    <Drawer direction="bottom" open={open} onOpenChange={handleOpenChange}>
      <DrawerContent
        data-theme-drawer="true"
        className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
      >
        <div className="px-5 pb-1 pt-4 text-center">
          <p className="text-base font-bold">
            {t("profile.appearance.drawerTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("profile.appearance.drawerDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-4 pt-3">
          {THEME_OPTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = selected === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelected(item.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[18px] border bg-background/90 px-3.5 py-3 text-left transition-all",
                  isActive
                    ? "border-primary/70 bg-primary/5"
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">
                    {t(item.titleKey)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(item.descriptionKey)}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                    isActive ? "border-primary" : "border-muted-foreground/25",
                  )}
                >
                  {isActive ? <CheckIcon className="size-3 text-primary" /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={handleApply}
            className="h-11 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.apply", "Apply")}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
