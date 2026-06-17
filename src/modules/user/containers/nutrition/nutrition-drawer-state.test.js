import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  NUTRITION_DRAWER_INITIAL_STATE,
  nutritionDrawerStateReducer,
  useNutritionDrawerState,
} from "./nutrition-drawer-state.js";

describe("nutrition drawer state", () => {
  it("keeps all drawer state closed by default", () => {
    expect(NUTRITION_DRAWER_INITIAL_STATE).toMatchObject({
      isCalendarOpen: false,
      isBuilderOpen: false,
      isPlansDrawerOpen: false,
      isTemplateLibraryOpen: false,
      isPlanMetaOpen: false,
      actionDrawerInitialNested: null,
      selectedMealTypeForAdd: "breakfast",
      duplicateMealPrompt: null,
    });
  });

  it("updates a field with direct and functional values", () => {
    const opened = nutritionDrawerStateReducer(
      NUTRITION_DRAWER_INITIAL_STATE,
      {
        type: "set-field",
        field: "selectedScanId",
        value: "scan-1",
      },
    );

    expect(opened.selectedScanId).toBe("scan-1");

    const closed = nutritionDrawerStateReducer(opened, {
      type: "set-field",
      field: "selectedScanId",
      value: (current) => (current === "scan-1" ? null : current),
    });

    expect(closed.selectedScanId).toBeNull();
  });

  it("exposes setter-compatible actions from the hook", () => {
    const { result } = renderHook(() => useNutritionDrawerState());

    act(() => {
      result.current.setIsPlansDrawerOpen(true);
      result.current.setActionDrawerInitialNested("barcode");
      result.current.setBuilderInitialData({ days: [] });
      result.current.setPlanMetaName("Weekly plan");
    });

    expect(result.current.isPlansDrawerOpen).toBe(true);
    expect(result.current.actionDrawerInitialNested).toBe("barcode");
    expect(result.current.builderInitialData).toEqual({ days: [] });
    expect(result.current.planMetaName).toBe("Weekly plan");

    act(() => {
      result.current.setSelectedScanId("scan-1");
    });
    act(() => {
      result.current.setSelectedScanId((current) =>
        current === "scan-1" ? null : current,
      );
    });

    expect(result.current.selectedScanId).toBeNull();
  });
});
