import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";
import {
  DumbbellIcon,
  MessageCircleIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeToggle from "@/components/theme-toggle";

const Index = () => {
  const { t } = useTranslation();
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
    <div className="h-svh min-h-svh overflow-hidden">
      <div className="grid h-full min-h-0 md:grid-cols-[minmax(390px,26vw)_1fr]">
        <section className="relative z-10 flex min-h-0 flex-col px-6 py-6">
          <header className="flex shrink-0 items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center transition-opacity hover:opacity-80"
              aria-label={t("auth.layout.logoAlt")}
            >
              <img
                src="/logo.png"
                className="size-16 object-contain"
                alt={t("auth.layout.logoAlt")}
              />
            </Link>
          </header>

          <main className="flex min-h-0 flex-1 items-center">
            <Outlet />
          </main>

          <footer className="flex shrink-0 items-center justify-center gap-5 pb-1">
            <span className="grid size-9 place-items-center rounded-full transition-colors ">
              <ThemeToggle />
            </span>
            <LanguageSwitcher compact />
          </footer>
        </section>

        <div className="hidden h-svh min-h-0 items-stretch overflow-hidden p-3 pl-0 md:flex lg:p-5 lg:pl-0">
          <MarketingPanel copy={panelCopy} vibe="warm" />
        </div>
      </div>
    </div>
  );
};

function MarketingPanel({ copy, vibe }) {
  const feats = copy.panel.feat;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((value) => (value + 1) % feats.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [feats.length]);

  return (
    <aside
      className="relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,#fb8a4c_0%,#df5238_52%,#9f2c29_100%)] px-7 py-7 text-white shadow-[0_30px_80px_-36px_rgba(86,26,19,0.72)] lg:rounded-[2.15rem] lg:px-9 lg:py-8 xl:px-10"
      key={vibe}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.28),transparent_33%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_42%,rgba(60,0,0,0.22))]" />
        <span className="absolute -top-64 left-[43%] h-[680px] w-[680px] rounded-full bg-white/25" />
        <span className="absolute -right-52 bottom-40 h-[480px] w-[480px] rounded-full bg-white/15" />
        <span className="absolute -bottom-48 -left-40 h-[440px] w-[440px] rounded-full bg-black/10" />
        <WavePlot vibe={vibe} />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/13 px-4 py-2.5 text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md xl:text-base">
          <span className="grid size-8 place-items-center rounded-full bg-white text-[#ef7345]">
            <SparklesIcon className="size-3.5" />
          </span>
          {copy.panel.badge}
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-5">
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

        <div className="mt-10 grid max-w-[560px] gap-3">
          {feats.map(({ Icon, t, v, d }, i) => (
            <div
              key={t}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.35rem] border border-white/20 bg-white/11 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-[opacity,transform,background-color] duration-300 ease-out hover:bg-white/15"
              style={{
                backgroundColor:
                  i === idx
                    ? "rgba(255, 255, 255, 0.16)"
                    : "rgba(255, 255, 255, 0.1)",
                borderColor:
                  i === idx
                    ? "rgba(255, 255, 255, 0.32)"
                    : "rgba(255, 255, 255, 0.18)",
                boxShadow:
                  i === idx
                    ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 16px 34px -24px rgba(46,0,0,0.48)"
                    : "inset 0 1px 0 rgba(255,255,255,0.1)",
                opacity: i === idx ? 1 : 0.72,
                transform: i === idx ? "translateX(8px)" : "none",
              }}
            >
              <span className="grid size-12 place-items-center rounded-[1rem] border border-white/24 bg-white/12 text-white/90">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium uppercase tracking-[0.16em] text-white/58">
                  {t}
                </span>
                <span className="mt-1 block truncate text-[clamp(1.2rem,1.9vw,1.72rem)] font-medium leading-none tracking-[-0.032em] text-white">
                  {v}
                </span>
              </span>
              <span className="rounded-full bg-white/13 px-3.5 py-1.5 font-mono text-xs font-medium tracking-[0.09em] text-white/78">
                {d}
              </span>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 flex items-end justify-between gap-6 text-white/88">
        <span className="text-sm font-medium tracking-wide xl:text-base">
          {copy.panel.foot}
        </span>
      </footer>
    </aside>
  );
}

function WavePlot({ vibe }) {
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
        opacity: vibe === "spa" ? 0.35 : 0.25,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        style={{ color: vibe === "spa" ? "#1a3d2a" : "#fff" }}
      />
    </svg>
  );
}

export default Index;
