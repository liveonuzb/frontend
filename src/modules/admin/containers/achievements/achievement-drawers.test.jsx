import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreateAchievementPage from "./create/index.jsx";
import EditAchievementPage from "./edit/index.jsx";
import TranslateAchievement from "./translation/index.jsx";

const mockNavigate = vi.fn();
const mockPostMutateAsync = vi.fn();
const mockPatchMutateAsync = vi.fn();
let mockRouteParams = { id: "11" };

const achievementFixture = {
  id: 11,
  key: "first_meal",
  name: "First meal",
  description: "Log first meal",
  translations: {
    uz: "Birinchi taom",
  },
  descriptionTranslations: {
    uz: "Birinchi taomni kiriting",
  },
  imageMadagascarUrl: "https://cdn.liveon.uz/achievements/meal.png",
  imageZenUrl: "",
  imageFocusUrl: "",
  category: "NUTRITION",
  metric: "MEAL_LOG",
  threshold: 1,
  xpReward: 10,
  isActive: true,
};

const achievementResponse = {
  data: {
    data: achievementFixture,
  },
  isLoading: false,
};
const languagesResponse = {
  data: {
    data: {
      data: [
        { code: "uz", name: "O'zbekcha", flag: "UZ", isActive: true },
        { code: "ru", name: "Русский", flag: "RU", isActive: true },
      ],
    },
  },
  isLoading: false,
};
const emptyResponse = { data: null, isLoading: false };

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/admin/achievements/create", search: "" }),
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
  useAppModeStore: (selector) => selector({ mode: "madagascar" }),
  useLanguageStore: (selector) => selector({ currentLanguage: "uz" }),
}));

vi.mock("@/hooks/api", () => ({
  useGetQuery: ({ url }) => {
    if (url === "/admin/achievements/11") {
      return achievementResponse;
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

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }) => (
    <input
      aria-label="Status"
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));

vi.mock("./components/AchievementImagePicker", () => ({
  default: ({ label = "Achievement image", value, onChange }) => (
    <input
      aria-label={label}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const changeField = (container, name, value) => {
  const field = container.querySelector(`[name="${name}"]`);
  expect(field).toBeTruthy();
  fireEvent.change(field, { target: { value } });
};

describe("admin achievement route drawers", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPostMutateAsync.mockResolvedValue({ data: { data: { message: "ok" } } });
    mockPatchMutateAsync.mockResolvedValue({ data: { data: { message: "ok" } } });
    mockPostMutateAsync.mockClear();
    mockPatchMutateAsync.mockClear();
    mockRouteParams = { id: "11" };
  });

  it("creates an achievement with current-language translations and mode image", async () => {
    mockRouteParams = {};
    const { container } = render(<CreateAchievementPage />);

    expect(screen.getByText("Yangi achievement")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Madagascar rasmi/i), {
      target: {
        value: "https://cdn.liveon.uz/achievements/new.png",
      },
    });
    changeField(container, "name", "Birinchi suv");
    changeField(container, "description", "Birinchi suvni kiriting");
    changeField(container, "threshold", "2");
    changeField(container, "xpReward", "15");

    fireEvent.click(screen.getByRole("button", { name: /Yaratish/i }));

    await waitFor(() => {
      expect(mockPostMutateAsync).toHaveBeenCalledWith(
        {
          url: "/admin/achievements",
          attributes: expect.objectContaining({
            name: "Birinchi suv",
            description: "Birinchi suvni kiriting",
            translations: {
              uz: "Birinchi suv",
            },
            descriptionTranslations: {
              uz: "Birinchi suvni kiriting",
            },
            imageMadagascarUrl: "https://cdn.liveon.uz/achievements/new.png",
            category: "NUTRITION",
            metric: "MEAL_LOG",
            threshold: 2,
            xpReward: 15,
            isActive: true,
          }),
        },
        expect.any(Object),
      );
    });
  });

  it("edits an achievement through the route drawer", async () => {
    const { container } = render(<EditAchievementPage />);

    expect(screen.getByText("Achievementni tahrirlash")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector('[name="name"]')).toHaveValue(
        "Birinchi taom",
      );
    });

    changeField(container, "name", "Birinchi mashq");
    changeField(container, "description", "Birinchi mashqni yakunlang");

    fireEvent.click(screen.getByRole("button", { name: /Saqlash/i }));

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith(
        {
          url: "/admin/achievements/11",
          attributes: expect.objectContaining({
            name: "Birinchi mashq",
            description: "Birinchi mashqni yakunlang",
            translations: {
              uz: "Birinchi mashq",
            },
            descriptionTranslations: {
              uz: "Birinchi mashqni yakunlang",
            },
          }),
        },
        expect.any(Object),
      );
    });
  });

  it("updates achievement translations from the translation drawer", async () => {
    const { container } = render(<TranslateAchievement />);

    expect(screen.getByText("Tarjima qo'shish")).toBeInTheDocument();

    await waitFor(() => {
      expect(container.querySelector('[name="uz.name"]')).toHaveValue(
        "Birinchi taom",
      );
    });

    changeField(container, "ru.name", "Первое блюдо");
    changeField(container, "ru.description", "Добавьте первое блюдо");

    fireEvent.click(
      screen.getByRole("button", { name: /Tarjimalarni saqlash/i }),
    );

    await waitFor(() => {
      expect(mockPatchMutateAsync).toHaveBeenCalledWith(
        {
          url: "/admin/achievements/11",
          attributes: {
            translations: {
              uz: "Birinchi taom",
              ru: "Первое блюдо",
            },
            descriptionTranslations: {
              uz: "Birinchi taomni kiriting",
              ru: "Добавьте первое блюдо",
            },
          },
        },
        expect.any(Object),
      );
    });
  });
});
