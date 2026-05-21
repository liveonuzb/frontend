import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useWorkoutPlan from "./use-workout-plan";
import {
  useActivateWorkoutPlan,
  useCreateWorkoutPlan,
  useDeleteWorkoutPlan,
  useDuplicateWorkoutPlan,
  usePauseWorkoutPlan,
  usePersistedWorkoutPlan,
  useUpdateWorkoutPlan,
} from "./use-workout-plans";

const activatePlanMock = vi.fn();
const createPlanMock = vi.fn();
const duplicatePlanMock = vi.fn();
const updatePlanMock = vi.fn();

vi.mock("./use-workout-plans", () => ({
  buildWorkoutPlanPayload: vi.fn((plan) => ({
    name: plan?.name,
    source: plan?.source,
    schedule: plan?.schedule ?? [],
  })),
  isPersistedWorkoutPlan: vi.fn(() => false),
  useActivateWorkoutPlan: vi.fn(),
  useCreateWorkoutPlan: vi.fn(),
  useDeleteWorkoutPlan: vi.fn(),
  useDuplicateWorkoutPlan: vi.fn(),
  usePauseWorkoutPlan: vi.fn(),
  usePersistedWorkoutPlan: vi.fn(),
  useUpdateWorkoutPlan: vi.fn(),
}));

describe("useWorkoutPlan", () => {
  beforeEach(() => {
    activatePlanMock.mockReset();
    createPlanMock.mockReset();
    duplicatePlanMock.mockReset();
    updatePlanMock.mockReset();

    usePersistedWorkoutPlan.mockReturnValue({
      items: [],
      templates: [],
      activePlanId: null,
      draftPlanId: null,
    });
    useCreateWorkoutPlan.mockReturnValue({
      createPlan: createPlanMock,
      isPending: false,
    });
    useUpdateWorkoutPlan.mockReturnValue({
      updatePlan: updatePlanMock,
      isPending: false,
    });
    useActivateWorkoutPlan.mockReturnValue({
      activatePlan: activatePlanMock,
      isPending: false,
    });
    usePauseWorkoutPlan.mockReturnValue({
      pausePlan: vi.fn(),
      isPending: false,
    });
    useDeleteWorkoutPlan.mockReturnValue({
      deletePlan: vi.fn(),
      isPending: false,
    });
    useDuplicateWorkoutPlan.mockReturnValue({
      duplicatePlan: duplicatePlanMock,
      isPending: false,
    });
  });

  it("activates backend templates directly instead of creating a draft fallback", async () => {
    activatePlanMock.mockResolvedValue({
      id: "user-plan-from-template",
      status: "active",
    });

    const { result } = renderHook(() => useWorkoutPlan());

    await act(async () => {
      await result.current.startPlan({
        id: "template-running",
        name: "Running Starter Plan",
        source: "seed",
        isTemplate: true,
        schedule: [],
      });
    });

    expect(activatePlanMock).toHaveBeenCalledWith(
      "template-running",
      expect.objectContaining({
        name: "Running Starter Plan",
        source: "template",
      }),
    );
    expect(createPlanMock).not.toHaveBeenCalled();
  });

  it("exposes a duplicate action for persisted plans", async () => {
    duplicatePlanMock.mockResolvedValue({
      id: "copy-1",
      status: "draft",
      name: "Full Body Strength (copy)",
    });

    const { result } = renderHook(() => useWorkoutPlan());

    await act(async () => {
      await result.current.duplicatePlan("plan-1");
    });

    expect(duplicatePlanMock).toHaveBeenCalledWith("plan-1");
  });
});
