import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
} from "@/modules/user-onboarding/lib/onboarding-footer-context";
import { useOnboardingStore } from "@/store";
import NameStep from ".";

const navigateMock = vi.hoisted(() => vi.fn());

const translations = {
  "onboarding.next": "Keyingi",
  "onboarding.name.question": "Ismingiz nima?",
  "onboarding.name.firstNamePlaceholder": "Ism",
  "onboarding.name.firstNameRequired": "Ism majburiy",
  "onboarding.illustrationAlt": "Onboarding rasmi",
};

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  useTranslation: () => ({
    t: (key) => translations[key] ?? key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/modules/user-onboarding/lib/use-auto-save", () => ({
  useOnboardingAutoSave: vi.fn(),
}));

const renderNameStep = () =>
  render(
    <OnboardingFooterProvider>
      <NameStep />
      <FooterSlot />
    </OnboardingFooterProvider>,
  );

describe("NameStep onboarding step", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    useOnboardingStore.getState().reset();
  });

  it("renders without crashing and validates blank names", async () => {
    renderNameStep();

    fireEvent.click(screen.getByRole("button", { name: /Keyingi/ }));

    expect(await screen.findByText("Ism majburiy")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("trims the submitted name before continuing", async () => {
    renderNameStep();

    fireEvent.change(screen.getByPlaceholderText("Ism"), {
      target: { value: "  Ali  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Keyingi/ }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/user/onboarding/gender");
    });
    expect(useOnboardingStore.getState().firstName).toBe("Ali");
  });
});
