import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GiftPremiumDrawer from "./gift-premium-drawer.jsx";

const { mutateAsyncMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/api", () => ({
  usePostQuery: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: (props) => <textarea {...props} />,
}));

vi.mock("@/components/option-drawer-picker", () => ({
  default: ({ onChange, onOptionChange }) => (
    <button
      type="button"
      onClick={() => {
        onChange("premium");
        onOptionChange({
          slug: "premium",
          name: "Premium",
          type: "INDIVIDUAL",
          price: 0,
          durationDays: 30,
        });
      }}
    >
      Premium plan tanlash
    </button>
  ),
}));

vi.mock("./form-drawer-shell.jsx", () => ({
  default: ({ children, footer, open }) =>
    open ? (
      <div>
        {children}
        <div>{footer}</div>
      </div>
    ) : null,
}));

const user = {
  id: "user-1",
  firstName: "Ali",
  lastName: "Valiyev",
  email: "ali@example.com",
};

describe("GiftPremiumDrawer", () => {
  beforeEach(() => {
    mutateAsyncMock.mockReset();
    mutateAsyncMock.mockResolvedValue({});
  });

  it("sends premium gift payload without AI bonus fields", async () => {
    render(
      <GiftPremiumDrawer user={user} open onOpenChange={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Premium plan tanlash" }));
    fireEvent.click(screen.getByRole("button", { name: /Sovg'a qilish/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        url: "/admin/users/user-1/gift-premium",
        attributes: expect.objectContaining({
          planSlug: "premium",
        }),
      });
      expect(mutateAsyncMock.mock.calls[0][0].attributes).not.toHaveProperty(
        "aiCredits",
      );
    });
  });

  it("sends optional note and days with premium gift", async () => {
    render(
      <GiftPremiumDrawer user={user} open onOpenChange={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Premium plan tanlash" }));
    fireEvent.change(screen.getByLabelText("Kunlar soni (ixtiyoriy)"), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByLabelText("Izoh (ixtiyoriy)"), {
      target: { value: "Welcome" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sovg'a qilish/i }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        url: "/admin/users/user-1/gift-premium",
        attributes: expect.objectContaining({
          planSlug: "premium",
          days: 45,
          note: "Welcome",
        }),
      });
    });
  });
});
