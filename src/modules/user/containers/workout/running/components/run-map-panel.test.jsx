import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
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
    this.handlers = new globalThis.Map();
    this.layers = new Set();
    this.addControl = vi.fn();
    this.fitBounds = vi.fn();
    this.setCenter = vi.fn();
    this.setZoom = vi.fn();
    this.easeTo = vi.fn();
    this.setStyle = vi.fn((styleUrl) => {
      this.options.style = styleUrl;
    });
    this.remove = vi.fn();
    mapInstances.push(this);
  }

  once(event, callback) {
    if (event === "load") {
      queueMicrotask(callback);
    }
  }

  on(event, callback) {
    const callbacks = this.handlers.get(event) ?? [];
    callbacks.push(callback);
    this.handlers.set(event, callbacks);
  }

  off(event, callback) {
    const callbacks = this.handlers.get(event) ?? [];
    this.handlers.set(
      event,
      callbacks.filter((handler) => handler !== callback),
    );
  }

  emit(event, payload) {
    for (const callback of this.handlers.get(event) ?? []) {
      callback(payload);
    }
  }

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
  styleUrls: {
    light: "https://tiles.openfreemap.org/styles/bright",
    dark: "https://tiles.openfreemap.org/styles/dark",
  },
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
    document.documentElement.classList.remove("dark");
    window.localStorage.removeItem("theme");
    mockLoadMapProvider.mockResolvedValue(providerComponents);
  });

  it("lazy-loads the map provider and renders a decoded route polyline", async () => {
    render(
      <RunMapPanel title="Route map" polyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@" />,
    );

    expect(screen.getByText("Xarita yuklanmoqda…")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "3",
    );
    await waitFor(() => expect(mapInstances).toHaveLength(1));
    expect(mapInstances[0].options.style).toBe(
      "https://tiles.openfreemap.org/styles/bright",
    );
    expect(mapInstances[0].options.attributionControl).toBe(false);
    expect(mapInstances[0].addControl).not.toHaveBeenCalled();
    await waitFor(() => expect(mapInstances[0].fitBounds).toHaveBeenCalled());
    await waitFor(() =>
      expect(markerInstances.at(-1).setLngLat).toHaveBeenCalledWith([
        -126.453, 43.252,
      ]),
    );
    expect(mockLoadMapProvider).toHaveBeenCalledWith("maplibre");
  });

  it("loads a real map shell when there is no route data yet", async () => {
    render(<RunMapPanel emptyLabel="No route recorded" />);

    expect(screen.getByText("Xarita yuklanmoqda…")).toBeInTheDocument();
    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "0",
    );
    expect(mockLoadMapProvider).toHaveBeenCalledWith("maplibre");
  });

  it("uses the dark map style when the app theme is dark", async () => {
    document.documentElement.classList.add("dark");

    render(<RunMapPanel emptyLabel="No route recorded" />);

    expect(await screen.findByTestId("maplibre-map")).toBeInTheDocument();
    await waitFor(() => expect(mapInstances).toHaveLength(1));
    expect(mapInstances[0].options.style).toBe(
      "https://tiles.openfreemap.org/styles/dark",
    );
  });

  it("switches map style on app theme changes without remounting the live map", async () => {
    render(
      <RunMapPanel
        title={null}
        variant="live"
        points={[
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
        ]}
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "1",
    );
    await waitFor(() => expect(mapInstances).toHaveLength(1));

    document.documentElement.classList.add("dark");
    window.dispatchEvent(
      new CustomEvent("app-theme-change", { detail: "dark" }),
    );

    await waitFor(() => {
      expect(mapInstances[0].setStyle).toHaveBeenCalledWith(
        "https://tiles.openfreemap.org/styles/dark",
      );
    });
    expect(mapInstances).toHaveLength(1);
    expect(mapInstances[0].remove).not.toHaveBeenCalled();
  });

  it("renders a compact preview with the real map provider when route data exists", async () => {
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

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "2",
    );
    expect(mockLoadMapProvider).toHaveBeenCalledWith("maplibre");
    expect(screen.getByText("92")).toBeInTheDocument();

    screen.getByRole("button", { name: /expand route preview/i }).click();
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("prefers the cleaned route polyline over raw filtered points for completed previews", async () => {
    render(
      <RunMapPanel
        title={null}
        polyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        points={[
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
            isFilteredOut: false,
          },
          {
            sequence: 2,
            latitude: 42.5,
            longitude: 70.8,
            isFilteredOut: true,
          },
        ]}
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "3",
    );
  });

  it("keeps live route segments separated when GPS resumes after a pause", async () => {
    render(
      <RunMapPanel
        title={null}
        variant="live"
        points={[
          {
            sequence: 1,
            segmentIndex: 0,
            latitude: 41.311081,
            longitude: 69.240562,
          },
          {
            sequence: 2,
            segmentIndex: 0,
            latitude: 41.312081,
            longitude: 69.240562,
          },
          {
            sequence: 3,
            segmentIndex: 1,
            latitude: 41.320081,
            longitude: 69.240562,
          },
          {
            sequence: 4,
            segmentIndex: 1,
            latitude: 41.321081,
            longitude: 69.240562,
          },
        ]}
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-route-feature-count",
      "2",
    );
  });

  it("keeps completed route segments separated when points include pause segments", async () => {
    render(
      <RunMapPanel
        title={null}
        polyline="_p~iF~ps|U_ulLnnqC_mqNvxq`@"
        points={[
          {
            sequence: 1,
            segmentIndex: 0,
            latitude: 41.311081,
            longitude: 69.240562,
          },
          {
            sequence: 2,
            segmentIndex: 0,
            latitude: 41.312081,
            longitude: 69.240562,
          },
          {
            sequence: 3,
            segmentIndex: 1,
            latitude: 41.320081,
            longitude: 69.240562,
          },
          {
            sequence: 4,
            segmentIndex: 1,
            latitude: 41.321081,
            longitude: 69.240562,
          },
        ]}
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-route-feature-count",
      "2",
    );
  });

  it("draws the live route from cleaned GPS points instead of weak raw fixes", async () => {
    render(
      <RunMapPanel
        title={null}
        variant="live"
        points={[
          {
            sequence: 1,
            segmentIndex: 0,
            latitude: 41.311081,
            longitude: 69.240562,
            accuracy: 8,
            sourceTimestamp: "2026-05-12T10:00:00.000Z",
          },
          {
            sequence: 2,
            segmentIndex: 0,
            latitude: 42.5,
            longitude: 70.8,
            accuracy: 160,
            sourceTimestamp: "2026-05-12T10:01:00.000Z",
          },
          {
            sequence: 3,
            segmentIndex: 0,
            latitude: 41.320081,
            longitude: 69.240562,
            accuracy: 8,
            sourceTimestamp: "2026-05-12T10:10:00.000Z",
          },
        ]}
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "2",
    );
  });

  it("keeps the map mounted when MapLibre reports a recoverable resource error", async () => {
    render(
      <RunMapPanel
        title={null}
        variant="live"
        points={[
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
        ]}
        errorLabel="Map unavailable"
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "1",
    );
    await waitFor(() => expect(mapInstances).toHaveLength(1));

    await act(async () => {
      mapInstances[0].emit("error", {
        error: new Error("tile request failed"),
        sourceId: "openfreemap",
        tile: {},
      });
    });

    expect(screen.getByTestId("maplibre-map")).toBeInTheDocument();
    expect(screen.queryByText("Map unavailable")).not.toBeInTheDocument();
  });

  it("keeps the same live map instance when route points update", async () => {
    const { rerender } = render(
      <RunMapPanel
        title={null}
        variant="live"
        points={[
          {
            sequence: 1,
            latitude: 41.311081,
            longitude: 69.240562,
          },
        ]}
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "1",
    );
    await waitFor(() => expect(mapInstances).toHaveLength(1));

    rerender(
      <RunMapPanel
        title={null}
        variant="live"
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
      />,
    );

    expect(await screen.findByTestId("maplibre-map")).toHaveAttribute(
      "data-coordinate-count",
      "2",
    );
    expect(mockLoadMapProvider).toHaveBeenCalledTimes(1);
    expect(mapInstances).toHaveLength(1);
    expect(mapInstances[0].remove).not.toHaveBeenCalled();
    expect(mapInstances[0].fitBounds).not.toHaveBeenCalled();
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
    expect(screen.getByTestId("route-map-fallback")).toHaveClass(
      "bg-card",
      "text-card-foreground",
    );
    expect(screen.getByTestId("route-fallback-svg")).toHaveAttribute(
      "data-coordinate-count",
      "3",
    );
  });

  it("keeps the empty fallback readable on app-mode card surfaces", async () => {
    mockLoadMapProvider.mockRejectedValueOnce(new Error("missing key"));

    render(
      <RunMapPanel
        title="Route map"
        emptyLabel="No route recorded"
        errorLabel="Map unavailable"
      />,
    );

    expect(await screen.findByText("Map unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("route-map-fallback")).toHaveClass(
      "border-border",
      "bg-card",
      "text-card-foreground",
    );
  });
});
