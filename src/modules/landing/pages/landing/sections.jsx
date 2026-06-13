import {
  ArrowRightIcon,
  CheckIcon,
  MenuIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react";
import { Link } from "react-router";
import { m, useReducedMotion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import LanguageDrawerPicker from "@/components/language-drawer-picker";
import ProductPreviewSlider from "@/components/liveon-product-preview";
import { cn } from "@/lib/utils";
import {
  LANGUAGES,
  SOCIAL_LINKS,
  resolveFooterLink,
} from "@/modules/landing/pages/landing/content.js";
import map from "lodash/map";
import { DashboardResultMockup } from "./product-mockups.jsx";

export const LandingThemeToggle = ({ className, theme, onToggle }) => {
  const isDark = theme === "dark";
  const Icon = isDark ? SunIcon : MoonIcon;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "Light theme" : "Dark theme"}
      onClick={onToggle}
      className={className}
    >
      <Icon />
    </Button>
  );
};

const CTAButton = ({
  children,
  onClick,
  variant = "default",
  className,
  disabled = false,
}) => (
  <Button
    type="button"
    size="xl"
    variant={variant}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "min-h-11 rounded-xl",
      variant === "default" &&
        "border-[#ff7a1a] bg-[#ff7a1a] text-white shadow-[0_14px_34px_rgba(255,122,26,0.24)] hover:bg-[#f26f0f] hover:opacity-100 dark:border-[#ff8a2a] dark:bg-[#ff8a2a] dark:hover:bg-[#ff7a1a]",
      className,
    )}
  >
    {children}
    <ArrowRightIcon data-icon="inline-end" />
  </Button>
);

const InlinePill = ({ children, className, icon: Icon }) => (
  <span
    className={cn(
      "inline-flex w-fit max-w-full items-start gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium leading-5 text-muted-foreground",
      className,
    )}
  >
    {Icon ? (
      <Icon data-icon="inline-start" className="mt-0.5 size-3.5 shrink-0" />
    ) : null}
    <span className="min-w-0 whitespace-normal break-words">{children}</span>
  </span>
);

const SectionHeader = ({ eyebrow, title, body, align = "left" }) => (
  <div
    className={cn(
      "flex max-w-3xl flex-col gap-4",
      align === "center" && "mx-auto items-center text-center",
    )}
  >
    {eyebrow ? (
      <InlinePill>{eyebrow}</InlinePill>
    ) : null}
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-semibold leading-tight tracking-normal text-foreground md:text-3xl">
        {title}
      </h2>
      {body ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          {body}
        </p>
      ) : null}
    </div>
  </div>
);

const MotionSection = ({ id, children, className }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.section
      id={id}
      className={cn("scroll-mt-24", className)}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.section>
  );
};

