import React from "react";
import { MapIcon, Maximize2Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadMapProvider } from "@/lib/maps";
import { resolveTheme } from "@/lib/user-preferences";
import { cn } from "@/lib/utils";

import { filter, forEach, map, reduce, toNumber, values as lodashValues } from "lodash";

const DEFAULT_CENTER = [69.240562, 41.311081];
const SVG_SIZE = 360;
const SVG_PADDING = 54;

const getCurrentMapTheme = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "light";
  }

  if (document.documentElement.classList.contains("dark")) {
    return "dark";
  }

  return resolveTheme(window.localStorage.getItem("theme") || "light");
};

const useMapTheme = () => {
  const [theme, setTheme] = React.useState(getCurrentMapTheme);

  React.useEffect(() => {
    const syncTheme = () => setTheme(getCurrentMapTheme());

    window.addEventListener("app-theme-change", syncTheme);

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("app-theme-change", syncTheme);
      observer.disconnect();
    };
  }, []);

  return theme;
};

const getMapStyleUrl = (mapProvider, theme) =>
  mapProvider?.styleUrls?.[theme] ??
  mapProvider?.styleUrl ??
  "https://tiles.openfreemap.org/styles/dark";

const roundCoordinate = (value) => Math.round(value * 1e6) / 1e6;
const roundSvgPoint = (value) => Math.round(value * 10) / 10;

const decodeGooglePolyline = (polyline) => {
  if (!polyline || typeof polyline !== "string") {
    return [];
  }

  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < polyline.length) {
    const decodeValue = () => {
      let result = 0;
      let shift = 0;
      let byte = 0;

      do {
        byte = polyline.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index <= polyline.length);

      return result & 1 ? ~(result >> 1) : result >> 1;
    };

    latitude += decodeValue();
    longitude += decodeValue();
    coordinates.push([
      roundCoordinate(longitude / 1e5),
      roundCoordinate(latitude / 1e5),
    ]);
  }

  return coordinates;
};

