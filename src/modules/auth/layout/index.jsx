import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  DumbbellIcon,
  LeafIcon,
  MessageCircleIcon,
  PaletteIcon,
  PalmtreeIcon,
  SparklesIcon,
  TargetIcon,
  UtensilsIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeToggle from "@/components/theme-toggle";
import {
  AuthMobileKeyboardProvider,
  useMobileKeyboardOpen,
} from "@/modules/auth/lib/mobile-keyboard";
import useAppModeTheme from "@/hooks/app/use-app-mode-theme";
import { cn } from "@/lib/utils";
import { useAppModeStore, APP_MODES } from "@/store";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button.jsx";

const Index = () => {
  const { t } = useTranslation();
  const keyboardOpen = useMobileKeyboardOpen();
  const modeTheme = useAppModeTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [modeDrawerOpen, setModeDrawerOpen] = useState(false);

  const openSelectLanguage = () => {
    navigate("/auth/select-language", {
      state: { returnTo: location.pathname + location.search },
    });
  };

  const panelCopy = {
    panel: {
      badge: t("auth.layout.panelPill"),
      live: t("auth.layout.live"),
      heroStrong: t("auth.layout.heroStrong"),
      heroEmphasis: t("auth.layout.heroEmphasis"),
      sub: t("auth.layout.heroDescription"),
      foot: t("auth.layout.panelCopyright"),
      feat: [
        {
          Icon: UtensilsIcon,
          t: t("auth.layout.caloriesLabel"),
          v: t("auth.layout.caloriesValue"),
          d: t("auth.layout.caloriesMeta"),
        },
        {
          Icon: DumbbellIcon,
          t: t("auth.layout.workoutLabel"),
          v: t("auth.layout.workoutValue"),
          d: t("auth.layout.workoutMeta"),
        },
        {
          Icon: MessageCircleIcon,
          t: t("auth.layout.coachLabel"),
          v: t("auth.layout.coachValue"),
          d: t("auth.layout.coachMeta"),
        },
      ],
    },
  };

  return (
    <AuthMobileKeyboardProvider value={keyboardOpen}>
      <div className="relative h-svh min-h-svh overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-b opacity-80 md:hidden",
            modeTheme.pageTint,
          )}
        />
        <div className="relative grid h-full min-h-0 md:grid-cols-[minmax(390px,26vw)_1fr]">
          <section className="relative z-10 flex min-h-0 flex-col">
            <header className="flex shrink-0 items-center justify-between px-5 py-3">
              <Link
                to="/"
                className="inline-flex items-center transition-opacity hover:opacity-80"
                aria-label={t("auth.layout.logoAlt")}
              >
                <img
                  loading="lazy"
                  src={modeTheme.assets.logo}
                  className="size-12 object-contain"
                  alt={t("auth.layout.logoAlt")}
                />
              </Link>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={() => setModeDrawerOpen(true)}
                  variant="ghost"
                  size="icon-sm"
                  className={"size-11"}
                  aria-label="Change mode"
                >
                  <PaletteIcon className="size-4" />
                </Button>
                <ThemeToggle />
                <LanguageSwitcher compact />
              </div>
            </header>
            <main className="flex min-h-0 flex-1 items-center justify-center md:items-center md:pt-0 p-5">
              <Outlet />
            </main>
          </section>
          <div className="hidden h-svh min-h-0 items-stretch overflow-hidden md:flex">
            <MarketingPanel
              copy={panelCopy}
              vibe={modeTheme.key}
              theme={modeTheme}
            />
          </div>
        </div>
      </div>
      <ModeDrawer open={modeDrawerOpen} onOpenChange={setModeDrawerOpen} />
    </AuthMobileKeyboardProvider>
  );
};

/* ─────────────────────────────────────────────
   MODE SELECTION BOTTOM DRAWER
   ───────────────────────────────────────────── */

const MODE_OPTIONS = [
  {
    value: APP_MODES.FOCUS,
    title: "Focus mode",
    description: "Clean, minimal and distraction-free.",
    icon: TargetIcon,
    accent: "from-slate-500/16 via-zinc-400/9 to-transparent",
    pageTint: "from-slate-500/18 via-zinc-400/10 to-transparent",
    border: "border-slate-400/25",
    iconTone: "bg-gradient-to-br from-slate-500 to-zinc-600 text-white",
    dotTone: "bg-gradient-to-br from-slate-500 to-zinc-600",
    buttonTone:
      "from-slate-600 to-zinc-700 hover:from-slate-600/90 hover:to-zinc-700/90 text-white shadow-[0_18px_44px_rgba(71,85,105,0.22)]",
  },
  {
    value: APP_MODES.ZEN,
    title: "Zen mode",
    description: "Soft, calm and nature-inspired.",
    icon: LeafIcon,
    accent: "from-teal-500/15 via-green-400/8 to-transparent",
    pageTint: "from-teal-500/18 via-green-400/10 to-transparent",
    border: "border-teal-600/22",
    iconTone: "bg-gradient-to-br from-teal-500 to-green-600 text-white",
    dotTone: "bg-gradient-to-br from-teal-500 to-green-600",
    buttonTone:
      "from-teal-600 to-green-700 hover:from-teal-600/90 hover:to-green-700/90 text-white shadow-[0_18px_44px_rgba(20,148,122,0.22)]",
  },
  {
    value: APP_MODES.MADAGASCAR,
    title: "Madagascar mode",
    description: "Wild, playful and energetic.",
    icon: PalmtreeIcon,
    accent: "from-amber-500/18 via-orange-400/10 to-transparent",
    pageTint: "from-amber-500/20 via-orange-400/10 to-transparent",
    border: "border-amber-500/25",
    iconTone: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    dotTone: "bg-gradient-to-br from-amber-500 to-orange-500",
    buttonTone:
      "from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white shadow-[0_18px_44px_rgba(245,158,11,0.26)]",
  },
];

