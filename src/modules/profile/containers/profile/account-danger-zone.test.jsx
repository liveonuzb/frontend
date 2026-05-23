import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountDangerZone } from "./account-danger-zone.jsx";

const mockFns = vi.hoisted(() => ({
  navigate: vi.fn(),
  clear: vi.fn(),
  closeProfile: vi.fn(),
  logout: vi.fn(),
  deleteRequest: vi.fn(),
  logoutRequest: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

let authState = {
  roles: ["USER"],
  logout: mockFns.logout,
  refreshToken: "refresh-token-1",
};

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockFns.navigate,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    clear: mockFns.clear,
  }),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerBody: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerFooter: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

vi.mock("@/hooks/api/use-api", () => ({
  default: () => ({
    request: {
      delete: mockFns.deleteRequest,
    },
  }),
}));

vi.mock("@/hooks/api", () => ({
  usePostQuery: () => ({
    mutateAsync: mockFns.logoutRequest,
    isPending: false,
  }),
}));

vi.mock("@/hooks/app/use-profile-settings", () => ({
  getRequestErrorMessage: (_error, fallback) => fallback,
}));

vi.mock("@/modules/profile/hooks/use-profile-overlay", () => ({
  useProfileOverlay: () => ({
    closeProfile: mockFns.closeProfile,
  }),
}));

vi.mock("@/store", () => ({
  useAuthStore: (selector) => selector(authState),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockFns.toastSuccess,
    error: mockFns.toastError,
  },
}));

describe("AccountDangerZone", () => {
  afterEach(() => {
    vi.clearAllMocks();
    authState = {
      roles: ["USER"],
      logout: mockFns.logout,
      refreshToken: "refresh-token-1",
    };
  });

  it("renders logout and delete account as matching action rows", () => {
    render(<AccountDangerZone />);

    expect(
      screen.getByRole("button", { name: /Tizimdan chiqish/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hisobni o'chirish/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Tizimdan chiqiladi/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/barcha ma'lumotlar butunlay/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Danger zone")).not.toBeInTheDocument();
  });

  it("logs out from the profile action row", async () => {
    mockFns.logoutRequest.mockResolvedValue({});

    render(<AccountDangerZone />);

    fireEvent.click(screen.getByRole("button", { name: /Tizimdan chiqish/i }));

    await waitFor(() => {
      expect(mockFns.logoutRequest).toHaveBeenCalledWith({
        url: "/auth/logout",
        attributes: { refreshToken: "refresh-token-1" },
      });
    });
    expect(mockFns.logout).toHaveBeenCalledTimes(1);
    expect(mockFns.clear).toHaveBeenCalledTimes(1);
    expect(mockFns.navigate).toHaveBeenCalledWith("/auth/sign-in", {
      replace: true,
    });
  });

  it("opens a bottom drawer and requires exact DELETE before allowing account deletion", async () => {
    mockFns.deleteRequest.mockResolvedValue({});

    render(<AccountDangerZone />);

    fireEvent.click(screen.getByRole("button", { name: /Hisobni o'chirish/i }));

    expect(screen.getByTestId("delete-account-drawer")).toBeInTheDocument();
    expect(
      screen.queryByText(/Hisob va barcha foydalanuvchi ma'lumotlari/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Bekor qilish/i }),
    ).not.toBeInTheDocument();

    const deleteButton = screen.getByRole("button", {
      name: "Hisobni butunlay o'chirish",
    });

    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Tasdiqlash matni"), {
      target: { value: "DELETE" },
    });

    expect(deleteButton).toBeEnabled();

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockFns.deleteRequest).toHaveBeenCalledWith("/users/me", {
        data: {
          confirmationText: "DELETE",
        },
      });
    });

    expect(mockFns.toastSuccess).toHaveBeenCalled();
    expect(mockFns.closeProfile).toHaveBeenCalledTimes(1);
    expect(mockFns.logout).toHaveBeenCalledTimes(1);
    expect(mockFns.clear).toHaveBeenCalledTimes(1);
    expect(mockFns.navigate).toHaveBeenCalledWith("/auth/sign-in", {
      replace: true,
    });
  });

  it("hides the danger zone for super admins", () => {
    authState = {
      roles: ["SUPER_ADMIN"],
      logout: mockFns.logout,
      refreshToken: "refresh-token-1",
    };

    render(<AccountDangerZone />);

    expect(
      screen.queryByRole("button", { name: /Hisobni o'chirish/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tizimdan chiqish/i }),
    ).toBeInTheDocument();
  });
});