const normalizePointCoordinates = (points = []) =>
  filter(map(points, (point) => {
      const latitude = toNumber(point?.latitude);
      const longitude = toNumber(point?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return [roundCoordinate(longitude), roundCoordinate(latitude)];
    }), Boolean);

const getRouteCoordinates = ({ points = [], polyline = null }) => {
  const pointCoordinates = normalizePointCoordinates(points);
  return pointCoordinates.length > 0
    ? pointCoordinates
    : decodeGooglePolyline(polyline);
};

const getMapCenter = (coordinates) =>
  coordinates.length > 0 ? coordinates[coordinates.length - 1] : DEFAULT_CENTER;

const getRouteCenter = (coordinates) => {
  if (coordinates.length === 0) {
    return DEFAULT_CENTER;
  }

  const totals = reduce(coordinates, (acc, [longitude, latitude]) => ({
    longitude: acc.longitude + longitude,
    latitude: acc.latitude + latitude,
  }), { longitude: 0, latitude: 0 });

  return [
    roundCoordinate(totals.longitude / coordinates.length),
    roundCoordinate(totals.latitude / coordinates.length),
  ];
};

const projectCoordinates = (coordinates) => {
  if (coordinates.length === 0) {
    return [];
  }

  const longitudes = map(coordinates, ([longitude]) => longitude);
  const latitudes = map(coordinates, ([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeSpan = maxLongitude - minLongitude;
  const latitudeSpan = maxLatitude - minLatitude;
  const drawableSize = SVG_SIZE - SVG_PADDING * 2;

  return map(coordinates, ([longitude, latitude]) => {
    const x =
      longitudeSpan > 0
        ? SVG_PADDING +
          ((longitude - minLongitude) / longitudeSpan) * drawableSize
        : SVG_SIZE / 2;
    const y =
      latitudeSpan > 0
        ? SVG_PADDING +
          (1 - (latitude - minLatitude) / latitudeSpan) * drawableSize
        : SVG_SIZE / 2;

    return [roundSvgPoint(x), roundSvgPoint(y)];
  });
};

const getSvgPathPoints = (points) =>
  map(points, ([x, y]) => `${x},${y}`).join(" ");

const normalizeQualityScore = (score) => {
  const numericScore = toNumber(score);

  if (!Number.isFinite(numericScore) || numericScore <= 0) {
    return null;
  }

  return Math.min(
    100,
    Math.round(numericScore <= 1 ? numericScore * 100 : numericScore),
  );
};

const getQualityText = (score, labels) => {
  if (score === null) {
    return {
      score: "--",
      title: labels.unavailableTitle,
      description: labels.unavailableDescription,
    };
  }

  if (score >= 80) {
    return {
      score: String(score),
      title: labels.greatTitle,
      description: labels.greatDescription,
    };
  }

  if (score >= 50) {
    return {
      score: String(score),
      title: labels.fairTitle,
      description: labels.fairDescription,
    };
  }

  return {
    score: String(score),
    title: labels.weakTitle,
    description: labels.weakDescription,
  };
};

const MapExpandButton = ({ showExpand, expandLabel, onExpand }) =>
  showExpand ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-4 top-4 z-10 rounded-2xl border border-white/10 bg-white/[0.08] text-white/80 hover:bg-white/[0.15] focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
      aria-label={expandLabel}
      onClick={onExpand}
    >
      <Maximize2Icon className="size-5" aria-hidden="true" />
    </Button>
  ) : null;

const RouteQualityCard = ({
  qualityScore,
  className,
  labels,
  compact = false,
}) => {
  const score = normalizeQualityScore(qualityScore);
  const quality = getQualityText(score, labels);

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 w-[76%] max-w-[300px] rounded-[1.3rem] border border-white/10 bg-[#211a14]/90 p-4 shadow-2xl backdrop-blur-xl",
        compact && "bottom-3 right-3 w-[250px] max-w-[calc(100%-1.5rem)] p-3",
        className,
      )}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span
              className={cn(
                "size-2 rounded-full",
                score === null
                  ? "bg-white/40"
                  : score >= 80
                    ? "bg-[#7cc765]"
                    : "bg-[#f59e0b]",
              )}
              aria-hidden="true"
            />
            {labels.qualityLabel}
          </div>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-4xl font-semibold leading-none text-white">
              {quality.score}
            </span>
            {score === null ? null : (
              <span className="pb-1 text-sm text-white/70">/100</span>
            )}
          </div>
        </div>
        <div className="h-16 w-px bg-white/10" />
        <div>
          <p className="text-base font-semibold text-[#87d35f]">
            {quality.title}
          </p>
          <p className="mt-1 text-sm text-white/[0.55]">
            {quality.description}
          </p>
        </div>
      </div>
    </div>
  );
};

const RouteSvgFallback = ({
  coordinates,
  label,
  live = false,
  qualityScore,
  labels,
  showQuality = true,
  showExpand = false,
  expandLabel,
  onExpand,
  compact = false,
}) => {
  const svgId = React.useId().replaceAll(":", "");
  const projectedPoints = projectCoordinates(coordinates);
  const pathPoints = getSvgPathPoints(projectedPoints);
  const startPoint = projectedPoints[0];
  const endPoint = projectedPoints.at(-1);
  const hasRoute = projectedPoints.length > 0;

  return (
    <div
      className={cn(
        "relative h-full min-h-[260px] overflow-hidden rounded-[1.5rem] border border-border bg-card text-card-foreground",
        compact && "min-h-0 rounded-[1.25rem]",
      )}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      data-testid="route-map-fallback"
    >
      <div
        className="absolute inset-0 opacity-[0.16] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(34deg, transparent 0 44%, hsl(var(--foreground) / .34) 45% 47%, transparent 48%), linear-gradient(118deg, transparent 0 35%, hsl(var(--foreground) / .28) 36% 38%, transparent 39%), linear-gradient(8deg, transparent 0 54%, hsl(var(--foreground) / .22) 55% 57%, transparent 58%), linear-gradient(90deg, transparent 0 64%, hsl(var(--foreground) / .18) 65% 67%, transparent 68%)",
          backgroundSize: "118px 118px, 136px 136px, 96px 96px, 132px 132px",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
      <MapExpandButton
        showExpand={showExpand}
        expandLabel={expandLabel}
        onExpand={onExpand}
      />
      {hasRoute ? (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          role="img"
          aria-label={labels.routePreviewLabel}
          data-testid="route-fallback-svg"
          data-coordinate-count={coordinates.length}
        >
          <defs>
            <linearGradient
              id={`${svgId}-route-gradient`}
              x1="0"
              x2="1"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="48%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
            <filter
              id={`${svgId}-route-glow`}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {projectedPoints.length > 1 ? (
            <polyline
              points={pathPoints}
              fill="none"
              stroke={`url(#${svgId}-route-gradient)`}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="8"
              filter={`url(#${svgId}-route-glow)`}
            />
          ) : null}
          {startPoint ? (
            <circle
              cx={startPoint[0]}
              cy={startPoint[1]}
              r="13"
              fill="#7cc765"
              stroke="#f5f5f4"
              strokeWidth="5"
            />
          ) : null}
          {endPoint ? (
            <circle
              cx={endPoint[0]}
              cy={endPoint[1]}
              r="13"
              fill="#ef3f24"
              stroke="#f5f5f4"
              strokeWidth="5"
            />
          ) : null}
        </svg>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div>
            <MapIcon
              className="mx-auto size-8 text-primary"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-card-foreground">
              {label}
            </p>
          </div>
        </div>
      )}
      {hasRoute && label ? (
        <p className="absolute left-4 top-4 max-w-[60%] rounded-full border border-border bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {label}
        </p>
      ) : null}
      {showQuality ? (
        <RouteQualityCard
          qualityScore={qualityScore}
          labels={labels}
          compact={compact}
        />
      ) : null}
    </div>
  );
};

const ROUTE_SOURCE_ID = "liveon-running-route";
const ROUTE_GLOW_LAYER_ID = "liveon-running-route-glow";
const ROUTE_LINE_LAYER_ID = "liveon-running-route-line";

const buildRouteFeatureCollection = (coordinates) => ({
  type: "FeatureCollection",
  features:
    coordinates.length > 1
      ? [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        ]
      : [],
});

const createRouteMarker = (kind) => {
  const marker = document.createElement("div");
  marker.setAttribute(
    "aria-label",
    kind === "start" ? "Route start" : "Route finish",
  );
  marker.style.width = "1rem";
  marker.style.height = "1rem";
  marker.style.borderRadius = "9999px";
  marker.style.border = "2px solid #fff";
  marker.style.background = kind === "start" ? "#7cc765" : "#ef3f24";
  marker.style.boxShadow = "0 2px 10px rgba(0,0,0,0.35)";
  return marker;
};

const createCurrentLocationMarker = () => {
  const marker = document.createElement("div");
  marker.setAttribute("aria-label", "Current location");
  marker.style.width = "1.5rem";
  marker.style.height = "1.5rem";
  marker.style.borderRadius = "9999px";
  marker.style.border = "3px solid #fff";
  marker.style.background = "#0b84ff";
  marker.style.boxShadow =
    "0 0 0 12px rgba(11,132,255,0.18), 0 8px 24px rgba(0,0,0,0.28)";

  const heading = document.createElement("div");
  heading.style.position = "absolute";
  heading.style.left = "50%";
  heading.style.top = "-0.55rem";
  heading.style.width = "0";
  heading.style.height = "0";
  heading.style.transform = "translateX(-50%)";
  heading.style.borderLeft = "0.35rem solid transparent";
  heading.style.borderRight = "0.35rem solid transparent";
  heading.style.borderBottom = "0.65rem solid #1d4ed8";
  marker.appendChild(heading);

  return marker;
};

const createTransparentMapImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas;
};

