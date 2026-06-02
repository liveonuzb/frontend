import React from "react";
import i18n from "@/lib/i18n";

i18n.changeLanguage("uz");
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecipeCategoryChips from "./recipe-category-chips.jsx";

describe("RecipeCategoryChips", () => {
  it("switches category filters from horizontal chips", () => {
    const onChange = vi.fn();

    render(
      <RecipeCategoryChips
        value=""
        categories={[
          { id: 2, label: "Tushlik" },
          { id: 3, label: "Kechki" },
        ]}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tushlik" }));
    fireEvent.click(screen.getByRole("button", { name: "Barchasi" }));

    expect(onChange).toHaveBeenNthCalledWith(1, "2");
    expect(onChange).toHaveBeenNthCalledWith(2, "");
  });
});
