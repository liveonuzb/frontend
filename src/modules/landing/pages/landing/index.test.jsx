import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LandingLayout from "@/modules/landing/layout";
import LandingPage from ".";
import en from "@/modules/landing/lib/locales/en.json";
import ru from "@/modules/landing/lib/locales/ru.json";
import uz from "@/modules/landing/lib/locales/uz.json";

const localeMap = { en, ru, uz };
const setCurrentLanguageMock = vi.hoisted(() => vi.fn());

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const createMotionComponent =
    (Tag) =>
    React.forwardRef(function MotionComponent(
      { children, whileHover, whileInView, initial, animate, transition, viewport, ...props },
      ref,
    ) {
      return (
        <Tag ref={ref} {...props}>
          {children}
        </Tag>
      );
    });

  return {
    motion: {
      article: createMotionComponent("article"),
      div: createMotionComponent("div"),
      section: createMotionComponent("section"),
    },
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
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe("landing page", () => {
  beforeEach(() => {
    setCurrentLanguageMock.mockClear();
    document.head.innerHTML = "";
    document.documentElement.className = "";
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

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).not.toContain("#");
  });

  it("keeps the desktop landing header compact", () => {
    renderLanding();

    expect(screen.getByRole("banner").className).toContain("py-2");
    expect(screen.getByRole("link", { name: "LiveOn" }).className).toContain("min-h-9");
    expect(screen.getByRole("button", { name: "Qanday ishlaydi" }).className).toContain(
      "whitespace-nowrap",
    );
  });

  it("emits FAQ, SoftwareApplication, and Organization structured data", () => {
    renderLanding();

    const schemas = Array.from(
      document.head.querySelectorAll('script[type="application/ld+json"]'),
    ).map((script) => JSON.parse(script.textContent || "{}"));
    const graphTypes = schemas.flatMap((schema) =>
      Array.isArray(schema["@graph"])
        ? schema["@graph"].map((entry) => entry["@type"])
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