const fitRouteBounds = ({ map, maplibregl, coordinates, center }) => {
  if (!map || coordinates.length === 0) {
    return;
  }

  if (coordinates.length === 1) {
    map.setCenter(center);
    map.setZoom(16);
    return;
  }

  const bounds = reduce(
    coordinates,
    (nextBounds, coordinate) => nextBounds.extend(coordinate),
    new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
  );

  map.fitBounds(bounds, {
    padding: 56,
    maxZoom: 16,
    duration: 0,
  });
};

const moveMapToLatestCoordinate = ({ map, coordinate, initial = false }) => {
  if (!map || !coordinate) {
    return;
  }

  if (initial) {
    map.setCenter(coordinate);
    map.setZoom(16);
    return;
  }

  if (typeof map.easeTo === "function") {
    map.easeTo({
      center: coordinate,
      duration: 450,
      essential: true,
    });
    return;
  }

  map.setCenter(coordinate);
};

const ensureRouteLayers = (map) => {
  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: buildRouteFeatureCollection([]),
    });
  }

  if (!map.getLayer(ROUTE_GLOW_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_GLOW_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#fbbf24",
        "line-width": 10,
        "line-opacity": 0.28,
        "line-blur": 2,
      },
    });
  }

  if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LINE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#f97316",
        "line-width": 5,
      },
    });
  }
};

