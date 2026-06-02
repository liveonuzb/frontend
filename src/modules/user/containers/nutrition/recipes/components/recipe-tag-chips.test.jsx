import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecipeTagChips from "./recipe-tag-chips.jsx";

describe("RecipeTagChips", () => {
  it("switches dietary tag filters from horizontal chips", () => {
    const onChange = vi.fn();

    render(
      <RecipeTagChips
        value=""
        tags={["high-protein", "quick"]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "high protein" }));
    fireEvent.click(screen.getByRole("button", { name: "Barcha teglar" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "high-protein");
    expect(onChange).toHaveBeenNthCalledWith(2, "");
  });
});
