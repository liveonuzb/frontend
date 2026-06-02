import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecipeSearchBar from "./recipe-search-bar.jsx";

describe("RecipeSearchBar", () => {
  it("emits search text changes from the recipe search input", () => {
    const onChange = vi.fn();

    render(<RecipeSearchBar value="" onChange={onChange} />);

    const input = screen.getByLabelText("Retsept qidirish");
    expect(input).toHaveAttribute("placeholder", "Retsept qidirish");

    fireEvent.change(input, { target: { value: "palov" } });

    expect(onChange).toHaveBeenCalledWith("palov");
  });
});