const MapLibreRouteMap = ({
  center,
  coordinates,
  live = false,
  mapProvider,
  styleUrl,
  routeCenter,
  onError,
}) => {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRefs = React.useRef({
    start: null,
    end: null,
    current: null,
  });
  const readyRef = React.useRef(false);
  const didInitialLiveCenterRef = React.useRef(false);
  const lastFollowAtRef = React.useRef(0);
  const initialStyleUrlRef = React.useRef(styleUrl);
  const currentStyleUrlRef = React.useRef(null);
  const [isReady, setIsReady] = React.useState(false);
  const { maplibregl } = mapProvider ?? {};
  const coordinateCount = coordinates.length;
  const initialRouteCenterRef = React.useRef(routeCenter);
  const initialZoomRef = React.useRef(coordinateCount > 1 ? 15 : 16);

  React.useEffect(() => {
    if (!containerRef.current || !maplibregl || !initialStyleUrlRef.current) {
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;
    let fallbackTimer = null;
    let markReady = null;
    let handleMissingStyleImage = null;
    let handleMapError = null;
    let failed = false;

    const failMap = () => {
      if (cancelled || failed) {
        return;
      }

      failed = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      onError?.();
    };

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: initialStyleUrlRef.current,
        center: initialRouteCenterRef.current,
        zoom: initialZoomRef.current,
        attributionControl: false,
      });

      mapRef.current = map;
      currentStyleUrlRef.current = initialStyleUrlRef.current;
      readyRef.current = false;
      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: false,
          visualizePitch: false,
        }),
        "top-right",
      );

      markReady = () => {
        if (cancelled || failed || readyRef.current) {
          return;
        }

        try {
          ensureRouteLayers(map);
          readyRef.current = true;
          setIsReady(true);
          if (retryTimer) {
            window.clearTimeout(retryTimer);
            retryTimer = null;
          }
          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
        } catch {
          retryTimer = window.setTimeout(markReady, 250);
        }
      };
      handleMissingStyleImage = (event) => {
        const id = event?.id;

        if (!id || map.hasImage?.(id)) {
          return;
        }

        try {
          map.addImage(id, createTransparentMapImage());
        } catch {
          // Missing style sprites are visual decoration; route rendering should continue.
        }
      };
      handleMapError = () => {
        failMap();
      };

      map.once("load", markReady);
      map.on("styledata", markReady);
      map.on("styleimagemissing", handleMissingStyleImage);
      map.on("error", handleMapError);
      retryTimer = window.setTimeout(markReady, 250);
      fallbackTimer = window.setTimeout(() => {
        if (!readyRef.current) {
          failMap();
        }
      }, 8000);
    } catch {
      failMap();
    }

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      if (markReady) {
        mapRef.current?.off?.("styledata", markReady);
      }
      if (handleMissingStyleImage) {
        mapRef.current?.off?.("styleimagemissing", handleMissingStyleImage);
      }
      if (handleMapError) {
        mapRef.current?.off?.("error", handleMapError);
      }
      forEach(lodashValues(markerRefs.current), (marker) => marker?.remove());
      markerRefs.current = {
        start: null,
        end: null,
        current: null,
      };
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
      didInitialLiveCenterRef.current = false;
    };
  }, [maplibregl, onError]);

  React.useEffect(() => {
    const map = mapRef.current;

    if (!map || !styleUrl || currentStyleUrlRef.current === styleUrl) {
      return;
    }

    if (!isReady || !readyRef.current || typeof map.setStyle !== "function") {
      return;
    }

    try {
      currentStyleUrlRef.current = styleUrl;
      readyRef.current = false;
      setIsReady(false);
      map.setStyle(styleUrl);
    } catch {
      onError?.();
    }
  }, [isReady, onError, styleUrl]);

  React.useEffect(() => {
    const map = mapRef.current;

    if (!map || !isReady) {
      return;
    }

    ensureRouteLayers(map);
    const source = map.getSource(ROUTE_SOURCE_ID);
    source?.setData(buildRouteFeatureCollection(coordinates));

    if (coordinates[0]) {
      if (!markerRefs.current.start) {
        markerRefs.current.start = new maplibregl.Marker({
          element: createRouteMarker("start"),
          anchor: "center",
        })
          .setLngLat(coordinates[0])
          .addTo(map);
      } else {
        markerRefs.current.start.setLngLat(coordinates[0]);
      }
    } else if (markerRefs.current.start) {
      markerRefs.current.start.remove();
      markerRefs.current.start = null;
    }

    const endCoordinate = coordinates.at(-1);
    if (live) {
      if (endCoordinate) {
        if (!markerRefs.current.current) {
          markerRefs.current.current = new maplibregl.Marker({
            element: createCurrentLocationMarker(),
            anchor: "center",
          })
            .setLngLat(endCoordinate)
            .addTo(map);
        } else {
          markerRefs.current.current.setLngLat(endCoordinate);
        }
      } else if (markerRefs.current.current) {
        markerRefs.current.current.remove();
        markerRefs.current.current = null;
      }

      if (markerRefs.current.end) {
        markerRefs.current.end.remove();
        markerRefs.current.end = null;
      }

      if (endCoordinate && !didInitialLiveCenterRef.current) {
        moveMapToLatestCoordinate({
          map,
          coordinate: endCoordinate,
          initial: true,
        });
        didInitialLiveCenterRef.current = true;
      } else if (endCoordinate) {
        const now = Date.now();

        if (now - lastFollowAtRef.current > 900) {
          moveMapToLatestCoordinate({ map, coordinate: endCoordinate });
          lastFollowAtRef.current = now;
        }
      }

      return;
    }

    if (endCoordinate) {
      if (!markerRefs.current.end) {
        markerRefs.current.end = new maplibregl.Marker({
          element: createRouteMarker("end"),
          anchor: "center",
        })
          .setLngLat(endCoordinate)
          .addTo(map);
      } else {
        markerRefs.current.end.setLngLat(endCoordinate);
      }
    } else if (markerRefs.current.end) {
      markerRefs.current.end.remove();
      markerRefs.current.end = null;
    }

    if (markerRefs.current.current) {
      markerRefs.current.current.remove();
      markerRefs.current.current = null;
    }

    fitRouteBounds({
      map,
      maplibregl,
      coordinates,
      center,
    });
  }, [center, coordinates, isReady, live, maplibregl]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-[inherit]"
      data-testid="maplibre-map"
      data-coordinate-count={coordinateCount}
    />
  );
};

