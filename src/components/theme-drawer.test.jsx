import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThemeDrawer from "./theme-drawer.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) =>
      ({
        "profile.appearance.drawerTitle": "Mavzuni tanlang",
        "profile.appearance.drawerDescription": "Ko'rinishni tanlang.",
        "profile.appearance.theme.light": "Yorug'",
        "profile.appearance.theme.lightDesc": "Kun uchun",
        "profile.appearance.theme.dark": "Qorong'u",
        "profile.appearance.theme.darkDesc": "Tun uchun",
        "common.apply": "Apply",
      })[key] ?? key,
  }),
}));

describe("ThemeDrawer", () => {
  beforeEach(() => {
    const store = new Map();
    const localStorageMock = {
      clear: vi.fn(() => store.clear()),
      getItem: vi.fn((key) => store.get(key) ?? null),
      removeItem: vi.fn((key) => store.delete(key)),
      setItem: vi.fn((key, value) => store.set(key, String(value))),
    };

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });

    document.documentElement.classList.remove("dark");
    localStorage.clear();
    localStorage.setItem("theme", "light");
  });

  it("opens as a selectable drawer and applies the selected theme only after apply", () => {
    const onOpenChange = vi.fn();

    render(<ThemeDrawer open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Qorong'u/i }));

    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
