import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RunMapPanel from "./run-map-panel.jsx";

const mockLoadMapProvider = vi.fn();
const mapInstances = [];
const markerInstances = [];

vi.mock("@/lib/maps", () => ({
  loadMapProvider: (...args) => mockLoadMapProvider(...args),
}));

class FakeMap {
  constructor(options) {
    this.options = options;
    this.sources = new globalThis.Map();
    this.layers = new Set();
    this.addControl = vi.fn();
    this.fitBounds = vi.fn();
    this.setCenter = vi.fn();
    this.setZoom = vi.fn();
    this.remove = vi.fn();
    mapInstances.push(this);
  }

  once(event, callback) {
    if (event === "load") {
      queueMicrotask(callback);
    }
  }

  on() {}

  getSource(id) {
    return this.sources.get(id);
  }

  addSource(id, source) {
    const storedSource = {
      ...source,
      setData: vi.fn((data) => {
        storedSource.data = data;
      }),
    };
    this.sources.set(id, storedSource);
  }

  getLayer(id) {
    return this.layers.has(id) ? { id } : undefined;
  }

  addLayer(layer) {
    this.layers.add(layer.id);
  }
}

class FakeMarker {
  constructor(options) {
    this.options = options;
    this.setLngLat = vi.fn(() => this);
    this.addTo = vi.fn(() => this);
    this.remove = vi.fn();
    markerInstances.push(this);
  }
}

class FakeLngLatBounds {
  constructor(start) {
    this.coordinates = [start];
  }

  extend(coordinate) {
    this.coordinates.push(coordinate);
    return this;
  }
}

const providerComponents = {
  type: "maplibre",
  styleUrl: "https://tiles.openfreemap.org/styles/dark",
  maplibregl: {
    Map: FakeMap,
    Marker: FakeMarker,
    NavigationControl: class FakeNavigationControl {},
    LngLatBounds: FakeLngLatBounds,
  },
};

describe("RunMapPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapInstances.length = 0;
    markerInstances.length = 0;
    mockLoadMapProvider.mockResolvedValue(providerComponents);
  });

  it("lazy-loads the map provider and renders a decoded route polyline", async () => {
    render(
      <RunMapPanel
        title="Route map"
        polyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@"
      />,
    );

    expect(screen.getByText("Xarita yuklanmoqda…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Xarita yuklanmoqda…",
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "3",
    );
    expect(mapInstances[0].options.style).toBe(
      "https://tiles.openfreemap.org/styles/dark",
    );
    await waitFor(() => expect(mapInstances[0].fitBounds).toHaveBeenCalled());
    await waitFor(() =>
      expect(markerInstances.at(-1).setLngLat).toHaveBeenCalledWith([
        -126.453,
        43.252,
      ]),
    );
    expect(mockLoadMapProvider).toHaveBeenCalledWith("maplibre");
  });

  it("does not load the map provider when there is no route data", () => {
    render(<RunMapPanel emptyLabel="No route recorded" />);

    expect(screen.getByText("No route recorded")).toBeInTheDocument();
    expect(mockLoadMapProvider).not.toHaveBeenCalled();
  });

  it("renders a compact real-data route preview without loading the provider", () => {
    const onExpand = vi.fn();

    render(
      <RunMapPanel
        title={null}
        variant="preview"
        points={[
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
          {
            sequence: 2,
            latitude: 41.320069,
            longitude: 69.240562,
          },
        ]}
        qualityScore={0.92}
        showExpand
        expandLabel="Expand route preview"
        onExpand={onExpand}
      />,
    );

    expect(mockLoadMapProvider).not.toHaveBeenCalled();
    expect(screen.getByTestId("route-fallback-svg")).toHaveAttribute(
      "data-coordinate-count",
      "2",
    );
    expect(screen.getByText("92")).toBeInTheDocument();

    screen.getByRole("button", { name: /expand route preview/i }).click();
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("falls back to the real route SVG when the map provider cannot load", async () => {
    mockLoadMapProvider.mockRejectedValueOnce(new Error("missing key"));

    render(
      <RunMapPanel
        title="Route map"
        polyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        errorLabel="Map unavailable"
      />,
    );

    expect(await screen.findByText("Map unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("route-fallback-svg")).toHaveAttribute(
      "data-coordinate-count",
      "3",
    );
  });
});
