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
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

let authState = {
  roles: ["USER"],
  logout: mockFns.logout,
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

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }) => <>{children}</>,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogCancel: ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/hooks/api/use-api", () => ({
  default: () => ({
    request: {
      delete: mockFns.deleteRequest,
    },
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
    };
  });

  it("requires exact DELETE before allowing account deletion", async () => {
    mockFns.deleteRequest.mockResolvedValue({});

    render(<AccountDangerZone />);

    expect(screen.getByText("Danger zone")).toBeInTheDocument();

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
    };

    render(<AccountDangerZone />);

    expect(screen.queryByText("Danger zone")).not.toBeInTheDocument();
  });
});
