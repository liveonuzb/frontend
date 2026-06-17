import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PremiumTab } from "./premium-tab.jsx";

const usePremiumMock = vi.hoisted(() => vi.fn());
const requestPatchMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());

vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: () => {},
  },
  useTranslation: () => ({
    t: (key, options = {}) => {
      const labels = {
        "common.locale": "uz-UZ",
        "profile.general.cancel": "Bekor qilish",
        "profile.premium.activate": "Premium olish",
        "profile.premium.checkoutSubtitle": "Reja va to'lov usulini tasdiqlang.",
        "profile.premium.checkoutTitle": "Premium checkout",
        "profile.premium.currency": "so'm",
        "profile.premium.current": "Joriy",
        "profile.premium.currentStatus": "Joriy holat",
        "profile.premium.expires": "Amal qilish muddati",
        "profile.premium.freePlan": "Tekin reja",
        "profile.premium.goToPayment": "To'lovga o'tish",
        "profile.premium.historyDescription": "Premium obuna davrlari va holatlari.",
        "profile.premium.historyEmpty": "Obunalar tarixi hali yo'q.",
        "profile.premium.historyTitle": "Obunalar tarixi",
        "profile.premium.invoicesDescription": "To'lovlar va invoice yozuvlari.",
        "profile.premium.invoicesEmpty": "Invoice yozuvlari hali yo'q.",
        "profile.premium.invoicesTitle": "Invoices",
        "profile.premium.notActive": "Premium yoqilmagan",
        "profile.premium.payment.multiCard": "Multi Card",
        "profile.premium.payment.multiCardDesc": "Multi Card orqali xavfsiz to'lov",
        "profile.premium.paymentMethod": "To'lov usuli",
        "profile.premium.planSelectorDescription": "Tarifni tanlang va to'lovga o'ting.",
        "profile.premium.planSelectorTitle": "Sizga mos tarifni tanlang",
        "profile.premium.planUi.bestValue": "Eng foydali",
        "profile.premium.planUi.perMonth": "oyiga",
        "profile.premium.planUi.saving": "tejaysiz",
        "profile.premium.premiumPayment": "Premium to'lov",
        "profile.premium.premiumPlan": "Premium reja",
        "profile.premium.selected": "Tanlandi",
        "profile.premium.selectedPlan": "Tanlangan reja",
        "profile.premium.status.active": "Faol",
        "profile.premium.status.cancelled": "Bekor qilingan",
        "profile.premium.status.expired": "Tugagan",
        "profile.premium.status.free": "Tekin",
        "profile.premium.title": "Premium",
        "profile.premium.unlimited": "Cheksiz",
        "profile.tabs.premium": "Premium",
      };

      if (key === "profile.premium.planUi.duration") {
        return `${options.count} kun`;
      }

      return labels[key] ?? options.defaultValue ?? key;
    },
  }),
}));

vi.mock("@/modules/user/components/gift-premium-drawer.jsx", () => ({
  default: () => null,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: invalidateQueriesMock,
  }),
}));

vi.mock("@/hooks/api/use-api", () => ({
  default: () => ({
    request: {
      patch: requestPatchMock,
    },
  }),
}));

vi.mock("@/hooks/app/use-premium", () => ({
  default: () => usePremiumMock(),
}));

vi.mock("@/lib/analytics.js", () => ({
  trackLaunchEvent: vi.fn(),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children, open }) => (open ? <div>{children}</div> : null),
  DrawerBody: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerDescription: ({ children, ...props }) => <p {...props}>{children}</p>,
  DrawerFooter: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  DrawerTitle: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
}));

const premiumState = {
  premium: {
    planCode: "monthly",
    planName: "Premium Monthly",
    status: "active",
    endDate: "2026-07-01",
    autoRenew: true,
  },
  plans: [
    {
      code: "monthly",
      name: "Premium Monthly",
      period: "1 oy",
      price: 49000,
      durationDays: 30,
    },
  ],
  history: [
    {
      id: "history-1",
      planName: "Premium Monthly",
      startDate: "2026-06-01",
      endDate: "2026-07-01",
      status: "active",
    },
  ],
  recentPayments: [
    {
      id: "payment-1",
      planName: "Premium Monthly",
      date: "2026-06-01T10:00:00.000Z",
      amount: 49000,
      method: "MULTI",
    },
  ],
  startPremiumCheckout: vi.fn(),
  cancelPremium: vi.fn(),
  isLoading: false,
  isPreparingCheckout: false,
  isActivating: false,
  isCancelling: false,
  isFinalizingCheckout: false,
};

const LocationProbe = () => {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
};

const renderPremiumTab = (initialEntry = "/user/dashboard/profile/premium") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <PremiumTab />
      <LocationProbe />
    </MemoryRouter>,
  );

describe("PremiumTab", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("focuses the premium UI on plans and separate billing drawers", () => {
    usePremiumMock.mockReturnValue(premiumState);

    renderPremiumTab();

    expect(screen.getByText("Sizga mos tarifni tanlang")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Invoices/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Obunalar tarixi/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tariflarni solishtirish")).not.toBeInTheDocument();
    expect(screen.queryByText("Oilaviy plan")).not.toBeInTheDocument();
    expect(screen.queryByText("Sovg'a qilish")).not.toBeInTheDocument();
  });

  it("opens invoices through the premium drawer route", async () => {
    usePremiumMock.mockReturnValue(premiumState);

    renderPremiumTab();

    fireEvent.click(screen.getByRole("button", { name: /Invoices/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/user/dashboard/profile/premium/invoices",
      );
    });
    expect(screen.getByRole("heading", { name: "Invoices" })).toBeInTheDocument();
    expect(screen.getAllByText("Premium Monthly").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/49\s*000/).length).toBeGreaterThan(0);
  });

  it("renders subscription history from a direct drawer route", () => {
    usePremiumMock.mockReturnValue(premiumState);

    renderPremiumTab("/user/dashboard/profile/premium/history");

    expect(screen.getByRole("heading", { name: "Obunalar tarixi" })).toBeInTheDocument();
    expect(screen.getByText("2026-06-01 - 2026-07-01")).toBeInTheDocument();
  });
});