const MapOverlay = ({
  showExpand,
  expandLabel,
  onExpand,
  showQuality,
  qualityScore,
  labels,
  compact,
}) => (
  <>
    <MapExpandButton
      showExpand={showExpand}
      expandLabel={expandLabel}
      onExpand={onExpand}
    />
    {showQuality ? (
      <RouteQualityCard
        qualityScore={qualityScore}
        labels={labels}
        compact={compact}
      />
    ) : null}
  </>
);

const defaultLabels = {
  loading: "Xarita yuklanmoqda…",
  error: "Xarita ishlamadi",
  routePreviewLabel: "Route preview",
  qualityLabel: "Route quality",
  unavailableTitle: "Route yo'q",
  unavailableDescription: "GPS nuqtalar kutilmoqda",
  greatTitle: "Great route!",
  greatDescription: "Smooth & safe",
  fairTitle: "Needs review",
  fairDescription: "Some GPS drift",
  weakTitle: "Weak GPS",
  weakDescription: "Route was noisy",
};

const RunMapPanel = ({
  points = [],
  polyline = null,
  title = "Route map",
  emptyLabel = "No route recorded",
  loadingLabel,
  errorLabel,
  provider = "maplibre",
  variant = "full",
  qualityScore = null,
  showQuality = variant === "preview",
  showExpand = false,
  expandLabel = "Expand route preview",
  onExpand,
  className,
  contentClassName,
  surfaceClassName,
  labels: labelsProp = {},
}) => {
  const labels = React.useMemo(
    () => ({
      ...defaultLabels,
      ...labelsProp,
      loading: loadingLabel ?? labelsProp.loading ?? defaultLabels.loading,
      error: errorLabel ?? labelsProp.error ?? defaultLabels.error,
    }),
    [errorLabel, labelsProp, loadingLabel],
  );
  const routeCoordinates = React.useMemo(
    () => getRouteCoordinates({ points, polyline }),
    [points, polyline],
  );
  const mapTheme = useMapTheme();
  const [mapComponents, setMapComponents] = React.useState(null);
  const [loadState, setLoadState] = React.useState("idle");
  const isPreview = variant === "preview";
  const isLive = variant === "live";

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (routeCoordinates.length === 0 && provider === "none") {
      setMapComponents(null);
      setLoadState("idle");
      return undefined;
    }

    let cancelled = false;
    setLoadState("loading");

    loadMapProvider(provider)
      .then((components) => {
        if (cancelled) {
          return;
        }

        setMapComponents(components);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setMapComponents(null);
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [provider]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const routeCenter = getRouteCenter(routeCoordinates);
  const center = getMapCenter(routeCoordinates);
  const mapStyleUrl = getMapStyleUrl(mapComponents, mapTheme);
  const handleMapError = React.useCallback(() => {
    setMapComponents((current) => (current === null ? current : null));
    setLoadState((current) => (current === "error" ? current : "error"));
  }, []);

  const surface = (
    <div
      className={cn(
        "relative h-[320px] min-h-[260px] overflow-hidden rounded-[1.5rem] bg-[#17120d] md:h-[460px]",
        isPreview && "h-full min-h-[300px] rounded-[1.25rem] md:h-full",
        isLive && "h-full min-h-0 rounded-none md:h-full",
        surfaceClassName,
      )}
    >
      {loadState === "idle" || loadState === "loading" ? (
        <RouteSvgFallback
          coordinates={routeCoordinates}
          label={labels.loading}
          qualityScore={qualityScore}
          labels={labels}
          showQuality={showQuality}
        />
      ) : loadState === "error" || mapComponents?.type !== "maplibre" ? (
        <RouteSvgFallback
          coordinates={routeCoordinates}
          label={labels.error}
          qualityScore={qualityScore}
          labels={labels}
          showQuality={showQuality}
        />
      ) : (
        <>
          <MapLibreRouteMap
            center={center}
            coordinates={routeCoordinates}
            live={isLive}
            mapProvider={mapComponents}
            styleUrl={mapStyleUrl}
            routeCenter={routeCenter}
            onError={handleMapError}
          />
          <MapOverlay
            showExpand={showExpand}
            expandLabel={expandLabel}
            onExpand={onExpand}
            showQuality={showQuality}
            qualityScore={qualityScore}
            labels={labels}
            compact={isPreview}
          />
          {routeCoordinates.length === 0 && emptyLabel ? (
            <p className="absolute left-4 top-4 max-w-[60%] rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur">
              {emptyLabel}
            </p>
          ) : null}
        </>
      )}
    </div>
  );

  if (isPreview || isLive) {
    return <div className={cn("relative", className)}>{surface}</div>;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={cn("p-0", contentClassName)}>
        {surface}
      </CardContent>
    </Card>
  );
};

export default RunMapPanel;



