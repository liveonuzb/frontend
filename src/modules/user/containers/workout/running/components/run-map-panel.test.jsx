import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunMapPanel from "./run-map-panel.jsx";

const mockLoadMapProvider = vi.fn();

vi.mock("@/lib/maps", () => ({
  loadMapProvider: (...args) => mockLoadMapProvider(...args),
}));

const providerComponents = {
  YMap: ({ children, location }) => (
    <div
      data-testid="map-root"
      data-center={JSON.stringify(location.center)}
      data-zoom={location.zoom}
    >
      {children}
    </div>
  ),
  YMapDefaultSchemeLayer: () => <div data-testid="map-scheme-layer" />,
  YMapDefaultFeaturesLayer: () => <div data-testid="map-features-layer" />,
  YMapFeature: ({ geometry }) => (
    <div
      data-testid="map-route"
      data-coordinate-count={geometry.coordinates.length}
    />
  ),
  YMapMarker: ({ coordinates }) => (
    <div data-testid="map-marker" data-point={JSON.stringify(coordinates)} />
  ),
};

describe("RunMapPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadMapProvider.mockResolvedValue(providerComponents);
  });

  it("lazy-loads the map provider and renders a decoded route polyline", async () => {
    render(
      <RunMapPanel
        title="Route map"
        polyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@"
      />,
    );

    expect(screen.getByText("Loading map")).toBeInTheDocument();

    expect(await screen.findByTestId("map-root")).toBeInTheDocument();
    expect(screen.getByTestId("map-route")).toHaveAttribute(
      "data-coordinate-count",
      "3",
    );
    expect(screen.getByTestId("map-marker")).toHaveAttribute(
      "data-point",
      JSON.stringify([-126.453, 43.252]),
    );
    expect(mockLoadMapProvider).toHaveBeenCalledWith("yandex");
  });

  it("does not load the map provider when there is no route data", () => {
    render(<RunMapPanel emptyLabel="No route recorded" />);

    expect(screen.getByText("No route recorded")).toBeInTheDocument();
    expect(mockLoadMapProvider).not.toHaveBeenCalled();
  });
});
