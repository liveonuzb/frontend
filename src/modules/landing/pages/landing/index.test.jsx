import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LandingLayout from "@/modules/landing/layout";
import LandingPage from ".";
import en from "@/modules/landing/lib/locales/en.json";
import ru from "@/modules/landing/lib/locales/ru.json";
import uz from "@/modules/landing/lib/locales/uz.json";

import forEach from "lodash/forEach";
import isArray from "lodash/isArray";
import map from "lodash/map";

const localeMap = { en, ru, uz };
const setCurrentLanguageMock = vi.hoisted(() => vi.fn());

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const { default: lodashForEach } = await import("lodash/forEach");
  const createMotionComponent =
    (Tag) =>
    function MotionComponent({ children, ...props }) {
      const domProps = { ...props };
      lodashForEach(
        ["whileHover", "whileInView", "initial", "animate", "transition", "viewport"],
        (prop) => {
          delete domProps[prop];
        },
      );

      return (
        <Tag {...domProps}>
          {children}
        </Tag>
      );
    };
  const motionComponents = {
    article: createMotionComponent("article"),
    div: createMotionComponent("div"),
    section: createMotionComponent("section"),
  };

  return {
    LazyMotion: ({ children }) => <>{children}</>,
    domAnimation: {},
    m: motionComponents,
    motion: motionComponents,
    useReducedMotion: () => true,
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      getFixedT:
        (language = "uz") =>
        (key) => {
          if (key === "landing") {
            return localeMap[language]?.landing ?? localeMap.uz.landing;
          }

          return key;
        },
    },
  }),
}));

vi.mock("@/components/language-drawer-picker", () => ({
  default: ({ ariaLabel, value }) => (
    <button type="button" aria-label={ariaLabel}>
      {value}
    </button>
  ),
}));

vi.mock("@/components/liveon-product-preview", () => ({
  default: () => <div data-testid="product-preview">product preview</div>,
  buildLiveOnProductPreviewCopy: () => ({
    sliderLabel: "Product preview",
    slides: [{ id: "slide-1", title: "Preview" }],
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
  }),
  useLanguageStore: () => ({
    currentLanguage: "uz",
    hasSelectedLanguage: true,
    setCurrentLanguage: setCurrentLanguageMock,
  }),
  useAppModeStore: (selector) => selector({ mode: "madagascar" }),
}));

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/sign-up" element={<div>sign-up destination</div>} />
        <Route path="/auth/select-mode" element={<div>mode destination</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("landing page", () => {
  beforeEach(() => {
    setCurrentLanguageMock.mockClear();
    document.head.innerHTML = "";
    document.documentElement.className = "";
    window.localStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("uses theme-aware root classes in the landing layout", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<LandingLayout />}>
            <Route index element={<div>landing child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("main").className).toContain("dark:bg");
    expect(screen.getByRole("main").className).toContain("dark:text");
  });

  it("does not render placeholder footer or social links", () => {
    renderLanding();

    const hrefs = map(screen
      .getAllByRole("link"), (link) => link.getAttribute("href"));

    expect(hrefs).not.toContain("#");
    expect(hrefs).not.toContain("");
  });

  it("keeps the desktop landing header compact", () => {
    renderLanding();

    expect(screen.getByRole("banner").className).toContain("py-3");
    expect(screen.getByRole("link", { name: "LiveOn" }).className).toContain("min-h-9");
    expect(screen.getByRole("button", { name: "Dasturlar" }).className).toContain(
      "whitespace-nowrap",
    );
  });

  it("renders the dashboard-result hero with preserved public anchors", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Ozish va mashg'ulot rejangizni/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("product-dashboard-preview")).toBeInTheDocument();
    expect(screen.getByText(/Mening ko'rsatkichlarim/i)).toBeInTheDocument();

    forEach([
      "features",
      "how",
      "nutrition",
      "workouts",
      "progress",
      "local-market",
      "testimonials",
      "pricing",
      "faq",
    ], (id) => {
      expect(document.getElementById(id)).not.toBeNull();
    });
  });

  it("renders the immersive product story steps", () => {
    renderLanding();

    expect(screen.getByTestId("product-tour")).toBeInTheDocument();

    forEach(
      [
        "Reja tanlang",
        "Kaloriya kuzating",
        "Mashq bajaring",
        "Natijani ko'ring",
      ],
      (label) => {
        expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      },
    );
  });

  it("shows the existing product modules as compact cards", () => {
    renderLanding();

    expect(screen.getByTestId("product-modules")).toBeInTheDocument();

    forEach(
      [
        ["product-module-onboarding", "Reja tanlash"],
        ["product-module-dashboard", "Kaloriya hisobi"],
        ["product-module-nutrition", "Ovqat nazorati"],
        ["product-module-workouts", "Mashg'ulot rejasi"],
        ["product-module-water-mood", "Suv ichish"],
        ["product-module-progress", "Vazn kuzatuvi"],
        ["product-module-profile", "Qadamlar"],
      ],
      ([testId, label]) => {
        expect(screen.getByTestId(testId)).toHaveTextContent(label);
      },
    );
  });

  it("uses an accessible Sheet for mobile landing navigation", () => {
    renderLanding();

    fireEvent.click(screen.getByRole("button", { name: "Menyuni ochish" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("LiveOn menyusi")).toBeInTheDocument();

    const howButton = within(dialog).getByRole("button", {
      name: "Dasturlar",
    });
    expect(howButton).toBeInTheDocument();

    fireEvent.click(howButton);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("toggles the persisted root theme from the landing header", () => {
    const analyticsListener = vi.fn();
    window.addEventListener("liveon:analytics", analyticsListener);

    renderLanding();

    fireEvent.click(screen.getAllByRole("button", { name: "Dark theme" })[0]);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(analyticsListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          event: "theme_changed",
          payload: { theme: "dark" },
          source: "landing",
        }),
      }),
    );

    window.removeEventListener("liveon:analytics", analyticsListener);
  });

  it("keeps the primary CTA routing and analytics event behavior", () => {
    const analyticsListener = vi.fn();
    window.addEventListener("liveon:analytics", analyticsListener);

    renderLanding();

    const heroSection = screen
      .getByRole("heading", { level: 1, name: /Ozish va mashg'ulot rejangizni/i })
      .closest("section");

    fireEvent.click(
      within(heroSection).getByRole("button", { name: /Bepul boshlash/i }),
    );

    expect(screen.getByText("sign-up destination")).toBeInTheDocument();
    expect(analyticsListener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          event: "hero_cta_clicked",
          source: "landing",
        }),
      }),
    );

    window.removeEventListener("liveon:analytics", analyticsListener);
  });

  it("emits FAQ, SoftwareApplication, and Organization structured data", () => {
    renderLanding();

    const schemas = map(Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ), (script) => JSON.parse(script.textContent || "{}"));
    const graphTypes = schemas.flatMap((schema) =>
      isArray(schema["@graph"])
        ? map(schema["@graph"], (entry) => entry["@type"])
        : [schema["@type"]],
    );

    expect(graphTypes).toEqual(
      expect.arrayContaining(["FAQPage", "SoftwareApplication", "Organization"]),
    );
  });

  it("keeps Uzbek and English free pricing out of ruble currency", () => {
    expect(uz.landing.pricing.free.price).not.toContain("₽");
    expect(en.landing.pricing.free.price).not.toContain("₽");
    expect(ru.landing.pricing.free.price).toContain("₽");
  });
});
