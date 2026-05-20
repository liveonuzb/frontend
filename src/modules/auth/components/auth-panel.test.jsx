import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthHeader } from "./auth-panel.jsx";

describe("AuthHeader", () => {
  it("renders title and description", () => {
    render(
      <AuthHeader
        title="Kod tasdiqlash"
        description="+998901234567 raqamiga kod yuborildi"
      />,
    );

    expect(screen.getByRole("heading", { name: "Kod tasdiqlash" })).toBeInTheDocument();
    expect(
      screen.getByText("+998901234567 raqamiga kod yuborildi"),
    ).toBeInTheDocument();
  });
});
