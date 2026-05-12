import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingQuestion } from "./onboarding-question.jsx";

describe("OnboardingQuestion", () => {
  it("uses the shared compact heading rhythm for onboarding prompts", () => {
    render(<OnboardingQuestion question="Maqsadingiz nima?" />);

    const heading = screen.getByRole("heading", {
      name: "Maqsadingiz nima?",
    });

    expect(heading).toHaveClass("text-2xl");
    expect(heading).toHaveClass("md:text-3xl");
    expect(heading).toHaveClass("font-black");
    expect(heading.parentElement).toHaveClass("mb-4");
    expect(heading.parentElement).toHaveClass("md:mb-5");
  });
});
