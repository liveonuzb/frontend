import { NUTRITION_NAV_ITEMS } from "./nutrition-nav-items.js";

const visualRouteDetailsByPath = {
  "/user/nutrition/overview": {
    key: "overview",
    expectedText: "Bugungi Kaloriya",
    screenshotName: "nutrition-overview.png",
  },
  "/user/nutrition/plans": {
    key: "plans",
    expectedText: "Rejalar",
    screenshotName: "nutrition-plans.png",
  },
  "/user/nutrition/recipes": {
    key: "recipes",
    expectedText: "Tovuqli quinoa salatasi",
    screenshotName: "nutrition-recipes.png",
  },
  "/user/nutrition/history": {
    key: "history",
    expectedText: "Tuxumli nonushta",
    screenshotName: "nutrition-history.png",
  },
  "/user/nutrition/report": {
    key: "report",
    expectedText: "Hisobot",
    screenshotName: "nutrition-report.png",
  },
};

export const NUTRITION_VISUAL_ROUTES = NUTRITION_NAV_ITEMS.map((item) => ({
  path: item.to,
  navLabel: item.label,
  ...visualRouteDetailsByPath[item.to],
}));
