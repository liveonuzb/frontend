import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";
import { first } from "lodash";
import LanguageDrawerPicker from "@/components/language-drawer-picker";
import ProductPreviewSlider, {
  buildLiveOnProductPreviewCopy,
} from "@/components/liveon-product-preview";
import useAppLanguages from "@/hooks/app/use-app-languages";
import {
  AuthMobileKeyboardProvider,
  useMobileKeyboardOpen,
} from "@/modules/auth/lib/mobile-keyboard";
import { useLanguageStore } from "@/store";

const LOGO_SRC = "/madagascar/logo-main.webp";

const Index = () => {
  const { t } = useTranslation();
  const keyboardOpen = useMobileKeyboardOpen();

  const copy = {
    logoAlt: t("auth.layout.logoAlt"),
    languageTitle: t("auth.layout.languageTitle"),
    languageDescription: t("auth.layout.languageDescription"),
    languageAriaLabel: t("auth.layout.languageAriaLabel"),
    panelBadge: t("auth.layout.panelBadge"),
    heroTitle: t("auth.layout.heroTitle"),
    heroDescription: t("auth.layout.heroDescription"),
    panelCopyright: t("auth.layout.panelCopyright"),
    preview: buildLiveOnProductPreviewCopy(t, "auth.layout"),
  };

  return (
    <AuthMobileKeyboardProvider value={keyboardOpen}>
      <div className="relative min-h-svh overflow-x-hidden bg-[#f8f3ea] text-slate-950 xl:h-svh xl:overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(248,243,234,0.98)_0%,rgba(255,255,255,0.94)_46%,rgba(255,237,213,0.76)_100%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0))] lg:hidden"
          aria-hidden="true"
        />

        <div className="relative grid min-h-svh xl:h-svh xl:grid-cols-[minmax(380px,420px)_1fr]">
          <section className="relative z-10 flex min-h-svh flex-col xl:h-svh">
            <AuthBrandHeader copy={copy} />
            <main className="flex min-h-0 flex-1 items-center justify-center px-5 pb-8 pt-2 sm:px-7 xl:px-6">
              <Outlet />
            </main>
          </section>

          <AuthProductPanel copy={copy} />
        </div>
      </div>
    </AuthMobileKeyboardProvider>
  );
};

function AuthBrandHeader({ copy }) {
  return (
    <header className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-7 xl:px-6 xl:py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-3 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f8f3ea]"
        aria-label={copy.logoAlt}
      >
        <img
          loading="lazy"
          src={LOGO_SRC}
          className="size-11 object-contain"
          alt={copy.logoAlt}
        />
        <span className="text-lg font-black text-slate-950">LiveOn</span>
      </Link>

      <AuthLanguagePicker copy={copy} />
    </header>
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
      className="size-11 rounded-2xl border border-slate-200/80 bg-white/80 text-base shadow-sm hover:bg-white hover:text-slate-950 focus-visible:ring-orange-400"
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

function AuthProductPanel({ copy }) {
  return (
    <aside className="relative isolate hidden h-full min-h-0 overflow-hidden bg-slate-950 text-white xl:flex">
      <img
        src="/madagascar/background.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-20"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.92)_48%,rgba(15,23,42,0.72)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(249,115,22,0.14)_0%,rgba(20,184,166,0.08)_42%,rgba(2,6,23,0.18)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full min-h-0 items-center justify-center px-8 py-8 xl:px-10 2xl:px-14">
        <ProductPreviewSlider preview={copy.preview} variant="auth" />
      </div>
    </aside>
  );
}

export default Index;
