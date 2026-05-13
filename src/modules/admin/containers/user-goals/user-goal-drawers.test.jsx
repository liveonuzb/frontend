import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import TranslationPage from "./translation/index.jsx";

const mockNavigate = vi.fn();
const mockPostMutateAsync = vi.fn();
const mockPatchMutateAsync = vi.fn();
let mockRouteParams = { id: "7" };

const goalFixture = {
  id: 7,
  key: "strength",
  name: "Strength",
  description: "Build strength",
  imageUrl: "https://cdn.liveon.uz/goals/strength.png",
  goalType: "other",
  calculationMode: "maintain",
  translations: {
    uz: "Kuch",
  },
  descriptionTranslations: {
    uz: "Kuchni oshirish",
  },
};
const goalResponse = {
  data: {
    data: goalFixture,
  },
  isLoading: false,
};
const languagesResponse = {
  data: {
    data: {
      data: [
        { code: "uz", name: "O'zbekcha", flag: "🇺🇿", isActive: true },
        { code: "ru", name: "Русский", flag: "🇷🇺", isActive: true },
      ],
    },
  },
  isLoading: false,
};
const emptyResponse = { data: null, isLoading: false };

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/admin/user-goals/create", search: "" }),
  useParams: () => mockRouteParams,
  useBlocker: () => ({
    state: "unblocked",
    proceed: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/store", () => ({
  useLanguageStore: (selector) =>
    selector({
      currentLanguage: "uz",
    }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: ({ url }) => {
    if (url === "/admin/user-goals/7") {
      return goalResponse;
    }

    if (url === "/admin/languages") {
      return languagesResponse;
    }

    return emptyResponse;
  },
  usePostQuery: () => ({
    mutateAsync: mockPostMutateAsync,
    isPending: false,
  }),
  usePatchQuery: () => ({
    mutateAsync: mockPatchMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }) => <div>{children}</div>,
  DrawerBody: ({ children }) => <div>{children}</div>,
  DrawerContent: ({ children }) => <section>{children}</section>,
  DrawerDescription: ({ children }) => <p>{children}</p>,
  DrawerFooter: ({ children }) => <footer>{children}</footer>,
  DrawerHeader: ({ children }) => <header>{children}</header>,
  DrawerTitle: ({ children }) => <h2>{children}</h2>,
}));

vi.mock("@/components/option-drawer-picker", () => ({
  default: ({ title, value, onChange, options = [] }) => (
    <select
      aria-label={title}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("./components/user-goal-image-picker.jsx", () => ({
  default: ({ value, onChange }) => (
    <input
      aria-label="Rasm"
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const changeInput = (container, name, value) => {
  const input = container.querySelector(`[name="${name}"]`);
  expect(input).toBeTruthy();
  fireEvent.change(input, { target: { value } });
};

describe("admin user goal route drawers", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPostMutateAsync.mockResolvedValue({ data: { message: "ok" } });
    mockPatchMutateAsync.mockResolvedValue({ data: { message: "ok" } });
    mockPostMutateAsync.mockClear();
    mockPatchMutateAsync.mockClear();
    mockRouteParams = { id: "7" };
  });

  it("creates a user goal with current-language translations", async () => {
    mockRouteParams = {};
    const { container } = render(<CreatePage />);

    expect(screen.getByText("Yangi maqsad")).toBeInTheDocument();

    changeInput(container, "name", "Moslashuvchanlik");
    changeInput(container, "description", "Harakat diapazonini oshirish");
    changeInput(container, "key", "mobility");

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mockPostMutateAsync).toHaveBeenCalledWith({
        url: "/admin/user-goals",
        attributes: expect.objectContaining({
          name: "Moslashuvchanlik",
          description: "Harakat diapazonini oshirish",
          imageUrl: "",
          goalType: "other",
          calculationMode: "maintain",
          key: "mobility",
          translations: {
            uz: "Moslashuvchanlik",
          },
          descriptionTranslations: {
            uz: "Harakat diapazonini oshirish",
          },
        }),
      });
    });
  });

  it("edits a user goal through the route drawer", async () => {
    const { container } = render(<EditPage />);

    expect(screen.getByText("Maqsadni tahrirlash")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector('[name="name"]')).toHaveValue("Kuch");
    });

    changeInput(container, "name", "Kuchli bo'lish");
    changeInput(container, "description", "Mushak kuchini oshirish");

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith({
        url: "/admin/user-goals/7",
        attributes: expect.objectContaining({
          name: "Kuchli bo'lish",
          description: "Mushak kuchini oshirish",
          translations: {
            uz: "Kuchli bo'lish",
          },
          descriptionTranslations: {
            uz: "Mushak kuchini oshirish",
          },
        }),
      });
    });
  });

  it("updates user goal translations from the translation drawer", async () => {
    const { container } = render(<TranslationPage />);

    expect(screen.getByText("Tarjimalar")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector('[name="uz.name"]')).toHaveValue("Kuch");
    });

    changeInput(container, "ru.name", "Сила");
    changeInput(container, "ru.description", "Развитие силы");

    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith({
        url: "/admin/user-goals/7",
        attributes: {
          name: "Kuch",
          description: "Kuchni oshirish",
          translations: {
            uz: "Kuch",
            ru: "Сила",
          },
          descriptionTranslations: {
            uz: "Kuchni oshirish",
            ru: "Развитие силы",
          },
        },
      });
    });
  });
});
