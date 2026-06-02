import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RecipeStepList from "./recipe-step-list.jsx";

describe("RecipeStepList", () => {
  it("renders step number, title, body, timer, and optional media", () => {
    render(
      <RecipeStepList
        instructions={[
          {
            id: 1,
            stepNumber: 2,
            title: "Qovurish",
            body: "Sabzini yumshaguncha qovuring.",
            durationMinutes: 8,
            mediaUrl: "https://cdn.liveon.test/recipe-step.webp",
          },
        ]}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Qovurish")).toBeInTheDocument();
    expect(
      screen.getByText("Sabzini yumshaguncha qovuring."),
    ).toBeInTheDocument();
    expect(screen.getByText("8 daq")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Qovurish rasmi" })).toHaveAttribute(
      "src",
      "https://cdn.liveon.test/recipe-step.webp",
    );
  });
});
