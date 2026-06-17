import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LazyMotion, domAnimation, useReducedMotion } from "framer-motion";
import { applyTheme, resolveTheme } from "@/lib/user-preferences";
import { trackLaunchEvent } from "@/lib/analytics.js";
import { getAppModeTheme } from "@/lib/app-mode-theme.js";
import { getPostAuthRoute } from "@/modules/auth/lib/auth-utils.js";
import {
  APP_MODES,
  useAppModeStore,
  useAuthStore,
  useLanguageStore,
} from "@/store";
import {
  LANDING_CANONICAL_URL,
  LANDING_OG_IMAGE,
  createLandingSchemas,
  normalizeLanguage,
  setJsonLdScript,
  setLinkTag,
  setMetaTag,
  useLandingContent,
} from "@/modules/landing/pages/landing/content.js";
import {
  FAQSection,
  Footer,
  Header,
  HeroSection,
  PricingSection,
  ProofStrip,
  ScenariosSection,
  StickyMobileCTA,
} from "@/modules/landing/pages/landing/sections.jsx";
import ProductModulesSection from "@/modules/landing/pages/landing/module-cards.jsx";
import ProductTour from "@/modules/landing/pages/landing/product-tour.jsx";

const trackLandingEvent = (event, payload = {}) => {
  if (typeof window === "undefined") return;
  void trackLaunchEvent(event, {
    source: "landing",
    properties: payload,
  });
  window.dispatchEvent(
    new CustomEvent("liveon:analytics", {
      detail: { event, payload, source: "landing" },
    }),
  );
  window.dataLayer?.push({ event, ...payload });
};

const useLandingTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return resolveTheme(window.localStorage.getItem("theme") || "light");
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const storedTheme = resolveTheme(
      window.localStorage.getItem("theme") || "light",
    );
    document.documentElement.classList.toggle("dark", storedTheme === "dark");

    const handleThemeChange = (event) => {
      setTheme(resolveTheme(event.detail));
    };
    window.addEventListener("app-theme-change", handleThemeChange);
    return () =>
      window.removeEventListener("app-theme-change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    trackLandingEvent("theme_changed", { theme: nextTheme });
  };

  return { theme, toggleTheme };
};

const LandingPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { currentLanguage, hasSelectedLanguage, setCurrentLanguage } =
    useLanguageStore();
  const mode = useAppModeStore((state) => state.mode);
  const { isAuthenticated, user } = useAuthStore();
  const language = hasSelectedLanguage
    ? normalizeLanguage(currentLanguage)
    : "ru";
  const { copy, meta } = useLandingContent(language);
  const { theme, toggleTheme } = useLandingTheme();
  const activeMode = mode || APP_MODES.FOCUS;
  const modeTheme = useMemo(() => getAppModeTheme(activeMode), [activeMode]);
  const structuredData = useMemo(
    () => createLandingSchemas(copy, language),
    [copy, language],
  );

  useEffect(() => {
    if (!hasSelectedLanguage) setCurrentLanguage("ru");
  }, [hasSelectedLanguage, setCurrentLanguage]);

  useEffect(() => {
    const title = meta.title ?? "LiveOn";
    const description = meta.description ?? "";

    document.documentElement.lang = language;
    document.title = title;
    setLinkTag("canonical", LANDING_CANONICAL_URL);
    setMetaTag('meta[name="description"]', description);
    setMetaTag('meta[property="og:type"]', "website");
    setMetaTag('meta[property="og:url"]', LANDING_CANONICAL_URL);
    setMetaTag('meta[property="og:title"]', title);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[property="og:image"]', LANDING_OG_IMAGE);
    setMetaTag('meta[name="twitter:card"]', "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', title);
    setMetaTag('meta[name="twitter:description"]', description);
    setMetaTag('meta[name="twitter:image"]', LANDING_OG_IMAGE);
  }, [language, meta.description, meta.title]);

  useEffect(() => {
    setJsonLdScript("main", structuredData);
  }, [structuredData]);

  const setLandingLanguage = (nextLanguage) => {
    setCurrentLanguage(nextLanguage);
    trackLandingEvent("language_changed", { language: nextLanguage });
  };

  const startOnboarding = (eventName = "landing_cta_clicked") => {
    trackLandingEvent(eventName, { language });
    if (!hasSelectedLanguage) setCurrentLanguage(language);
    if (isAuthenticated) {
      navigate(getPostAuthRoute(user));
      return;
    }
    if (!mode) {
      navigate("/auth/select-mode", { state: { returnTo: "/auth/sign-up" } });
      return;
    }
    trackLandingEvent("onboarding_started", { source: "landing" });
    navigate("/auth/sign-up");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const showPlanExample = () => {
    trackLandingEvent("example_plan_clicked", { language });
    scrollToSection("nutrition");
  };

  return (
    <LazyMotion features={domAnimation}>
      <Header
        copy={copy}
        mode={activeMode}
        modeTheme={modeTheme}
        language={language}
        onLanguageChange={setLandingLanguage}
        onStart={startOnboarding}
        onAnchor={scrollToSection}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <HeroSection
        copy={copy}
        modeTheme={modeTheme}
        onStart={() => startOnboarding("hero_cta_clicked")}
        onExample={showPlanExample}
      />
      <ProofStrip items={copy.values} />
      <ProductTour copy={copy.productTour} />
      <ProductModulesSection copy={copy.productModules} />
      <ScenariosSection copy={copy.scenarios} />
      <PricingSection copy={copy.pricing} onStart={startOnboarding} />
      <FAQSection
        copy={copy.faq}
        onQuestionOpen={(question) =>
          trackLandingEvent("faq_opened", { question })
        }
      />
      <Footer copy={copy.footer} modeTheme={modeTheme} />
      <StickyMobileCTA
        copy={copy.nav}
        onStart={() => startOnboarding("sticky_mobile_cta_clicked")}
      />
    </LazyMotion>
  );
};

export default LandingPage;
