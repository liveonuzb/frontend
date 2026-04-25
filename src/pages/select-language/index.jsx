import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router";
import { CheckIcon, ChevronRight, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguageStore, useAppModeStore } from "@/store";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";

const LANGUAGES = [
  {
    code: "uz",
    label: "O'zbekcha",
    native: "O'zbekcha",
    flag: "🇺🇿",
    accent: "from-emerald-500/18 via-teal-400/10 to-transparent",
    border: "border-emerald-500/25",
    dotTone: "bg-gradient-to-br from-emerald-500 to-teal-500",
    buttonTone:
      "from-emerald-500 to-teal-500 hover:from-emerald-500/90 hover:to-teal-500/90 text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)]",
  },
  {
    code: "en",
    label: "English",
    native: "English",
    flag: "🇺🇸",
    accent: "from-sky-500/18 via-indigo-400/10 to-transparent",
    border: "border-sky-500/25",
    dotTone: "bg-gradient-to-br from-sky-500 to-indigo-500",
    buttonTone:
      "from-sky-500 to-indigo-500 hover:from-sky-500/90 hover:to-indigo-500/90 text-white shadow-[0_18px_44px_rgba(59,130,246,0.24)]",
  },
  {
    code: "ru",
    label: "Русский",
    native: "Русский",
    flag: "🇷🇺",
    accent: "from-rose-500/18 via-orange-400/10 to-transparent",
    border: "border-rose-500/25",
    dotTone: "bg-gradient-to-br from-rose-500 to-orange-500",
    buttonTone:
      "from-rose-500 to-orange-500 hover:from-rose-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(244,63,94,0.24)]",
  },
];

const SelectLanguagePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentLanguage, currentLanguage, hasSelectedLanguage } =
    useLanguageStore();
  const { mode } = useAppModeStore();
  const modeTheme = useAppModeTheme();
  const [selected, setSelected] = useState(currentLanguage || "uz");

  const active = LANGUAGES.find((l) => l.code === selected) ?? LANGUAGES[0];
  const returnTo = location.state?.returnTo;
  // "Revisit" mode = user came here after already finishing the initial flow.
  const isRevisit = hasSelectedLanguage && Boolean(mode);

  const handleContinue = () => {
    setCurrentLanguage(selected);
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    if (!mode) {
      navigate("/auth/select-mode");
    } else {
      navigate("/auth");
    }
  };

  const handleClose = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="relative flex h-svh min-h-svh w-full flex-col overflow-hidden bg-background px-5 pb-6 pt-8 md:pt-12">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          key={`lang-wash-${active.code}`}
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-80",
            active.accent,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        />
        <motion.div
          key={`lang-aura-${active.code}`}
          className={cn(
            "absolute left-1/2 top-[6%] h-[32%] w-[82%] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl",
            active.accent,
          )}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
        />
      </div>

      {isRevisit ? (
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-border/70 bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground md:right-6 md:top-6"
          aria-label="Close"
        >
          <XIcon className="size-5" />
        </button>
      ) : null}

      <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-1 flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <img
            src={modeTheme.assets.logo}
            className="size-16 object-contain md:size-20"
            alt="Logo"
          />
          <h1 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">
            Choose your language
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground md:text-base">
            Tilni tanlang · Выберите язык
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:mt-10 md:gap-4">
          {LANGUAGES.map((lang) => {
            const isActive = selected === lang.code;
            return (
              <motion.button
                key={lang.code}
                type="button"
                onClick={() => setSelected(lang.code)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-4 rounded-[24px] border bg-background/90 px-4 py-4 text-left transition-all md:gap-5 md:rounded-3xl md:px-5 md:py-5",
                  isActive
                    ? `bg-gradient-to-br ${lang.accent} ${lang.border}`
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background/80 text-3xl shadow-sm md:size-14 md:text-4xl">
                  {lang.flag}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold md:text-lg">{lang.label}</p>
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {lang.native}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 md:size-7",
                    isActive
                      ? `${lang.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  {isActive ? (
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full md:size-5",
                        lang.dotTone,
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

        <Button
          type="button"
          size="lg"
          className={cn(
            "mt-6 h-12 w-full border-transparent bg-gradient-to-r transition-all",
            active.buttonTone,
          )}
          onClick={handleContinue}
        >
          Continue <ChevronRight />
        </Button>
      </div>
    </div>
  );
};

export default SelectLanguagePage;
