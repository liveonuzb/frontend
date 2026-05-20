import React from "react";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { forEach, toPairs } from "lodash";
import UserOnboardingModule from "./index.jsx";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const pageContainerImports = {
  "activity-level": "@/modules/user-onboarding/containers/activity-level",
  age: "@/modules/user-onboarding/containers/age",
  "current-weight": "@/modules/user-onboarding/containers/current-weight",
  "diet-requirements": "@/modules/user-onboarding/containers/diet-requirements",
  entry: "@/modules/user-onboarding/containers/entry",
  gender: "@/modules/user-onboarding/containers/gender",
  goal: "@/modules/user-onboarding/containers/goal",
  "health-constraints":
    "@/modules/user-onboarding/containers/health-constraints",
  height: "@/modules/user-onboarding/containers/height",
  "meal-frequency": "@/modules/user-onboarding/containers/meal-frequency",
  name: "@/modules/user-onboarding/containers/name",
  personalizing: "@/modules/user-onboarding/containers/personalization-loading",
  report: "@/modules/user-onboarding/containers/report",
  result: "@/modules/user-onboarding/containers/personalization-result",
  review: "@/modules/user-onboarding/containers/review",
  "target-weight": "@/modules/user-onboarding/containers/target-weight",
  "weekly-pace": "@/modules/user-onboarding/containers/weekly-pace",
};
const localOptionContainers = [
  "activity-level",
  "diet-requirements",
  "gender",
  "goal",
  "health-constraints",
  "meal-frequency",
];
const otherDrawerContainers = ["diet-requirements", "health-constraints"];
const numericPickerContainers = [
  "age",
  "current-weight",
  "height",
  "target-weight",
];
const removedUserOnboardingFiles = [
  "components/ai-plan-generation.jsx",
  "components/image-upload-field.jsx",
  "components/onboarding-select-card.jsx",
  "components/onboarding-select-card.test.jsx",
  "components/weight-picker.jsx",
  "containers/combobox-chips-step.jsx",
  "containers/nutrition-select-step.jsx",
  "containers/other-selection-drawer.jsx",
  "lib/use-onboarding-draft.js",
  "lib/use-step-validation.js",
];

vi.mock("@/modules/user-onboarding/layout/index.jsx", async () => {
  const { Outlet } = await vi.importActual("react-router");
  return {
    default: () => (
      <div>
        <span>layout</span>
        <Outlet />
      </div>
    ),
  };
});

vi.mock("@/modules/user-onboarding/pages/entry/index.jsx", () => ({
  default: () => <div>entry-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/name/index.jsx", () => ({
  default: () => <div>name-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/gender/index.jsx", () => ({
  default: () => <div>gender-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/age/index.jsx", () => ({
  default: () => <div>age-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/height/index.jsx", () => ({
  default: () => <div>height-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/current-weight/index.jsx", () => ({
  default: () => <div>current-weight-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/goal/index.jsx", () => ({
  default: () => <div>goal-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/target-weight/index.jsx", () => ({
  default: () => <div>target-weight-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/weekly-pace/index.jsx", () => ({
  default: () => <div>weekly-pace-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/activity-level/index.jsx", () => ({
  default: () => <div>activity-level-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/meal-frequency/index.jsx", () => ({
  default: () => <div>meal-frequency-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/diet-requirements/index.jsx", () => ({
  default: () => <div>diet-requirements-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/health-constraints/index.jsx", () => ({
  default: () => <div>health-constraints-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/review/index.jsx", () => ({
  default: () => <div>review-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/report/index.jsx", () => ({
  default: () => <div>report-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/personalizing/index.jsx", () => ({
  default: () => <div>personalizing-page</div>,
}));
vi.mock("@/modules/user-onboarding/pages/result/index.jsx", () => ({
  default: () => <div>metabolism-result-page</div>,
}));

