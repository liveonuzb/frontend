import { describe, expect, it } from "vitest";
import {
  buildNutritionReportChartData,
  buildNutritionReportComparisonChartData,
  buildNutritionReportSourceChartData,
  getNutritionReportAverageCalories,
} from "./nutrition-report-chart-data.js";

describe("nutrition report chart data builders", () => {
  it("normalizes daily nutrition rows for charts", () => {
    expect(
      buildNutritionReportChartData([
        null,
        {
          date: "2026-05-30",
          calories: "1800.7",
          protein: "bad",
          carbs: "220.5",
          fat: "-3",
          fiber: "18.2",
          waterMl: "2100.9",
          mealCount: "3.8",
        },
        { date: "", calories: 500 },
      ]),
    ).toEqual([
      {
        date: "30-may",
        "Kaloriya": 1801,
        "Oqsil (g)": 0,
        "Uglevod (g)": 220.5,
        "Yog' (g)": 0,
        "Fiber (g)": 18.2,
        "Suv (ml)": 2101,
        "Ovqat soni": 4,
      },
    ]);
  });

  it("filters source rows and clamps source percentages", () => {
    expect(
      buildNutritionReportSourceChartData(
        [
          { source: "manual", count: "2.8", percent: "65.4" },
          { source: "camera", count: "bad", percent: 10 },
          { source: "audio", count: 1, percent: "-5" },
          null,
        ],
        (source) => ({ manual: "Qo'lda", audio: "Audio" })[source] || "Boshqa",
      ),
    ).toEqual([
      { name: "Qo'lda", value: 3, percent: 65 },
      { name: "Audio", value: 1, percent: 0 },
    ]);
  });

  it("builds aligned comparison rows and averages only logged calorie days", () => {
    const currentLabel = "Tanlangan davr";
    const previousLabel = "Oldingi davr";

    expect(
      buildNutritionReportComparisonChartData({
        mode: "period",
        currentDaily: [
          { date: "2026-05-30", calories: "1800.7" },
          { date: "2026-05-31", calories: "-10" },
        ],
        previousDaily: [
          { calories: "1700.2" },
          { calories: "bad" },
        ],
        labels: {
          current: currentLabel,
          previous: previousLabel,
        },
      }),
    ).toEqual([
      {
        date: "30-may",
        [currentLabel]: 1801,
        [previousLabel]: 1700,
      },
      {
        date: "31-may",
        [currentLabel]: 0,
        [previousLabel]: 0,
      },
    ]);

    expect(
      getNutritionReportAverageCalories([
        { calories: 1800 },
        { calories: "0" },
        { calories: "bad" },
        { calories: 2000 },
      ]),
    ).toBe(1900);
  });
});