export const Header = ({
  copy,
  language,
  onLanguageChange,
  onStart,
  onAnchor,
  theme,
  onToggleTheme,
}) => (
  <header className="fixed inset-x-0 top-0 z-40 border-b border-border/30 bg-background/94 px-4 py-3 text-foreground backdrop-blur-xl md:px-6">
    <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
      <Link
        to="/"
        className="inline-flex min-h-9 items-center gap-2 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="LiveOn"
      >
        <img
          src="/madagascar/logo-main.webp"
          alt={copy.nav.logoAlt}
          className="size-7 object-contain"
          loading="eager"
        />
        <span className="text-base font-semibold">LiveOn</span>
      </Link>

      <nav
        className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex"
        aria-label="Landing navigation"
      >
        {map(copy.nav.links, ([id, label]) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAnchor(id)}
            className="whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {label}
          </Button>
        ))}
      </nav>

      <div className="flex items-center gap-1.5">
        <LandingThemeToggle
          className="hidden lg:inline-flex"
          theme={theme}
          onToggle={onToggleTheme}
        />
        <LanguageDrawerPicker
          ariaLabel={copy.nav.language}
          className="size-9"
          compact
          denseOptions
          description={copy.nav.languageDescription}
          languages={LANGUAGES}
          onValueChange={onLanguageChange}
          title={copy.nav.languageTitle}
          value={language}
        />
        <CTAButton
          onClick={() => onStart("header_cta_clicked")}
          className="hidden min-h-9 px-4 text-[13px] lg:inline-flex"
        >
          {copy.nav.cta}
        </CTAButton>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={copy.nav.menuOpen}
              className="lg:hidden"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[min(88vw,24rem)]">
            <SheetHeader>
              <SheetTitle>{copy.nav.menuTitle}</SheetTitle>
              <SheetDescription>{copy.nav.menuDescription}</SheetDescription>
            </SheetHeader>
            <nav
              className="flex flex-col gap-1 px-6"
              aria-label="Mobile landing navigation"
            >
              {map(copy.nav.links, ([id, label]) => (
                <SheetClose key={id} asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-start"
                    onClick={() => onAnchor(id)}
                  >
                    {label}
                  </Button>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-6">
              <LandingThemeToggle
                className="w-full justify-center"
                theme={theme}
                onToggle={onToggleTheme}
              />
              <SheetClose asChild>
                <CTAButton
                  onClick={() => onStart("mobile_menu_cta_clicked")}
                  className="w-full"
                >
                  {copy.nav.cta}
                </CTAButton>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
);

export const HeroSection = ({ copy, onStart, onExample }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-background pt-16 text-foreground">
      <img
        src="/madagascar/curious.webp"
        alt=""
        className="pointer-events-none absolute right-[-5rem] top-28 z-0 hidden w-[19rem] opacity-[0.08] saturate-110 dark:opacity-[0.06] lg:block"
        aria-hidden="true"
        loading="eager"
      />
      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-9rem)] max-w-5xl gap-8 px-5 py-6 md:px-8 lg:grid-cols-[0.82fr_1fr] lg:items-center lg:gap-10 lg:py-10">
        <m.div
          className="flex max-w-3xl flex-col gap-6"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          animate={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <InlinePill
            icon={SparklesIcon}
            className="border-[#dbeadd] bg-[#f1fbf4] text-[#2f8f3b] dark:border-primary/20 dark:bg-primary/10 dark:text-primary"
          >
            {copy.hero.badge}
          </InlinePill>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-normal md:text-5xl">
              {copy.hero.title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              {copy.hero.body}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
            <CTAButton
              onClick={onStart}
              className="min-w-0 px-4 text-xs sm:w-auto sm:text-sm"
            >
              {copy.hero.primaryCta}
            </CTAButton>
            <Button
              type="button"
              size="xl"
              variant="outline"
              onClick={onExample}
              className="min-h-11 min-w-0 rounded-xl bg-background px-4 text-xs shadow-sm sm:w-auto sm:text-sm"
            >
              {copy.hero.secondaryCta}
            </Button>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {map(copy.hero.metrics, ([value, label]) => (
              <div
                key={value}
                className="rounded-2xl border border-border/80 bg-card/70 p-3 shadow-[0_16px_44px_rgba(15,23,42,0.035)] sm:p-4"
              >
                <dt className="text-base font-semibold text-foreground sm:text-lg">
                  {value}
                </dt>
                <dd className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </m.div>

        <m.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
          animate={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden w-full flex-col justify-center gap-3 md:flex lg:min-h-[520px]"
        >
          <div className="relative mx-auto w-full max-w-[34rem] lg:mr-0">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[1.75rem] bg-[#e9f5ec] opacity-70 blur-2xl dark:bg-primary/15 sm:-inset-3"
            />
            <DashboardResultMockup
              compact
              copy={copy.hero.dashboard}
              className="relative shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
            />
          </div>
        </m.div>
      </div>
    </section>
  );
};

export const ProofStrip = ({ items }) => (
  <section id="features" className="scroll-mt-24 bg-background">
    <div className="mx-auto grid max-w-5xl gap-3 px-5 py-8 md:grid-cols-2 md:px-8 lg:grid-cols-4">
      {map(items, ([title, body, Icon]) => (
        <div
          key={title}
          className="group flex gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_14px_40px_rgba(15,23,42,0.035)] transition-colors hover:border-[#bfe8c8] dark:hover:border-primary/35"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf8ee] text-[#2f9e44] transition-colors dark:bg-primary/10 dark:text-primary">
            <Icon className="size-5" />
          </span>
          <span>
            <span className="block font-medium text-foreground">{title}</span>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">
              {body}
            </span>
          </span>
        </div>
      ))}
    </div>
  </section>
);

export const ScenariosSection = ({ copy }) => (
  <MotionSection id="testimonials" className="bg-background py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {map(copy.items, ([title, body, tag]) => (
          <Card
            key={title}
            className="h-full border-border/80 bg-card shadow-[0_16px_46px_rgba(15,23,42,0.04)] transition-colors hover:border-[#bfe8c8] dark:hover:border-primary/35"
          >
            <CardHeader>
              <InlinePill className="border-[#dbeadd] bg-[#f1fbf4] text-[#2f8f3b] dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
                {tag}
              </InlinePill>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="leading-6">{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  </MotionSection>
);

export const PricingSection = ({ copy, onStart }) => (
  <MotionSection id="pricing" className="bg-background py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        align="center"
      />
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
        <PricingCard
          data={copy.free}
          onClick={() => onStart("pricing_free_cta_clicked")}
        />
        <PricingCard data={copy.premium} highlighted disabled />
      </div>
    </div>
  </MotionSection>
);

const PricingCard = ({ data, highlighted = false, disabled = false, onClick }) => (
  <Card
    className={cn(
      "h-full transition-colors shadow-[0_16px_46px_rgba(15,23,42,0.04)]",
      highlighted
        ? "border-[#ff7a1a]/55 bg-card"
        : "border-border/80 bg-card",
    )}
  >
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-2xl">{data.title}</CardTitle>
            {data.badge ? (
              <InlinePill
                className={cn(
                  highlighted
                    ? "border-[#ff7a1a] bg-[#ff7a1a] text-white"
                    : "border-[#dbeadd] bg-[#f1fbf4] text-[#2f8f3b] dark:border-primary/20 dark:bg-primary/10 dark:text-primary",
                )}
              >
                {data.badge}
              </InlinePill>
            ) : null}
          </div>
          <p
            className={cn(
              "text-3xl font-semibold",
              highlighted && "text-muted-foreground",
            )}
          >
            {data.price}
          </p>
        </div>
        <SparklesIcon
          className={cn(
            "size-7",
            highlighted ? "text-[#ff7a1a]" : "text-[#2f9e44] dark:text-primary",
          )}
        />
      </div>
    </CardHeader>
    <CardContent className="grid gap-3">
      {map(data.features, (item) => (
        <div key={item} className="flex items-center gap-2 text-sm">
          <CheckIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-[#2f9e44] dark:text-primary"
          />
          {item}
        </div>
      ))}
    </CardContent>
    <CardFooter>
      <CTAButton
        variant="default"
        onClick={onClick}
        className="w-full"
        disabled={disabled}
      >
        {data.cta}
      </CTAButton>
    </CardFooter>
  </Card>
);

export const FAQSection = ({ copy, onQuestionOpen }) => (
  <MotionSection id="faq" className="bg-background py-16 md:py-24">
    <div className="mx-auto max-w-5xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} align="center" />
      <Accordion
        type="single"
        collapsible
        defaultValue="faq-0"
        className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border/80 bg-card px-4 shadow-[0_16px_46px_rgba(15,23,42,0.04)]"
      >
        {map(copy.items, ([question, answer], index) => (
          <AccordionItem key={question} value={`faq-${index}`}>
            <AccordionTrigger onClick={() => onQuestionOpen(question)}>
              {question}
            </AccordionTrigger>
            <AccordionContent className="leading-7 text-muted-foreground">
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </MotionSection>
);

export const FinalCTA = ({ copy, productPreview, onStart, onExample }) => (
  <section className="relative isolate overflow-hidden bg-background px-5 py-16 text-foreground md:px-8 md:py-24">
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] border border-border/80 bg-[linear-gradient(110deg,#f4fbf6_0%,#fff_52%,#fff4e8_100%)] p-6 shadow-[0_22px_70px_rgba(15,23,42,0.07)] dark:bg-[linear-gradient(110deg,color-mix(in_oklab,var(--card)_96%,var(--primary))_0%,var(--card)_54%,color-mix(in_oklab,var(--card)_88%,#ff7a1a)_100%)] md:p-8 lg:p-10">
      <img
        src="/madagascar/curious.webp"
        alt=""
        className="pointer-events-none absolute bottom-0 right-[-3rem] hidden w-[16rem] opacity-[0.10] dark:opacity-[0.06] lg:block"
        aria-hidden="true"
        loading="lazy"
      />
      <div className="relative grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
              {copy.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {copy.body}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CTAButton onClick={onStart} className="w-full sm:w-auto">
              {copy.cta}
            </CTAButton>
            <Button
              type="button"
              size="xl"
              variant="outline"
              onClick={onExample}
              className="min-h-11 w-full rounded-xl bg-background/75 backdrop-blur hover:bg-background/90 sm:w-auto"
            >
              {copy.secondary}
            </Button>
          </div>
        </div>
        <ProductPreviewSlider compact preview={productPreview} variant="final" />
      </div>
    </div>
  </section>
);

export const Footer = ({ copy }) => (
  <footer className="border-t border-border/70 bg-background px-5 pb-28 pt-10 text-foreground md:px-8 md:pb-10">
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.35fr]">
      <div>
        <div className="inline-flex items-center gap-3">
          <img
            src="/madagascar/logo-main.webp"
            alt=""
            className="size-9 object-contain"
            loading="lazy"
          />
          <span className="text-xl font-semibold">LiveOn</span>
        </div>
        <p className="mt-4 max-w-sm leading-7 text-muted-foreground">
          {copy.tagline}
        </p>
        <div className="mt-6 flex gap-2">
          {map(SOCIAL_LINKS, ({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              rel="noreferrer"
              target="_blank"
              className="grid size-10 place-items-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="grid gap-8 sm:grid-cols-3">
        {map(copy.columns, ([title, links]) => (
          <div key={title}>
            <h3 className="font-medium">{title}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {map(links, (item) => {
                const { label, href } = resolveFooterLink(item);

                return (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
    <div className="mx-auto mt-10 max-w-5xl">
      <Separator />
      <p className="pt-6 text-sm text-muted-foreground">{copy.copyright}</p>
    </div>
  </footer>
);

export const StickyMobileCTA = ({ copy, onStart }) => (
  <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/92 px-4 py-3 shadow-lg backdrop-blur-xl md:hidden">
    <Button
      type="button"
      onClick={onStart}
      className="min-h-12 w-full rounded-xl border-[#ff7a1a] bg-[#ff7a1a] text-base font-medium text-white shadow-[0_14px_34px_rgba(255,122,26,0.24)] hover:bg-[#f26f0f] hover:opacity-100 dark:border-[#ff8a2a] dark:bg-[#ff8a2a]"
    >
      {copy.mobileCta}
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  </div>
);
