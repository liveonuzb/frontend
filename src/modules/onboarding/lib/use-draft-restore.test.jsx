import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingStore } from "@/store";
import { useDraftRestore } from "./use-draft-restore";

const getQueryResultMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/api", () => ({
  useGetQuery: (...args) => getQueryResultMock(...args),
}));

const DraftRestoreProbe = () => {
  useDraftRestore("user");
  return null;
};

describe("useDraftRestore", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    getQueryResultMock.mockReset();
  });

  it("restores a meaningful server draft into an empty user store after refresh", async () => {
    getQueryResultMock.mockReturnValue({
      isLoading: false,
      data: {
        data: {
          firstName: "Ali",
          gender: "male",
          age: 29,
          height: { value: 178, unit: "cm" },
          currentWeight: { value: 82, unit: "kg" },
          goal: "lose",
          targetWeight: { value: 76, unit: "kg" },
          mealFrequency: "3",
          completedUserOnboardingSteps: ["name", "gender", "age"],
        },
      },
    });

    render(<DraftRestoreProbe />);

    await waitFor(() => {
      expect(useOnboardingStore.getState()).toEqual(
        expect.objectContaining({
          firstName: "Ali",
          gender: "male",
          age: "29",
          height: { value: "178", unit: "cm" },
          currentWeight: { value: "82", unit: "kg" },
          goal: "lose",
          targetWeight: { value: "76", unit: "kg" },
          mealFrequency: "3",
          completedUserOnboardingSteps: ["name", "gender", "age"],
        }),
      );
    });
  });
});
