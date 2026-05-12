import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";
import { first } from "lodash";
import { MoonIcon, PaletteIcon, SunIcon } from "lucide-react";
import LanguageDrawerPicker from "@/components/language-drawer-picker";
import ProductPreviewSlider, {
  buildLiveOnProductPreviewCopy,
} from "@/components/liveon-product-preview";
import ModeDrawer from "@/components/mode-drawer";
import { MODE_OPTIONS } from "@/components/mode-options";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";
import useAppLanguages from "@/hooks/app/use-app-languages";
import { applyTheme } from "@/lib/user-preferences";
import {
  AuthMobileKeyboardProvider,
  useMobileKeyboardOpen,
} from "@/modules/auth/lib/mobile-keyboard";
import { useAppModeStore, useLanguageStore } from "@/store";
import { cn } from "@/lib/utils";

const authControlButtonClassName =
  "flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[rgb(var(--accent-rgb)/0.24)] bg-white/78 text-slate-950 shadow-[0_16px_34px_rgba(15,23,42,0.10)] backdrop-blur-xl transition hover:border-[rgb(var(--accent-rgb)/0.42)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:border-white/12 dark:bg-white/[0.08] dark:text-white dark:shadow-[0_16px_34px_rgba(0,0,0,0.24)] dark:hover:border-white/20 dark:hover:bg-white/[0.12]";

const Index = () => {
  const { t } = useTranslation();
  const keyboardOpen = useMobileKeyboardOpen();
  const mode = useAppModeStore((state) => state.mode);
  const modeTheme = useAppModeTheme();
  const activeMode =
    MODE_OPTIONS.find((option) => option.value === mode) ?? MODE_OPTIONS[0];

  const copy = {
    logoAlt: t("auth.layout.logoAlt"),
    languageTitle: t("auth.layout.languageTitle"),
    languageDescription: t("auth.layout.languageDescription"),
    languageAriaLabel: t("auth.layout.languageAriaLabel"),
    panelBadge: t("auth.layout.panelBadge"),
    heroTitle: t("auth.layout.heroTitle"),
    heroDescription: t("auth.layout.heroDescription"),
    welcomeTitle: t("auth.layout.welcomeTitle"),
    welcomeDescription: t("auth.layout.welcomeDescription"),
    panelCopyright: t("auth.layout.panelCopyright"),
    preview: buildLiveOnProductPreviewCopy(t, "auth.layout"),
  };

  return (
    <AuthMobileKeyboardProvider value={keyboardOpen}>
      <div className="relative min-h-svh overflow-x-hidden bg-[#fff7ed] text-slate-950 dark:bg-[#070503] dark:text-white xl:h-svh xl:overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_4%,rgba(var(--accent-rgb),0.18),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(var(--accent-strong-rgb),0.12),transparent_28%),linear-gradient(145deg,rgba(255,247,237,0.98)_0%,rgba(255,255,255,0.94)_48%,rgba(255,237,213,0.84)_100%)] dark:bg-[radial-gradient(circle_at_18%_4%,rgba(var(--accent-rgb),0.26),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(var(--accent-strong-rgb),0.18),transparent_28%),linear-gradient(145deg,#090604_0%,#070503_50%,#050302_100%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(124,45,18,0.08),rgba(124,45,18,0))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))] lg:hidden"
          aria-hidden="true"
        />

        <div className="relative grid min-h-svh xl:h-svh xl:grid-cols-[minmax(380px,420px)_1fr]">
          <section className="relative z-10 flex min-h-svh flex-col overflow-hidden border-r border-[rgb(var(--accent-rgb)/0.16)] bg-[#fff8ec] dark:border-white/10 dark:bg-slate-950 xl:h-svh">
            <AuthBackgroundArt modeTheme={modeTheme} />
            <AuthBrandHeader
              activeMode={activeMode}
              copy={copy}
              modeTheme={modeTheme}
            />
            <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-8 sm:px-7 sm:py-10 xl:px-6">
              <div className="mx-auto flex w-full max-w-[430px] flex-col gap-10">
                <AuthWelcomeCopy copy={copy} />
                <Outlet />
              </div>
            </main>
          </section>

          <AuthProductPanel activeMode={activeMode} copy={copy} />
        </div>
      </div>
    </AuthMobileKeyboardProvider>
  );
};

function AuthBackgroundArt({ modeTheme }) {
  const lightBackground = modeTheme.assets.authBackgroundLight;
  const darkBackground = modeTheme.assets.authBackgroundDark;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src={lightBackground}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-100 transition-opacity duration-300 dark:opacity-0"
      />
      <img
        src={darkBackground}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 dark:opacity-100"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.02)_36%,rgba(255,255,255,0.12)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.08)_46%,rgba(2,6,23,0.32)_100%)]" />
    </div>
  );
}

