import {
  ArrowRightIcon,
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
    className={cn("min-h-11", className)}
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
      <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground md:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
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
  <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/88 px-4 py-2 text-foreground shadow-sm backdrop-blur-xl md:px-6">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <Link
        to="/"
        className="inline-flex min-h-9 items-center gap-2 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="LiveOn"
      >
        <img
          src="/madagascar/logo-main.webp"
          alt={copy.nav.logoAlt}
          className="size-8 object-contain"
          loading="eager"
        />
        <span className="text-base font-semibold">LiveOn</span>
      </Link>

      <nav
        className="hidden items-center gap-1 xl:flex"
        aria-label="Landing navigation"
      >
        {map(copy.nav.links, ([id, label]) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAnchor(id)}
            className="whitespace-nowrap"
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
              className="xl:hidden"
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
    <section className="relative isolate overflow-hidden bg-background pt-14 text-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35 saturate-110"
        style={{ backgroundImage: "url('/madagascar/background.webp')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,var(--background)_0%,color-mix(in_oklab,var(--background)_94%,transparent)_42%,color-mix(in_oklab,var(--background)_58%,transparent)_100%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid min-h-[calc(100svh-7rem)] max-w-7xl gap-5 px-5 py-5 sm:py-6 md:px-8 lg:grid-cols-[0.82fr_1fr] lg:items-center lg:gap-8 lg:py-8 xl:py-9">
        <m.div
          className="flex max-w-3xl flex-col gap-4 lg:pb-8"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          animate={shouldReduceMotion ? void 0 : { opacity: 1, y: 0 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-semibold md:text-4xl">LiveOn</p>
            <InlinePill
              icon={SparklesIcon}
              className="bg-background/80 text-foreground shadow-sm backdrop-blur"
            >
              {copy.hero.badge}
            </InlinePill>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold leading-[1.05] tracking-normal md:text-5xl xl:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {copy.hero.body}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
            <CTAButton
              onClick={onStart}
              className="min-w-0 px-2 text-xs sm:w-auto sm:px-4 sm:text-sm"
            >
              {copy.hero.primaryCta}
            </CTAButton>
            <Button
              type="button"
              size="xl"
              variant="outline"
              onClick={onExample}
              className="min-h-11 min-w-0 bg-background/65 px-2 text-xs backdrop-blur hover:bg-background/85 sm:w-auto sm:px-4 sm:text-sm"
            >
              {copy.hero.secondaryCta}
            </Button>
          </div>
          <dl className="hidden gap-4 lg:grid lg:grid-cols-3">
            {map(copy.hero.metrics, ([value, label]) => (
              <div key={value} className="border-l border-border pl-4">
                <dt className="text-lg font-semibold md:text-xl">{value}</dt>
                <dd className="mt-1 text-sm leading-5 text-muted-foreground">
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
          className="relative flex w-full flex-col justify-center gap-3 lg:min-h-[520px]"
        >
          <div className="relative mx-auto w-full max-w-[34rem] lg:mr-0">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[1.75rem] border bg-background/40 shadow-2xl backdrop-blur-md sm:-inset-3"
            />
            <DashboardResultMockup
              compact
              copy={copy.hero.dashboard}
              className="relative"
            />
          </div>
          <div
            aria-hidden="true"
            className="mx-auto h-3 w-[min(18rem,60vw)] rounded-t-3xl border-x border-t bg-background/80 backdrop-blur lg:h-4 lg:mr-[5rem]"
          />
          {copy.productTour?.eyebrow ? (
            <p className="mx-auto w-[min(24rem,80vw)] text-center text-sm text-muted-foreground lg:mr-[2rem]">
              {copy.productTour.eyebrow}
            </p>
          ) : null}
        </m.div>
      </div>
    </section>
  );
};

export const ProofStrip = ({ items }) => (
  <section id="features" className="scroll-mt-24 border-y bg-card/75">
    <div className="mx-auto grid max-w-7xl gap-3 px-5 py-4 md:grid-cols-2 md:px-8 lg:grid-cols-4">
      {map(items, ([title, body, Icon]) => (
        <div
          key={title}
          className="group flex gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-background/65"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        body={copy.body}
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {map(copy.items, ([title, body, tag]) => (
          <Card key={title} className="h-full">
            <CardHeader>
              <InlinePill className="bg-secondary text-secondary-foreground">
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
  <MotionSection id="pricing" className="bg-muted/35 py-16 md:py-24">
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        align="center"
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
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
      "h-full transition-colors",
      highlighted
        ? "border-dashed border-border bg-background/55"
        : "border-primary/35 shadow-sm",
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
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground",
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
            highlighted ? "text-muted-foreground" : "text-primary",
          )}
        />
      </div>
    </CardHeader>
    <CardContent className="grid gap-3">
      {map(data.features, (item) => (
        <div key={item} className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-muted-foreground"
          />
          {item}
        </div>
      ))}
    </CardContent>
    <CardFooter>
      <CTAButton
        variant={highlighted ? "secondary" : "default"}
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
    <div className="mx-auto max-w-4xl px-5 md:px-8">
      <SectionHeader eyebrow={copy.eyebrow} title={copy.title} align="center" />
      <Accordion
        type="single"
        collapsible
        defaultValue="faq-0"
        className="mt-10 rounded-lg border bg-card/50 px-4"
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
  <section className="relative isolate overflow-hidden border-y bg-background px-5 py-16 text-foreground md:px-8 md:py-24">
    <div
      className="absolute inset-0 bg-cover bg-center opacity-20"
      style={{ backgroundImage: "url('/madagascar/background.webp')" }}
      aria-hidden="true"
    />
    <div
      className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/75"
      aria-hidden="true"
    />
    <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
            {copy.title}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
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
            className="min-h-11 w-full bg-background/65 backdrop-blur hover:bg-background/85 sm:w-auto"
          >
            {copy.secondary}
          </Button>
        </div>
      </div>
      <ProductPreviewSlider compact preview={productPreview} variant="final" />
    </div>
  </section>
);

export const Footer = ({ copy }) => (
  <footer className="border-t bg-card px-5 pb-28 pt-10 text-card-foreground md:px-8 md:pb-10">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.35fr]">
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
    <div className="mx-auto mt-10 max-w-7xl">
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
      className="min-h-12 w-full text-base font-medium"
    >
      {copy.mobileCta}
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  </div>
);
