import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  FooterSlot,
  OnboardingFooterProvider,
  useOnboardingFooter,
} from "./onboarding-footer-context";

const InlineFooterProducer = () => {
  const [count, setCount] = React.useState(0);

  useOnboardingFooter(
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Continue {count}
    </button>,
  );

  return <p>Body {count}</p>;
};

describe("onboarding footer context", () => {
  it("renders inline footer content without triggering an update loop", async () => {
    render(
      <OnboardingFooterProvider>
        <InlineFooterProducer />
        <FooterSlot />
      </OnboardingFooterProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue 0" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Continue 0" }));

    await waitFor(() => {
      expect(screen.getByText("Body 1")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Continue 1" })).toBeTruthy();
    });
  });
});
