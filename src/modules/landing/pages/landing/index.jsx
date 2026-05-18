/* eslint-disable react-refresh/only-export-components */
import {
  useEffect,
  useMemo,
  useState
} from "react";
import { Link, useNavigate } from "react-router";
import {
  ActivityIcon,
  ArrowRightIcon,
  BadgeCheckIcon,
  BarChart3Icon,
  BellIcon,
  BotIcon,
  BrainIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClipboardListIcon,
  Clock3Icon,
  DropletsIcon,
  DumbbellIcon,
  FileTextIcon,
  FlameIcon,
  HeartPulseIcon,
  LinkIcon,
  LineChartIcon,
  MenuIcon,
  MessageCircleIcon,
  MoonIcon,
  Repeat2Icon,
  SaladIcon,
  ScaleIcon,
  SendIcon,
  ShieldCheckIcon,
  ShoppingBasketIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TargetIcon,
  TrendingDownIcon,
  TrophyIcon,
  UtensilsIcon,
  UserCheckIcon,
  UsersIcon,
  WalletCardsIcon,
  XIcon,
  ZapIcon
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import LanguageDrawerPicker from "@/components/language-drawer-picker";
import ProductPreviewSlider, {
  buildLiveOnProductPreviewCopy
} from "@/components/liveon-product-preview";
import { cn } from "@/lib/utils";
import { applyTheme, resolveTheme } from "@/lib/user-preferences";
import { getPostAuthRoute } from "@/modules/auth/lib/auth-utils.js";
import { useAppModeStore, useAuthStore, useLanguageStore } from "@/store";
import { isArray, map, toLower } from "lodash";
const LANGUAGES = [
  {
    code: "ru",
    label: "Русский",
    name: "Русский",
    native: "RU",
    flag: "🇷🇺",
    border: "border-blue-500/60",
    dotTone: "bg-blue-500"
  },
  {
    code: "uz",
    label: "O'zbekcha",
    name: "O'zbekcha",
    native: "UZ",
    flag: "🇺🇿",
    border: "border-emerald-500/60",
    dotTone: "bg-emerald-500"
  },
  {
    code: "en",
    label: "English",
    name: "English",
    native: "EN",
    flag: "🇺🇸",
    border: "border-orange-500/60",
    dotTone: "bg-orange-500"
  }
];
const normalizeLanguage = (language) => {
  if (language?.startsWith("uz")) return "uz";
  if (language?.startsWith("en")) return "en";
  return "ru";
};
const landingIconMap = {
  ActivityIcon,
  BarChart3Icon,
  BellIcon,
  BotIcon,
  BrainIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  Clock3Icon,
  DropletsIcon,
  DumbbellIcon,
  FlameIcon,
  HeartPulseIcon,
  LinkIcon,
  LineChartIcon,
  MessageCircleIcon,
  Repeat2Icon,
  ShieldCheckIcon,
  ShoppingBasketIcon,
  SparklesIcon,
  TargetIcon,
  TrendingDownIcon,
  TrophyIcon,
  UtensilsIcon,
  UserCheckIcon,
  UsersIcon,
  WalletCardsIcon,
  ZapIcon
};
const hydrateIconRows = (items = [], fallbackIcon = SparklesIcon) =>
  map(items, ([title, body, iconName, ...rest]) => [
    title,
    body,
    landingIconMap[iconName] ?? fallbackIcon,
    ...rest
  ]);
const hydrateMetricRows = (items = []) =>
  map(items, ([value, label, iconName, tone]) => [
    value,
    label,
    landingIconMap[iconName] ?? ActivityIcon,
    tone
  ]);
const hydrateLandingCopy = (copy = {}) => ({
  ...copy,
  values: hydrateIconRows(copy.values),
  how: {
    ...copy.how,
    steps: hydrateIconRows(copy.how?.steps)
  },
  daily: {
    ...copy.daily,
    features: hydrateIconRows(copy.daily?.features)
  },
  progress: {
    ...copy.progress,
    metrics: hydrateMetricRows(copy.progress?.metrics)
  },
  local: {
    ...copy.local,
    cards: hydrateIconRows(copy.local?.cards)
  }
});
const useLandingContent = (language) => {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const fixedT = i18n.getFixedT(language);
    const landing = fixedT("landing", { returnObjects: true });
    const landingCopy = landing && typeof landing === "object" ? landing : {};
    const { meta = {}, ...copy } = landingCopy;

    return {
      copy: {
        ...hydrateLandingCopy(copy),
        productPreview: buildLiveOnProductPreviewCopy(fixedT, "auth.layout")
      },
      meta
    };
  }, [i18n, language]);
};
const trackLandingEvent = (event, payload = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("liveon:analytics", {
      detail: { event, payload, source: "landing" }
    })
  );
  window.dataLayer?.push({ event, ...payload });
};
const statusTone = {
  yes: {
    icon: CheckCircle2Icon,
    className: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20"
  },
  partial: {
    icon: BadgeCheckIcon,
    className: "bg-blue-500/12 text-blue-700 ring-blue-500/20"
  },
  no: {
    icon: XIcon,
    className: "bg-slate-500/10 text-slate-500 ring-slate-500/15"
  }
};
const metricTone = {
  orange: "bg-orange-500/12 text-orange-700 ring-orange-500/20",
  green: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  teal: "bg-teal-500/12 text-teal-700 ring-teal-500/20",
  blue: "bg-blue-500/12 text-blue-700 ring-blue-500/20"
};
const darkMetricTone = {
  orange: "bg-orange-400/12 text-orange-100 ring-orange-300/20",
  green: "bg-emerald-400/12 text-emerald-100 ring-emerald-300/20",
  teal: "bg-teal-400/12 text-teal-100 ring-teal-300/20",
  blue: "bg-blue-400/12 text-blue-100 ring-blue-300/20"
};
const landingCardPaddingY = "py-6 md:py-7";
const compactCardPaddingY = "py-5 md:py-6";
const LANDING_ORIGIN = "https://liveon.uz";
const LANDING_CANONICAL_URL = `${LANDING_ORIGIN}/`;
const LANDING_OG_IMAGE = `${LANDING_ORIGIN}/madagascar/background.webp`;
const plainSectionClass = "bg-white dark:bg-[#070503]";
const warmSectionClass = "border-orange-900/10 bg-[#fff8ee] dark:border-white/10 dark:bg-[#120b05]";
const cardSurfaceClass = "border-slate-200/70 bg-white text-slate-950 shadow-[0_18px_54px_rgba(15,23,42,0.06)] ring-slate-950/8 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.28)] dark:ring-white/10";
const warmCardSurfaceClass = "border-orange-900/8 bg-white text-slate-950 shadow-[0_16px_48px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)]";
const strongTextClass = "text-slate-950 dark:text-white";
const bodyTextClass = "text-slate-700 dark:text-white/72";
const mutedTextClass = "text-slate-600 dark:text-white/62";
const iconSurfaceClass = "bg-orange-500/10 text-orange-700 dark:bg-orange-300/12 dark:text-orange-100 dark:ring-1 dark:ring-orange-300/20";
const SOCIAL_LINKS = [
  {
    label: "Telegram",
    href: "https://t.me/liveonappbot",
    icon: SendIcon
  }
];
const resolveFooterLink = (item) => {
  if (isArray(item)) {
    return {
      label: item[0],
      href: item[1] || "/"
    };
  }

  const normalized = toLower(String(item));
  const fallbackLinks = {
    faq: "#faq",
    help: "mailto:support@liveon.uz",
    yordam: "mailto:support@liveon.uz",
    помощь: "mailto:support@liveon.uz",
    pricing: "#pricing",
    тарифы: "#pricing",
    tariflar: "#pricing"
  };

  return {
    label: item,
    href: fallbackLinks[normalized] || "/"
  };
};
const setMetaTag = (selector, value) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    const nameMatch = selector.match(/name="([^"]+)"/);
    const propertyMatch = selector.match(/property="([^"]+)"/);
    if (nameMatch?.[1]) tag.setAttribute("name", nameMatch[1]);
    if (propertyMatch?.[1]) tag.setAttribute("property", propertyMatch[1]);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
};
const setLinkTag = (rel, href) => {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};
const setJsonLdScript = (id, value) => {
  const scriptId = `landing-jsonld-${id}`;
  let script = document.getElementById(scriptId);
  if (!script) {
    script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value);
};
const MotionSection = ({
  id,
  children,
  className
}) => {
  const shouldReduceMotion = useReducedMotion();
  return <motion.section
    id={id}
    className={cn("scroll-mt-32 md:scroll-mt-36", className)}
    initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
    whileInView={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.18 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  >
      {children}
    </motion.section>;
};
const CTAButton = ({
  children,
  onClick,
  variant = "primary",
  className,
  disabled = false
}) => <Button
  type="button"
  size="xl"
  variant={variant === "outline" ? "outline" : variant === "light" ? "secondary" : "default"}
  onClick={onClick}
  disabled={disabled}
  className={cn(
    "min-h-11 gap-2 px-5 text-sm font-semibold md:px-6",
    variant === "dark" && "bg-slate-950 text-white shadow-[0_18px_44px_rgba(15,23,42,0.18)] hover:bg-slate-900",
    variant === "light" && "bg-white text-slate-950 shadow-[0_18px_44px_rgba(255,255,255,0.08)] hover:bg-orange-50",
    variant === "outline" && "border-white/24 bg-white/8 text-white hover:bg-white/14 hover:text-white",
    disabled && "cursor-not-allowed opacity-70",
    className
  )}
>
    {children}
    <ArrowRightIcon data-icon="inline-end" />
  </Button>;
const SectionHeader = ({
  eyebrow,
  title,
  body,
  align = "left",
  inverse = false
}) => <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
    <Badge
  variant="outline"
  className={cn(
    "h-6 border-orange-500/25 bg-orange-500/10 uppercase tracking-[0.18em] text-orange-700",
    inverse && "border-orange-300/25 bg-orange-300/10 text-orange-100"
  )}
>
      {eyebrow}
    </Badge>
    <h2
  className={cn(
    "mt-4 text-3xl font-semibold leading-tight md:text-5xl",
    strongTextClass,
    inverse && "text-white"
  )}
>
      {title}
    </h2>
    {body ? <p
  className={cn(
    "mt-4 text-base leading-7 md:text-lg",
    mutedTextClass,
    inverse && "text-white/68"
  )}
>
        {body}
      </p> : null}
  </div>;
const useLandingTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return resolveTheme(window.localStorage.getItem("theme") || "light");
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    setTheme(resolveTheme(window.localStorage.getItem("theme") || "light"));
    const handleThemeChange = (event) => {
      setTheme(resolveTheme(event.detail));
    };
    window.addEventListener("app-theme-change", handleThemeChange);
    return () => window.removeEventListener("app-theme-change", handleThemeChange);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    trackLandingEvent("theme_changed", { theme: nextTheme });
  };

  return { theme, toggleTheme };
};
const LandingThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useLandingTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? SunIcon : MoonIcon;

  return <Button
    type="button"
    variant="outline"
    size="icon"
    aria-label={isDark ? "Light theme" : "Dark theme"}
    onClick={toggleTheme}
    className={cn(
      "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-white/14 dark:bg-white/8 dark:text-white dark:hover:bg-white/14",
      className
    )}
  >
      <Icon className="size-4" />
    </Button>;
};
const Header = ({
  copy,
  language,
  onLanguageChange,
  onStart,
  onAnchor
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigateTo = (id) => {
    setMenuOpen(false);
    onAnchor(id);
  };
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/88 px-4 py-2 text-slate-950 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82 dark:text-white dark:shadow-none md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
      to="/"
      className="inline-flex min-h-9 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      aria-label="LiveOn"
    >
            <img
      src="/madagascar/logo-main.webp"
      alt={copy.nav.logoAlt}
      className="size-8 object-contain"
      loading="eager"
    />
            <span className="text-base font-black">LiveOn</span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Landing navigation">
            {map(copy.nav.links, ([id, label]) => <button
      key={id}
      type="button"
      onClick={() => onAnchor(id)}
      className="min-h-8 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold leading-4 text-slate-600 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-orange-300 dark:text-white/68 dark:hover:bg-white/8 dark:hover:text-white"
    >
                {label}
              </button>)}
          </nav>

          <div className="flex items-center gap-1.5">
            <LandingThemeToggle className="hidden size-9 lg:inline-flex" />
            <LanguageSwitcher
      label={copy.nav.language}
      language={language}
      onLanguageChange={onLanguageChange}
      title={copy.nav.languageTitle}
      description={copy.nav.languageDescription}
    />
            <CTAButton
      onClick={() => onStart("header_cta_clicked")}
      className="hidden min-h-9 rounded-xl px-4 text-[13px] lg:inline-flex [&_[data-icon='inline-end']]:size-4"
    >
              {copy.nav.cta}
            </CTAButton>
            <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-9 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:border-white/18 dark:bg-white/8 dark:text-white dark:hover:bg-white/14 dark:hover:text-white xl:hidden"
      aria-label={menuOpen ? copy.nav.menuClose : copy.nav.menuOpen}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen((value) => !value)}
    >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </Button>
          </div>
        </div>

        {menuOpen ? <div className="mx-auto mt-3 max-w-7xl rounded-2xl border border-slate-200 bg-white/96 p-3 text-slate-950 shadow-[0_24px_80px_rgba(2,6,23,0.18)] dark:border-white/10 dark:bg-slate-900/96 dark:text-white dark:shadow-[0_24px_80px_rgba(2,6,23,0.38)] xl:hidden">
            <nav className="grid gap-1" aria-label="Mobile landing navigation">
              {map(copy.nav.links, ([id, label]) => <button
      key={id}
      type="button"
      onClick={() => navigateTo(id)}
      className="min-h-11 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-orange-300 dark:text-white/76 dark:hover:bg-white/8 dark:hover:text-white"
    >
                  {label}
                </button>)}
            </nav>
            <div className="mt-3 grid gap-2">
              <LandingThemeToggle className="h-9 w-full justify-center" />
              <CTAButton onClick={() => onStart("mobile_menu_cta_clicked")} className="w-full">
                {copy.nav.cta}
              </CTAButton>
            </div>
          </div> : null}
      </header>
  );
};
const LanguageSwitcher = ({
  label,
  language,
  onLanguageChange,
  title,
  description
}) => <div className="flex items-center">
    <LanguageDrawerPicker
  ariaLabel={label}
  className="size-9 text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-white dark:hover:bg-white/14 dark:hover:text-white"
  compact
  denseOptions
  description={description}
  languages={LANGUAGES}
  onValueChange={onLanguageChange}
  title={title}
  value={language}
