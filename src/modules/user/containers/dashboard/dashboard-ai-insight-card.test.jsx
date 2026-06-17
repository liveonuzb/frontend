import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import DashboardAiInsightCard from "./dashboard-ai-insight-card.jsx";
import { getDashboardAiInsightViewModel } from "./dashboard-ai-insight-view-model.js";

const freeLimits = {
  isPremium: false,
  quota: {
    used: 1,
    monthly: 2,
    remaining: 1,
  },
  periods: [
    { period: "weekly", locked: false },
    { period: "monthly", locked: false },
    { period: "three_months", locked: true },
    { period: "six_months", locked: true },
    { period: "yearly", locked: true },
  ],
};

const premiumLimits = {
  isPremium: true,
  quota: {
    used: 5,
    monthly: 20,
    remaining: 15,
  },
  periods: [
    { period: "weekly", locked: false },
    { period: "monthly", locked: false },
    { period: "three_months", locked: false },
    { period: "six_months", locked: false },
    { period: "yearly", locked: false },
  ],
};

const dailyReport = {
  hasData: true,
  status: "good",
  score: 82,
  summary: "Suv yaxshi, protein pastroq",
};

const latestReport = {
  id: "report-1",
  period: "weekly",
  createdAt: "2026-05-14T08:00:00.000Z",
  report: {
    summary: {
      title: "Haftalik trend tayyor",
      summary: "Protein barqaror yaxshilanmoqda.",
    },
    nextActions: ["Nonushtaga oqsil qo'shing"],
  },
};

const renderCard = (insights) =>
  render(
    <MemoryRouter>
      <DashboardAiInsightCard dateKey="2026-05-14" insights={insights} />
    </MemoryRouter>,
  );

describe("DashboardAiInsightCard", () => {
  it("shows useful preview value for a free user with quota remaining", () => {
    renderCard({
      limits: freeLimits,
      dailyReport,
      latestReport: null,
      isLoading: false,
      hasError: false,
    });

    expect(screen.getByText("AI Health Snapshot")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("82/100")).toBeInTheDocument();
    expect(screen.getByText(/Suv yaxshi/)).toBeInTheDocument();
    expect(screen.getByText("1/2 report qoldi")).toBeInTheDocument();
    expect(screen.getByText("3 ta uzun davr Premiumda")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Premiumga o'tish/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /AI reportni ochish/i }),
    ).toHaveAttribute("href", "/user/report");
  });

  it("keeps the free user CTA contextual when quota is exhausted", () => {
    renderCard({
      limits: {
        ...freeLimits,
        quota: {
          used: 2,
          monthly: 2,
          remaining: 0,
        },
      },
      dailyReport,
      latestReport: null,
      isLoading: false,
      hasError: false,
    });

    expect(screen.getByText("Limit tugagan")).toBeInTheDocument();
    expect(screen.getByText(/Bu oy yangi report limiti tugagan/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Premiumga o'tish/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the latest AI report and next action for premium users", () => {
    renderCard({
      limits: premiumLimits,
      dailyReport,
      latestReport,
      isLoading: false,
      hasError: false,
    });

    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Haftalik trend tayyor")).toBeInTheDocument();
    expect(screen.getByText("Protein barqaror yaxshilanmoqda.")).toBeInTheDocument();
    expect(screen.getByText("15/20 report qoldi")).toBeInTheDocument();
    expect(screen.getByText("Nonushtaga oqsil qo'shing")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Bugungi reportni ochish/i }),
    ).toHaveAttribute("href", "/user/report");
  });

  it("detects a cached report generated for the selected day", () => {
    const viewModel = getDashboardAiInsightViewModel(
      {
        limits: freeLimits,
        latestReport,
        dailyReport,
      },
      "2026-05-14",
    );

    expect(viewModel.hasTodayCachedReport).toBe(true);
    expect(viewModel.primaryActionLabel).toBe("Bugungi reportni ochish");
  });

  it("shows an empty state when tracking data is not ready for AI analysis", () => {
    renderCard({
      limits: freeLimits,
      dailyReport: {
        hasData: false,
        score: 0,
        summary: "",
      },
      latestReport: null,
      isLoading: false,
      hasError: false,
    });

    expect(screen.getByText("Trackingni boshlang")).toBeInTheDocument();
    expect(
      screen.getByText(/AI tahlil uchun bugungi ovqat, suv yoki faollikni/i),
    ).toBeInTheDocument();
  });

  it("keeps available insight visible when one of the AI APIs warns or fails", () => {
    renderCard({
      limits: freeLimits,
      dailyReport,
      latestReport: null,
      isLoading: false,
      hasError: true,
    });

    expect(screen.getByText("AI snapshot to'liq yangilanmadi")).toBeInTheDocument();
    expect(screen.getByText("82/100")).toBeInTheDocument();
  });
});