describe("UserOnboardingModule routes", () => {
  const renderAtPath = (path) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/user/onboarding/*" element={<UserOnboardingModule />} />
        </Routes>
      </MemoryRouter>,
    );

  it("renders active onboarding steps without invalid custom children under Routes", () => {
    renderAtPath("/user/onboarding/name");

    expect(screen.getByText("layout")).toBeInTheDocument();
    expect(screen.getByText("name-page")).toBeInTheDocument();
  });

  it("sends removed onboarding step URLs back to the entry screen", () => {
    renderAtPath("/user/onboarding/allergies");

    expect(screen.getByText("entry-page")).toBeInTheDocument();
    expect(screen.queryByText("diet-requirements-page")).toBeNull();
  });

  it("does not expose the removed other goals route", () => {
    renderAtPath("/user/onboarding/other-goals");

    expect(screen.getByText("entry-page")).toBeInTheDocument();
    expect(screen.queryByText("activity-level-page")).toBeNull();
  });

  it("does not keep legacy post-onboarding route aliases", () => {
    renderAtPath("/user/onboarding/result");

    expect(screen.getByText("entry-page")).toBeInTheDocument();
    expect(screen.queryByText("metabolism-result-page")).toBeNull();
  });

  it("keeps user onboarding routes inside the module index", () => {
    expect(existsSync(resolve(moduleDir, "routes.jsx"))).toBe(false);
  });

  it("keeps the onboarding layout inside the user onboarding module", () => {
    expect(existsSync(resolve(moduleDir, "layout/index.jsx"))).toBe(true);
    expect(
      existsSync(resolve(moduleDir, "../onboarding/layout/index.jsx")),
    ).toBe(false);
  });

  it("removes the old onboarding module directory", () => {
    expect(existsSync(resolve(moduleDir, "../onboarding"))).toBe(false);
  });

  it("declares onboarding step routes explicitly", () => {
    const moduleSource = readFileSync(resolve(moduleDir, "index.jsx"), "utf8");

    expect(moduleSource).not.toContain("map(ONBOARDING_STEPS");
  });

  it("keeps page files as consistent container wrappers", () => {
    forEach(toPairs(pageContainerImports), ([page, containerPath]) => {
      const pageSource = readFileSync(
        resolve(moduleDir, "pages", page, "index.jsx"),
        "utf8",
      );
      const expectedSource = `import React from "react";\nimport Container from "${containerPath}";\n\nconst Index = () => <Container />;\n\nexport default Index;\n`;

      expect(pageSource).toBe(expectedSource);
    });
  });

  it("keeps selectable option UI local to each owning container", () => {
    forEach(localOptionContainers, (container) => {
      const containerDir = resolve(moduleDir, "containers", container);
      const containerSource = readFileSync(
        resolve(containerDir, "index.jsx"),
        "utf8",
      );

      expect(existsSync(resolve(containerDir, "option.jsx"))).toBe(true);
      expect(containerSource).toContain('from "./option.jsx"');
      expect(containerSource).not.toContain(
        "../../components/onboarding-select-card.jsx",
      );
      expect(containerSource).not.toContain("<OnboardingSelectCard");
    });
  });

  it("keeps other-selection drawer UI local to its owning containers", () => {
    forEach(otherDrawerContainers, (container) => {
      const containerDir = resolve(moduleDir, "containers", container);
      const containerSource = readFileSync(
        resolve(containerDir, "index.jsx"),
        "utf8",
      );

      expect(existsSync(resolve(containerDir, "other-drawer.jsx"))).toBe(true);
      expect(containerSource).toContain('from "./other-drawer.jsx"');
      expect(containerSource).not.toContain("../other-selection-drawer.jsx");
    });
  });

  it("removes obsolete user-onboarding files and styles", () => {
    forEach(removedUserOnboardingFiles, (filePath) => {
      expect(existsSync(resolve(moduleDir, filePath))).toBe(false);
    });

    const globalCss = readFileSync(
      resolve(moduleDir, "../../index.css"),
      "utf8",
    );

    expect(globalCss).not.toContain("ai-plan-generation");
  });

  it("loads backend onboarding options through one shared hook pattern", () => {
    const optionsHookPath = resolve(moduleDir, "lib/use-onboarding-options.js");

    expect(existsSync(optionsHookPath)).toBe(true);
    expect(readFileSync(optionsHookPath, "utf8")).toContain("useGetQuery");

    forEach(
      ["diet-requirements", "goal", "health-constraints"],
      (container) => {
        const containerSource = readFileSync(
          resolve(moduleDir, "containers", container, "index.jsx"),
          "utf8",
        );

        expect(containerSource).toContain("useOnboardingOptions");
        expect(containerSource).not.toContain('get(data, "data.data"');
      },
    );
  });

  it("keeps numeric picker steps on the shared overlap-safe layout", () => {
    forEach(numericPickerContainers, (container) => {
      const containerSource = readFileSync(
        resolve(moduleDir, "containers", container, "index.jsx"),
        "utf8",
      );

      expect(containerSource).toContain("ONBOARDING_NUMERIC_PICKER_PAGE_CLASS");
      expect(containerSource).toContain(
        "ONBOARDING_NUMERIC_PICKER_STAGE_CLASS",
      );
      expect(containerSource).toContain(
        "ONBOARDING_NUMERIC_PICKER_TICKER_CLASS",
      );
      expect(containerSource).not.toContain("pr-0");
      expect(containerSource).not.toContain("-mb-6");
    });
  });

  it("keeps reusable weight picker outside the onboarding module", () => {
    const sharedWeightPickerPath = resolve(
      moduleDir,
      "../../components/weight-picker.jsx",
    );
    const goalDrawerSource = readFileSync(
      resolve(
        moduleDir,
        "../../modules/user/containers/measurements/goal-input-drawer.jsx",
      ),
      "utf8",
    );
    const weightDrawerSource = readFileSync(
      resolve(
        moduleDir,
        "../../modules/user/containers/measurements/weight-input-drawer.jsx",
      ),
      "utf8",
    );

    expect(existsSync(sharedWeightPickerPath)).toBe(true);
    expect(goalDrawerSource).toContain(
      'from "@/components/weight-picker"',
    );
    expect(weightDrawerSource).toContain(
      'from "@/components/weight-picker"',
    );
  });
});
