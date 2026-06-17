import { useMemo } from "react";
import {
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
  SendIcon,
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
  ZapIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import isArray from "lodash/isArray";
import map from "lodash/map";
import toLower from "lodash/toLower";

export const LANDING_ORIGIN = "https://liveon.uz";
export const LANDING_CANONICAL_URL = `${LANDING_ORIGIN}/`;
export const LANDING_OG_IMAGE = `${LANDING_ORIGIN}/madagascar/background.webp`;

export const LANGUAGES = [
  {
    code: "ru",
    label: "Русский",
    name: "Русский",
    native: "RU",
    flag: "🇷🇺",
    border: "border-blue-500/60",
    dotTone: "bg-blue-500",
  },
  {
    code: "uz",
    label: "O'zbekcha",
    name: "O'zbekcha",
    native: "UZ",
    flag: "🇺🇿",
    border: "border-emerald-500/60",
    dotTone: "bg-emerald-500",
  },
  {
    code: "en",
    label: "English",
    name: "English",
    native: "EN",
    flag: "🇺🇸",
    border: "border-orange-500/60",
    dotTone: "bg-orange-500",
  },
];

export const SOCIAL_LINKS = [
  {
    label: "Telegram",
    href: "https://t.me/liveonappbot",
    icon: SendIcon,
  },
];

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
  ZapIcon,
};

export const normalizeLanguage = (language) => {
  if (language?.startsWith("uz")) return "uz";
  if (language?.startsWith("en")) return "en";
  return "ru";
};

const hydrateIconRows = (items = [], fallbackIcon = SparklesIcon) =>
  map(items, ([title, body, iconName, ...rest]) => [
    title,
    body,
    landingIconMap[iconName] ?? fallbackIcon,
    ...rest,
  ]);

const hydrateMetricRows = (items = []) =>
  map(items, ([value, label, iconName, tone]) => [
    value,
    label,
    landingIconMap[iconName] ?? ActivityIcon,
    tone,
  ]);

const hydrateIconObjects = (items = [], fallbackIcon = SparklesIcon) =>
  map(items, (item) => ({
    ...item,
    icon: landingIconMap[item.icon] || fallbackIcon,
  }));

const hydrateLandingCopy = (copy = {}) => ({
  ...copy,
  values: hydrateIconRows(copy.values),
  how: {
    ...copy.how,
    steps: hydrateIconRows(copy.how?.steps),
  },
  daily: {
    ...copy.daily,
    features: hydrateIconRows(copy.daily?.features),
  },
  productTour: {
    ...copy.productTour,
    steps: hydrateIconObjects(copy.productTour?.steps, TargetIcon),
  },
  productModules: {
    ...copy.productModules,
    items: hydrateIconObjects(copy.productModules?.items, BarChart3Icon),
  },
  progress: {
    ...copy.progress,
    metrics: hydrateMetricRows(copy.progress?.metrics),
  },
  local: {
    ...copy.local,
    cards: hydrateIconRows(copy.local?.cards),
  },
});

export const useLandingContent = (language) => {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const fixedT = i18n.getFixedT(language);
    const landing = fixedT("landing", { returnObjects: true });
    const landingCopy = landing && typeof landing === "object" ? landing : {};
    const { meta = {}, ...copy } = landingCopy;

    return {
      copy: hydrateLandingCopy(copy),
      meta,
    };
  }, [i18n, language]);
};

export const resolveFooterLink = (item) => {
  if (isArray(item)) {
    return {
      label: item[0],
      href: item[1] || "/",
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
    tariflar: "#pricing",
  };

  return {
    label: item,
    href: fallbackLinks[normalized] || "/",
  };
};

export const setMetaTag = (selector, value) => {
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

export const setLinkTag = (rel, href) => {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
};

export const setJsonLdScript = (id, value) => {
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

export const createLandingSchemas = (copy = {}, language) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${LANDING_ORIGIN}/#organization`,
      name: "LiveOn",
      url: LANDING_ORIGIN,
      logo: `${LANDING_ORIGIN}/madagascar/logo-main.webp`,
      sameAs: map(SOCIAL_LINKS, (item) => item.href),
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
        priceCurrency: language === "ru" ? "RUB" : "UZS",
      },
      publisher: {
        "@id": `${LANDING_ORIGIN}/#organization`,
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${LANDING_ORIGIN}/#faq`,
      inLanguage: language,
      mainEntity: map(copy.faq?.items ?? [], ([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ],
});