function ModeDrawer({ open, onOpenChange }) {
  const { mode, setMode } = useAppModeStore();
  const [selected, setSelected] = useState(mode || APP_MODES.FOCUS);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(mode || APP_MODES.FOCUS);
    }
  }, [open, mode]);

  const active =
    MODE_OPTIONS.find((m) => m.value === selected) ?? MODE_OPTIONS[0];

  const handleApply = () => {
    setMode(selected);
    onOpenChange(false);
  };

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        {/* Animated bg tint */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[28px]">
          <AnimatePresence mode="sync">
            <motion.div
              key={`drawer-tint-${active.value}`}
              className={cn(
                "absolute inset-0 bg-gradient-to-b opacity-60",
                active.pageTint,
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            />
          </AnimatePresence>
        </div>

        {/* Header */}
        <div className="relative z-10 px-5 pb-1 pt-4 text-center">
          <p className="text-base font-bold">Pick your mood</p>
          <p className="text-xs text-muted-foreground">
            Choose the vibe that suits you today.
          </p>
        </div>

        {/* Mode cards */}
        <div className="relative z-10 flex flex-col gap-2.5 px-4 pt-3">
          {MODE_OPTIONS.map((item) => {
            const isActive = selected === item.value;
            return (
              <motion.button
                key={item.value}
                type="button"
                onClick={() => setSelected(item.value)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-[18px] border bg-background/90 px-3.5 py-3 text-left transition-all",
                  isActive
                    ? `bg-gradient-to-br ${item.accent} ${item.border}`
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    item.iconTone,
                  )}
                >
                  <item.icon className="size-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isActive
                      ? `${item.border} bg-background/70`
                      : "border-muted-foreground/25",
                  )}
                >
                  {isActive && (
                    <div
                      className={cn("size-2.5 rounded-full", item.dotTone)}
                    />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Apply button */}
        <div className="relative z-10 px-4 pb-6 pt-3">
          <DrawerClose asChild>
            <button
              type="button"
              onClick={handleApply}
              className="relative h-11 w-full overflow-hidden rounded-2xl text-sm font-semibold text-white"
            >
              <AnimatePresence mode="sync">
                <motion.span
                  key={`apply-btn-${active.value}`}
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r",
                    active.buttonTone,
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                />
              </AnimatePresence>
              <span className="relative z-10">Apply</span>
            </button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MarketingPanel({ copy, vibe, theme }) {
  return (
    <aside
      className="relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden p-10 text-white"
      style={{
        background: theme.heroGradient,
        boxShadow: `0 30px 80px -36px ${
          theme.key === "madagascar"
            ? "rgba(86,26,19,0.72)"
            : theme.key === "zen"
              ? "rgba(18,68,56,0.72)"
              : "rgba(30,44,60,0.72)"
        }`,
      }}
      key={vibe}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.28),transparent_33%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_42%,rgba(60,0,0,0.22))]" />
        <span className="absolute -top-64 left-[43%] h-[680px] w-[680px] rounded-full bg-white/25" />
        <span className="absolute -right-52 bottom-40 h-[480px] w-[480px] rounded-full bg-white/15" />
        <span className="absolute -bottom-48 -left-40 h-[440px] w-[440px] rounded-full bg-black/10" />
        <WavePlot vibe={vibe} waveColor={theme.waveColor} />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/13 px-4 py-2.5 text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md xl:text-base">
          <span
            className="grid size-8 place-items-center rounded-full bg-white"
            style={{
              color:
                theme.key === "zen"
                  ? "#1a7a64"
                  : theme.key === "focus"
                    ? "#3d5a73"
                    : "#ef7345",
            }}
          >
            <SparklesIcon className="size-3.5" />
          </span>
          {copy.panel.badge}
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-5">
        <div className="max-w-[620px]">
          <h2 className="whitespace-pre-line text-[clamp(3.35rem,5.7vw,6rem)] font-semibold leading-[0.9] tracking-[-0.068em] text-white">
            {copy.panel.heroStrong}
            <br />
            <em className="font-serif text-[0.9em] font-normal italic tracking-[-0.052em] text-white/95">
              {copy.panel.heroEmphasis}
            </em>
            <span className="tracking-[-0.075em]">.</span>
          </h2>

          <p className="mt-7 max-w-[30rem] text-[clamp(1.05rem,1.42vw,1.42rem)] font-normal leading-[1.55] tracking-[-0.015em] text-white/90">
            {copy.panel.sub}
          </p>
        </div>
        <img
          loading="lazy"
          src={theme.assets.background}
          alt=""
          className={"absolute bottom-0"}
        />
      </div>
    </aside>
  );
}

function WavePlot({ vibe, waveColor = "#fff" }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let frameId;

    const loop = () => {
      setTick((value) => value + 0.008);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  }, []);

  const width = 600;
  const height = 200;
  const points = [];

  for (let x = 0; x <= width; x += 6) {
    const base = Math.sin(x * 0.03 + tick * 2) * 6;
    const spikeX = (x + tick * 120) % 180;
    let spike = 0;

    if (spikeX > 70 && spikeX < 90) {
      spike = -40 * Math.exp(-Math.pow((spikeX - 78) / 3, 2));
      spike += 28 * Math.exp(-Math.pow((spikeX - 84) / 2.5, 2));
    }

    points.push([x, height / 2 + base + spike]);
  }

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`)
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className="absolute bottom-[18%] left-0 right-0 h-[32%] w-full"
      preserveAspectRatio="none"
      style={{
        opacity: vibe === "madagascar" ? 0.25 : 0.35,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        style={{ color: waveColor }}
      />
    </svg>
  );
}

export default Index;