function AuthBrandHeader({ activeMode, copy, modeTheme }) {
  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between px-5 py-4 sm:px-7 xl:px-6 xl:py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-3 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        aria-label={copy.logoAlt}
      >
        <img
          loading="lazy"
          src={modeTheme.assets.logo}
          className="size-11 object-contain"
          alt={copy.logoAlt}
        />
        <span className="text-lg font-black text-slate-950 dark:text-white">
          LiveOn
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <AuthThemeButton />
        <AuthModeButton activeMode={activeMode} />
        <AuthLanguagePicker copy={copy} />
      </div>
    </header>
  );
}

function AuthWelcomeCopy({ copy }) {
  return (
    <div className="max-w-[22rem] text-left">
      <p className="text-base font-black text-[rgb(var(--accent-strong-rgb))] dark:text-[rgb(var(--accent-rgb))]">
        {copy.welcomeTitle}
      </p>
      <p className="mt-2 max-w-[18.5rem] text-sm font-medium leading-6 text-slate-700 dark:text-white/72">
        {copy.welcomeDescription}
      </p>
    </div>
  );
}

function AuthModeButton({ activeMode }) {
  const [open, setOpen] = React.useState(false);
  const ModeIcon = activeMode?.icon ?? PaletteIcon;

  return (
    <>
      <button
        type="button"
        className={authControlButtonClassName}
        aria-label="Mode tanlash"
        onClick={() => setOpen(true)}
      >
        <ModeIcon className="size-5" aria-hidden="true" />
      </button>
      <ModeDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

function AuthThemeButton() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const storedTheme = window.localStorage.getItem("theme");

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return "dark";
  });

  React.useEffect(() => {
    const handleThemeChange = (event) => {
      if (event.detail === "light" || event.detail === "dark") {
        setTheme(event.detail);
      }
    };

    window.addEventListener("app-theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("app-theme-change", handleThemeChange);
    };
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={authControlButtonClassName}
      aria-label={nextTheme === "dark" ? "Dark theme yoqish" : "Light theme yoqish"}
      onClick={() => applyTheme(nextTheme)}
    >
      {theme === "dark" ? (
        <SunIcon className="size-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}

function AuthLanguagePicker({ copy }) {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const setCurrentLanguage = useLanguageStore(
    (state) => state.setCurrentLanguage,
  );
  const { languages } = useAppLanguages();

  const activeLanguages = React.useMemo(
    () => languages.filter((language) => language.isActive !== false),
    [languages],
  );

  React.useEffect(() => {
    if (!activeLanguages.length) {
      return;
    }

    const hasCurrentLanguage = activeLanguages.some(
      (language) => language.code === currentLanguage,
    );

    if (!hasCurrentLanguage) {
      setCurrentLanguage(first(activeLanguages).code);
    }
  }, [activeLanguages, currentLanguage, setCurrentLanguage]);

  const resolvedLanguage =
    activeLanguages.find((language) => language.code === currentLanguage) ||
    first(activeLanguages);

  return (
    <LanguageDrawerPicker
      ariaLabel={copy.languageAriaLabel}
      className={cn(
        authControlButtonClassName,
        "text-base hover:text-slate-950 dark:hover:text-white",
      )}
      compact
      denseOptions
      description={copy.languageDescription}
      languages={activeLanguages}
      onValueChange={setCurrentLanguage}
      title={copy.languageTitle}
      value={resolvedLanguage?.code || currentLanguage}
    />
  );
}

function AuthProductPanel({ activeMode, copy }) {
  return (
    <aside className="relative isolate hidden h-full min-h-0 overflow-hidden bg-[#fff7ed] text-slate-950 dark:bg-slate-950 dark:text-white xl:flex">
      <img
        src="/madagascar/background.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-10 mix-blend-multiply dark:opacity-20 dark:mix-blend-normal"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,247,237,0.97)_0%,rgba(255,255,255,0.92)_48%,rgba(255,237,213,0.78)_100%)] dark:bg-[linear-gradient(120deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.92)_48%,rgba(15,23,42,0.72)_100%)]"
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-65",
          activeMode.pageTint,
        )}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full min-h-0 items-center justify-center px-8 py-8 xl:px-10 2xl:px-14">
        <ProductPreviewSlider preview={copy.preview} variant="auth" />
      </div>
    </aside>
  );
}

export default Index;
