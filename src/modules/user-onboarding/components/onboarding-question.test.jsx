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

    expect(heading).toHaveClass("text-xl");
    expect(heading).toHaveClass("md:text-2xl");
    expect(heading).toHaveClass("font-black");
    expect(heading.parentElement).toHaveClass("mb-4");
    expect(heading.parentElement).toHaveClass("md:mb-5");
  });

  it("can render concise helper copy tied to the prompt", () => {
    render(
      <OnboardingQuestion
        question="Bo'yingiz qancha?"
        description="Mos reja hisoblash uchun kerak."
        className="mb-2"
      />,
    );

    const heading = screen.getByRole("heading", {
      name: "Bo'yingiz qancha?",
    });
    const description = screen.getByText("Mos reja hisoblash uchun kerak.");

    expect(heading).toHaveAttribute("aria-describedby");
    expect(description).toHaveAttribute(
      "id",
      heading.getAttribute("aria-describedby"),
    );
    expect(description).toHaveClass("text-sm");
    expect(heading.parentElement).toHaveClass("mb-2");
  });
});
