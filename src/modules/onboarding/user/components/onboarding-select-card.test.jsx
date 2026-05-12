import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CircleIcon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ONBOARDING_ACCENTS } from "../lib/tones.js";
import OnboardingSelectCard from "./onboarding-select-card.jsx";

describe("OnboardingSelectCard", () => {
  it("renders row cards with pressed state and selected indicator", () => {
    render(
      <OnboardingSelectCard
        active
        badge="3"
        description="Three meals per day"
        selectionMode="single"
        title="3 meals"
        tone={ONBOARDING_ACCENTS.green}
      />,
    );

    const card = screen.getByRole("button", { name: /3 meals/i });

    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Three meals per day")).toBeInTheDocument();
  });

  it("renders image cards with fallback-safe image attributes", () => {
    render(
      <OnboardingSelectCard
        imageAlt="Goal preview"
        imageUrl="/goal.png"
        title="Lose weight"
        tone={ONBOARDING_ACCENTS.rose}
        variant="image"
      />,
    );

    expect(screen.getByRole("img", { name: "Goal preview" })).toHaveAttribute(
      "src",
      "/goal.png",
    );
  });

  it("supports contain-fit images for full portrait cards", () => {
    render(
      <OnboardingSelectCard
        imageAlt="Gender preview"
        imageFit="contain"
        imageUrl="/gender.png"
        title="Female"
        tone={ONBOARDING_ACCENTS.rose}
        variant="image"
      />,
    );

    expect(screen.getByRole("img", { name: "Gender preview" })).toHaveClass(
      "object-contain",
    );
  });

  it("renders compact multi-select cards with an inactive indicator", () => {
    render(
      <OnboardingSelectCard
        icon={CircleIcon}
        selectionMode="multi"
        title="Peanut"
        tone={ONBOARDING_ACCENTS.amber}
        variant="compact"
      />,
    );

    const card = screen.getByRole("button", { name: /Peanut/i });

    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(card.querySelector(".rounded-full")).toBeTruthy();
  });

  it("fires click handlers from drawer variant cards", () => {
    const onClick = vi.fn();

    render(
      <OnboardingSelectCard
        metaBadge="Catalog"
        onClick={onClick}
        title="Kettlebell"
        tone={ONBOARDING_ACCENTS.green}
        variant="drawer"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Kettlebell/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Catalog")).toBeInTheDocument();
  });

  it("keeps visible focus ring styles on every card variant", () => {
    const variants = ["row", "image", "compact", "drawer"];

    variants.forEach((variant) => {
      const { unmount } = render(
        <OnboardingSelectCard
          title={`${variant} option`}
          tone={ONBOARDING_ACCENTS.green}
          variant={variant}
        />,
      );

      expect(
        screen.getByRole("button", { name: `${variant} option` }),
      ).toHaveClass("focus-visible:ring-2");

      unmount();
    });
  });

  it("uses native disabled semantics when disabled", () => {
    render(
      <OnboardingSelectCard
        disabled
        onClick={vi.fn()}
        title="Unavailable option"
        tone={ONBOARDING_ACCENTS.green}
      />,
    );

    expect(screen.getByRole("button", { name: /Unavailable option/i })).toBeDisabled();
  });
});