/>
  </div>;
const HeroSection = ({
  copy,
  productPreview,
  onStart,
  onExample
}) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 pt-20 text-white">
        <div
      className="absolute inset-0 bg-cover bg-center opacity-34"
      style={{ backgroundImage: "url('/madagascar/background.webp')" }}
      aria-hidden="true"
    />
        <div
      className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(249,115,22,0.28),transparent_30%),radial-gradient(circle_at_20%_75%,rgba(20,184,166,0.16),transparent_28%),linear-gradient(90deg,rgba(2,6,23,0.98),rgba(2,6,23,0.9)_44%,rgba(2,6,23,0.76))]"
      aria-hidden="true"
    />
        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-80px)] max-w-7xl gap-10 px-5 py-12 md:grid-cols-[0.92fr_1.08fr] md:items-center md:px-8 md:py-16">
          <motion.div
      className="max-w-3xl"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
      animate={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
            <p className="text-2xl font-black md:text-3xl">LiveOn</p>
            <Badge className="mt-6 h-7 bg-orange-500/14 px-3 uppercase tracking-[0.18em] text-orange-100 ring-1 ring-orange-300/20">
              <SparklesIcon data-icon="inline-start" />
              {copy.hero.badge}
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.04] text-white md:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
              {copy.hero.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton onClick={onStart} className="w-full sm:w-auto">
                {copy.hero.primaryCta}
              </CTAButton>
              <CTAButton variant="outline" onClick={onExample} className="w-full sm:w-auto">
                {copy.hero.secondaryCta}
              </CTAButton>
            </div>
            <dl className="mt-9 grid gap-4 sm:grid-cols-3">
              {map(
                copy.hero.metrics,
                ([value, label]) => <div key={value} className="border-l border-white/16 pl-4">
                    <dt className="text-xl font-semibold text-white md:text-2xl">{value}</dt>
                    <dd className="mt-1 text-sm leading-5 text-white/56">{label}</dd>
                  </div>,
              )}
            </dl>
          </motion.div>

          <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
      animate={shouldReduceMotion ? void 0 : { opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-2xl md:max-w-none"
    >
            <ProductPreviewSlider preview={productPreview} variant="landing" />
          </motion.div>
        </div>
      </section>
  );
};
const ValueStrip = ({ items }) => <section className={cn("border-y", warmSectionClass)}>
    <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 md:grid-cols-2 md:px-8 lg:grid-cols-4">
      {map(
        items,
        ([title, body, Icon]) => <div key={title} className="flex gap-3 rounded-2xl px-1 py-2">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl ring-1 ring-orange-500/12", iconSurfaceClass)}>
              <Icon className="size-5" />
            </span>
            <span>
              <span className={cn("block font-semibold", strongTextClass)}>{title}</span>
              <span className={cn("mt-1 block text-sm leading-5", mutedTextClass)}>{body}</span>
            </span>
          </div>,
      )}
    </div>
  </section>;
const HowItWorks = ({ copy }) => <MotionSection id="how" className={cn(plainSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} align="center" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {map(
          copy.steps,
          ([title, body, Icon], index) => <StepCard key={title} index={index + 1} title={title} body={body} icon={Icon} />,
        )}
      </div>
    </div>
  </MotionSection>;
const StepCard = ({
  index,
  title,
  body,
  icon: Icon
}) => <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
    <Card className={cn(landingCardPaddingY, "h-full", cardSurfaceClass)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <Badge className="size-11 rounded-2xl bg-slate-950 text-sm text-white dark:bg-white dark:text-slate-950">0{index}</Badge>
          <span className={cn("grid size-11 place-items-center rounded-2xl", iconSurfaceClass)}>
            <Icon className="size-5" />
          </span>
        </div>
        <CardTitle className={cn("text-xl font-semibold", strongTextClass)}>{title}</CardTitle>
        <CardDescription className={cn("text-base leading-7", mutedTextClass)}>{body}</CardDescription>
      </CardHeader>
    </Card>
  </motion.article>;
const DailyPlanFeatures = ({ copy }) => <MotionSection id="features" className={cn(warmSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {map(
          copy.features,
          ([title, body, Icon]) => <FeatureCard key={title} title={title} body={body} icon={Icon} />,
        )}
      </div>
    </div>
  </MotionSection>;
const FeatureCard = ({
  title,
  body,
  icon: Icon
}) => <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
    <Card className={cn(compactCardPaddingY, "h-full", warmCardSurfaceClass)}>
      <CardHeader>
        <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Icon className="size-5" />
        </span>
        <CardTitle className={cn("text-lg font-semibold", strongTextClass)}>{title}</CardTitle>
        <CardDescription className={cn("leading-6", mutedTextClass)}>{body}</CardDescription>
      </CardHeader>
    </Card>
  </motion.article>;
const PlanShowcase = ({
  copy,
  onMeal,
  onWorkout
}) => <MotionSection id="nutrition" className={cn(plainSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} align="center" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PlanExampleCard type="meal" data={copy.meal} onClick={onMeal} />
        <PlanExampleCard type="workout" data={copy.workout} onClick={onWorkout} />
      </div>
    </div>
  </MotionSection>;
const PlanExampleCard = ({
  type,
  data,
  onClick
}) => {
  const Icon = type === "meal" ? SaladIcon : DumbbellIcon;
  return (
    <Card
      id={type === "workout" ? "workouts" : void 0}
      className={cn(
        landingCardPaddingY,
        "h-full",
        cardSurfaceClass,
        type === "workout" && "bg-slate-950 text-white ring-white/10 dark:bg-slate-950"
      )}
    >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge
      className={cn(
        "bg-orange-500/12 text-orange-700 ring-1 ring-orange-500/16",
        type === "workout" && "bg-orange-300/12 text-orange-100 ring-orange-300/20"
      )}
    >
                {data.badge}
              </Badge>
              <CardTitle className={cn("mt-4 text-2xl font-semibold", strongTextClass, type === "workout" && "text-white")}>
                {data.title}
              </CardTitle>
              <CardDescription className={cn("mt-2 text-base leading-7", mutedTextClass, type === "workout" && "text-white/66")}>
                {data.body}
              </CardDescription>
            </div>
            <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-700",
        type === "workout" && "bg-white/8 text-orange-200"
      )}
    >
              <Icon className="size-6" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div
      className={cn(
        "rounded-3xl bg-[#fff8ee] p-4 text-sm leading-7 text-slate-800",
        "dark:bg-white/[0.07] dark:text-white/78 dark:ring-1 dark:ring-white/10",
        type === "workout" && "bg-white/[0.06] text-white/82 ring-1 ring-white/10"
      )}
    >
            {map(data.example, (item) => <p key={item}>{item}</p>)}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {map(data.checklist, (item) => <div
      key={item}
      className={cn("flex items-center gap-2 text-sm font-medium", bodyTextClass, type === "workout" && "text-white/72")}
    >
                <CheckIcon className={cn("size-4 text-emerald-600", type === "workout" && "text-emerald-300")} />
                {item}
              </div>)}
          </div>
        </CardContent>
        <CardFooter>
          <CTAButton variant={type === "workout" ? "light" : "dark"} onClick={onClick} className="w-full sm:w-auto">
            {data.cta}
          </CTAButton>
        </CardFooter>
      </Card>
  );
};
const ProgressSection = ({ copy }) => <MotionSection id="progress" className="overflow-hidden bg-slate-950 py-16 text-white md:py-24">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} inverse />
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {map(copy.metrics, ([value, label, Icon, tone]) => <MetricCard
  key={value}
  value={value}
  label={label}
  icon={Icon}
  tone={tone}
  dark
/>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ChartPanel title={copy.chartTitle} rangeLabel={copy.chartRange} />
          <WeightPanel title={copy.weightTitle} value={copy.weightValue} change={copy.weightChange} />
        </div>
      </div>
    </div>
  </MotionSection>;
const MetricCard = ({
  value,
  label,
  icon: Icon,
  tone,
  dark = false
}) => <div
  className={cn(
    "rounded-2xl p-4 ring-1",
    dark ? darkMetricTone[tone] : metricTone[tone]
  )}
>
    <Icon className="size-5" />
    <p className={cn("mt-3 text-lg font-semibold", dark && "text-white")}>{value}</p>
    <p className={cn("mt-1 text-sm", dark ? "text-white/55" : "text-slate-600")}>{label}</p>
  </div>;
const ChartPanel = ({ title, rangeLabel }) => {
  const values = [62, 74, 68, 84, 76, 92, 78];
  return (
    <div className="rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-4">
          <p className="font-semibold">{title}</p>
          <Badge className="bg-blue-300/12 text-blue-100 ring-1 ring-blue-300/20">{rangeLabel}</Badge>
        </div>
        <div className="mt-6 flex h-40 items-end gap-3">
          {map(
            values,
            (value, index) => <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div
        className="w-full rounded-t-2xl bg-gradient-to-t from-orange-500 to-orange-300"
        style={{ height: `${value}%` }}
      />
                <span className="text-xs text-white/42">{index + 1}</span>
              </div>,
          )}
        </div>
      </div>
  );
};
const WeightPanel = ({ title, value, change }) => <div className="rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
    <div className="flex items-center justify-between gap-4">
      <p className="font-semibold">{title}</p>
      <ScaleIcon className="size-5 text-emerald-300" />
    </div>
    <div className="mt-5 rounded-2xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/20">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-white/58">{change}</p>
    </div>
    <svg viewBox="0 0 280 120" className="mt-5 h-28 w-full" role="img" aria-label={title}>
      <path
  d="M8 94 C44 88 58 76 82 80 C112 86 130 52 154 58 C184 66 204 34 230 38 C246 40 262 28 272 24"
  fill="none"
  stroke="#34d399"
  strokeWidth="6"
  strokeLinecap="round"
/>
      <path
  d="M8 94 C44 88 58 76 82 80 C112 86 130 52 154 58 C184 66 204 34 230 38 C246 40 262 28 272 24 L272 120 L8 120 Z"
  fill="rgba(52,211,153,0.12)"
/>
    </svg>
  </div>;
const LocalMarketSection = ({ copy }) => <MotionSection id="local-market" className={cn(warmSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} />
      <div className="grid gap-4 sm:grid-cols-2">
        {map(copy.cards, ([title, body, Icon], index) => <Card
  key={title}
  className={cn(
    landingCardPaddingY,
    warmCardSurfaceClass,
    index === 0 && "sm:col-span-2"
  )}
>
            <CardHeader>
              <span className={cn("grid size-11 place-items-center rounded-2xl", iconSurfaceClass)}>
                <Icon className="size-5" />
              </span>
              <CardTitle className={cn("text-xl font-semibold", strongTextClass)}>{title}</CardTitle>
              <CardDescription className={cn("text-base leading-7", mutedTextClass)}>{body}</CardDescription>
            </CardHeader>
          </Card>)}
      </div>
    </div>
  </MotionSection>;
const ComparisonSection = ({ copy }) => <MotionSection className={cn(plainSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} align="center" />
      <Card className={cn("mt-10 hidden lg:block", cardSurfaceClass)}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {map(copy.columns, (column, index) => <TableHead
  key={column}
  className={cn(
    "h-14 text-sm font-semibold text-slate-600 dark:text-white/64",
    index === 1 && "bg-slate-950 text-white"
  )}
>
                    {column}
                  </TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {map(
                copy.rows,
                ([feature, liveon, ordinary, generic]) => <TableRow key={feature} className="hover:bg-orange-50/45 dark:hover:bg-white/[0.04]">
                    <TableCell className={cn("font-medium", strongTextClass)}>{feature}</TableCell>
                    <TableCell className="bg-slate-950">
                      <StatusBadge value={liveon} copy={copy} highlighted />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={ordinary} copy={copy} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={generic} copy={copy} />
                    </TableCell>
                  </TableRow>,
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-10 grid gap-4 lg:hidden">
        {map(
          copy.rows,
          ([feature, liveon, ordinary, generic]) => <Card key={feature} className={cn(compactCardPaddingY, cardSurfaceClass)}>
              <CardHeader>
                <CardTitle className={cn("font-semibold", strongTextClass)}>{feature}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <MobileStatus label={copy.columns[1]} value={liveon} copy={copy} highlighted />
                <MobileStatus label={copy.columns[2]} value={ordinary} copy={copy} />
                <MobileStatus label={copy.columns[3]} value={generic} copy={copy} />
              </CardContent>
            </Card>,
        )}
      </div>
    </div>
  </MotionSection>;
const statusLabel = (value, copy) => {
  if (value === "yes") return copy.yes;
  if (value === "partial") return copy.partial;
  return copy.no;
};
const StatusBadge = ({
  value,
  copy,
  highlighted = false
}) => {
  const tone = statusTone[value] ?? statusTone.no;
  const Icon = tone.icon;
  return <span
    className={cn(
      "inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-semibold ring-1",
      tone.className,
      highlighted && "bg-white/10 text-white ring-white/16"
    )}
  >
      <Icon className="size-4" />
      {statusLabel(value, copy)}
    </span>;
};
const MobileStatus = ({
  label,
  value,
  copy,
  highlighted = false
}) => <div className={cn("flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.06]", highlighted && "bg-slate-950 dark:bg-slate-950")}>
    <span className={cn("text-sm font-semibold", mutedTextClass, highlighted && "text-white")}>{label}</span>
    <StatusBadge value={value} copy={copy} highlighted={highlighted} />
  </div>;
const TestimonialsSection = ({ copy }) => <MotionSection id="testimonials" className={cn(warmSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} body={copy.body} align="center" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {map(
          copy.items,
          ([title, body, tag]) => <Card key={title} className={cn(landingCardPaddingY, "h-full", warmCardSurfaceClass)}>
              <CardHeader>
                <Badge className="bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/16">
                  {tag}
                </Badge>
                <CardTitle className={cn("text-xl font-semibold", strongTextClass)}>{title}</CardTitle>
                <CardDescription className={cn("text-base leading-7", mutedTextClass)}>{body}</CardDescription>
              </CardHeader>
            </Card>,
        )}
      </div>
    </div>
  </MotionSection>;
const PricingSection = ({
  copy,
  onStart
}) => <MotionSection id="pricing" className={cn(plainSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} align="center" />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <PricingCard data={copy.free} onClick={() => onStart("pricing_free_cta_clicked")} />
        <PricingCard data={copy.premium} highlighted onClick={() => onStart("pricing_premium_cta_clicked")} />
      </div>
    </div>
  </MotionSection>;
const PricingCard = ({
  data,
  highlighted = false,
  onClick
}) => <Card
  className={cn(
    landingCardPaddingY,
    "h-full",
    cardSurfaceClass,
    highlighted && "border-orange-300/40 bg-slate-950 text-white ring-orange-300/20 dark:bg-slate-950"
  )}
>
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle className={cn("text-2xl font-semibold", strongTextClass, highlighted && "text-white")}>
              {data.title}
            </CardTitle>
            {data.badge ? <Badge className="bg-orange-300 text-slate-950">{data.badge}</Badge> : null}
          </div>
          <p className={cn("mt-4 text-3xl font-semibold", strongTextClass, highlighted && "text-white")}>{data.price}</p>
        </div>
        {highlighted ? <StarIcon className="size-8 text-orange-300" /> : <FileTextIcon className="size-8 text-slate-400" />}
      </div>
    </CardHeader>
    <CardContent className="grid gap-3">
      {map(
        data.features,
        (item) => <div key={item} className={cn("flex items-center gap-2 text-sm font-medium", mutedTextClass, highlighted && "text-white/70")}>
            <CheckCircle2Icon className={cn("size-4 text-emerald-600", highlighted && "text-orange-300")} />
            {item}
          </div>,
      )}
    </CardContent>
    <CardFooter>
      <CTAButton variant={highlighted ? "light" : "dark"} onClick={onClick} className="w-full" disabled={highlighted}>
        {data.cta}
      </CTAButton>
    </CardFooter>
  </Card>;
const FAQSection = ({ copy }) => <MotionSection id="faq" className={cn(warmSectionClass, "py-16 md:py-24")}>
    <div className="mx-auto max-w-4xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} align="center" />
      <div className="mt-10">
        <Accordion type="single" collapsible defaultValue="faq-0" className="border-orange-900/10 bg-white dark:border-white/10 dark:bg-white/[0.06]">
          {map(
            copy.items,
            ([question, answer], index) => <FAQItem key={question} question={question} answer={answer} value={`faq-${index}`} />,
          )}
        </Accordion>
      </div>
    </div>
  </MotionSection>;
const FAQItem = ({
  question,
  answer,
  value
}) => <AccordionItem value={value}>
    <AccordionTrigger
  className={cn("min-h-16 text-base font-semibold no-underline hover:no-underline", strongTextClass)}
  onClick={() => trackLandingEvent("faq_opened", { question })}
>
      {question}
    </AccordionTrigger>
    <AccordionContent className={cn("leading-7", mutedTextClass)}>{answer}</AccordionContent>
  </AccordionItem>;
const FinalCTA = ({
  copy,
  productPreview,
  onStart,
  onExample
}) => <section className="bg-slate-950 px-5 py-16 text-white md:px-8 md:py-24">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
      <div>
        <h2 className="text-3xl font-semibold leading-tight md:text-5xl">{copy.title}</h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/68 md:text-lg">{copy.body}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <CTAButton onClick={onStart} className="w-full sm:w-auto">
            {copy.cta}
          </CTAButton>
          <CTAButton variant="outline" onClick={onExample} className="w-full sm:w-auto">
            {copy.secondary}
          </CTAButton>
        </div>
      </div>
      <ProductPreviewSlider compact preview={productPreview} variant="final" />
    </div>
  </section>;
const Footer = ({ copy }) => <footer className="border-t border-white/10 bg-slate-950 px-5 pb-28 pt-10 text-white md:px-8 md:pb-10">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_1.4fr]">
      <div>
        <div className="inline-flex items-center gap-3">
          <img src="/madagascar/logo-main.webp" alt="" className="size-9 object-contain" loading="lazy" />
          <span className="text-xl font-black">LiveOn</span>
        </div>
        <p className="mt-4 max-w-sm leading-7 text-white/62">{copy.tagline}</p>
        <div className="mt-6 flex gap-2">
          {map(
            SOCIAL_LINKS,
            ({ label, href, icon }) => <SocialButton key={label} label={label} href={href} icon={icon} />,
          )}
        </div>
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {map(copy.columns, ([title, links]) => <div key={title}>
            <h3 className="font-semibold">{title}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {map(links, (item) => {
                const { label, href } = resolveFooterLink(item);
                return <li key={label}>
                  <a href={href} className="text-sm text-white/58 transition-colors hover:text-white">
                    {label}
                  </a>
                </li>;
              })}
            </ul>
          </div>)}
      </div>
    </div>
    <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-white/46">
      {copy.copyright}
    </div>
  </footer>;
const SocialButton = ({ label, href, icon: Icon }) => <a
  href={href}
  aria-label={label}
  rel="noreferrer"
  target="_blank"
  className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/6 text-white/72 transition-colors hover:bg-white/12 hover:text-white"
>
    <Icon className="size-4" />
  </a>;
const StickyMobileCTA = ({
  copy,
  onStart
}) => <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/92 px-4 py-3 text-white shadow-[0_-18px_54px_rgba(2,6,23,0.28)] backdrop-blur-xl md:hidden">
    <Button type="button" onClick={onStart} className="min-h-12 w-full text-base font-semibold">
      {copy.mobileCta}
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  </div>;
const createLandingSchemas = (copy = {}, language) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${LANDING_ORIGIN}/#organization`,
      name: "LiveOn",
      url: LANDING_ORIGIN,
      logo: `${LANDING_ORIGIN}/madagascar/logo-main.webp`,
      sameAs: map(SOCIAL_LINKS, (item) => item.href)
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${LANDING_ORIGIN}/#software`,
      name: "LiveOn",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web, Telegram Web App",
      inLanguage: language,
      url: LANDING_CANONICAL_URL,
      image: LANDING_OG_IMAGE,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: language === "ru" ? "RUB" : "UZS"
      },
      publisher: {
        "@id": `${LANDING_ORIGIN}/#organization`
      }
    },
    {
      "@type": "FAQPage",
      "@id": `${LANDING_ORIGIN}/#faq`,
      inLanguage: language,
      mainEntity: map((copy.faq?.items ?? []), ([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer
        }
      }))
    }
  ]
});
const LandingPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { currentLanguage, hasSelectedLanguage, setCurrentLanguage } = useLanguageStore();
  const mode = useAppModeStore((state) => state.mode);
  const { isAuthenticated, user } = useAuthStore();
  const language = hasSelectedLanguage ? normalizeLanguage(currentLanguage) : "ru";
  const { copy, meta } = useLandingContent(language);
  const structuredData = useMemo(() => createLandingSchemas(copy, language), [copy, language]);
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
      block: "start"
    });
  };
  const showPlanExample = () => {
    trackLandingEvent("example_plan_clicked", { language });
    scrollToSection("nutrition");
  };
  return <>
      <Header
    copy={copy}
    language={language}
    onLanguageChange={setLandingLanguage}
    onStart={startOnboarding}
    onAnchor={scrollToSection}
  />
      <HeroSection
    copy={copy}
    productPreview={copy.productPreview}
    onStart={() => startOnboarding("hero_cta_clicked")}
    onExample={showPlanExample}
  />
      <ValueStrip items={copy.values} />
      <HowItWorks copy={copy.how} />
      <DailyPlanFeatures copy={copy.daily} />
      <PlanShowcase
    copy={copy.showcase}
    onMeal={showPlanExample}
    onWorkout={() => scrollToSection("workouts")}
      />
      <ProgressSection copy={copy.progress} />
      <LocalMarketSection copy={copy.local} />
      <ComparisonSection copy={copy.comparison} />
      <TestimonialsSection copy={copy.scenarios} />
      <PricingSection copy={copy.pricing} onStart={startOnboarding} />
      <FAQSection copy={copy.faq} />
      <FinalCTA
    copy={copy.final}
    productPreview={copy.productPreview}
    onStart={() => startOnboarding("final_cta_clicked")}
    onExample={showPlanExample}
  />
      <Footer copy={copy.footer} />
      <StickyMobileCTA copy={copy.nav} onStart={() => startOnboarding("sticky_mobile_cta_clicked")} />
    </>;
};
var index_default = LandingPage;
export {
  index_default as default
};
