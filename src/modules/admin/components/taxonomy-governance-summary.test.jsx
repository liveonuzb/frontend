import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TaxonomyGovernanceSummary from "./taxonomy-governance-summary.jsx";
import { getTaxonomyGovernanceCounts } from "./taxonomy-governance-summary-utils.js";

const governancePayload = {
  summary: {
    issueCount: 4,
    missingTranslationItems: 2,
    duplicateNameGroups: 1,
    orderKeyIssueItems: 1,
  },
  groups: {
    foodCategories: {
      label: "Food categories",
      issueCount: 2,
      missingTranslationItems: 1,
      duplicateNameGroups: 1,
      orderKeyIssueItems: 0,
      issues: [{ code: "missing_translations", severity: "warning" }],
    },
  },
};

vi.mock("@/hooks/api", () => ({
  useGetQuery: () => ({
    data: { data: governancePayload },
    isLoading: false,
    isFetching: false,
  }),
}));

describe("TaxonomyGovernanceSummary", () => {
  it("normalizes governance counts for compact admin QA panels", () => {
    expect(getTaxonomyGovernanceCounts(governancePayload)).toEqual({
      issueCount: 4,
      missingTranslationItems: 2,
      duplicateNameGroups: 1,
      orderKeyIssueItems: 1,
    });
  });

  it("renders canonical governance summary and group issue links", () => {
    render(<TaxonomyGovernanceSummary groupKey="foodCategories" />);

    expect(screen.getByText("Taxonomy QA")).toBeInTheDocument();
    expect(screen.getByText("4 issue")).toBeInTheDocument();
    expect(screen.getByText("2 translation")).toBeInTheDocument();
    expect(screen.getByText("1 duplicate")).toBeInTheDocument();
    expect(screen.getByText("Food categories")).toBeInTheDocument();
    expect(screen.getByText("missing_translations")).toBeInTheDocument();
  });
});
