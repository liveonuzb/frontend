import React from "react";
import { MapIcon, Maximize2Icon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadMapProvider } from "@/lib/maps";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = [69.240562, 41.311081];
const SVG_SIZE = 360;
const SVG_PADDING = 54;

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
  points
    .map((point) => {
      const latitude = Number(point?.latitude);
      const longitude = Number(point?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return [roundCoordinate(longitude), roundCoordinate(latitude)];
    })
    .filter(Boolean);

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

  const totals = coordinates.reduce(
    (acc, [longitude, latitude]) => ({
      longitude: acc.longitude + longitude,
      latitude: acc.latitude + latitude,
    }),
    { longitude: 0, latitude: 0 },
  );

  return [
    roundCoordinate(totals.longitude / coordinates.length),
    roundCoordinate(totals.latitude / coordinates.length),
  ];
};

const projectCoordinates = (coordinates) => {
  if (coordinates.length === 0) {
    return [];
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeSpan = maxLongitude - minLongitude;
  const latitudeSpan = maxLatitude - minLatitude;
  const drawableSize = SVG_SIZE - SVG_PADDING * 2;

  return coordinates.map(([longitude, latitude]) => {
    const x =
      longitudeSpan > 0
        ? SVG_PADDING + ((longitude - minLongitude) / longitudeSpan) * drawableSize
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
  points.map(([x, y]) => `${x},${y}`).join(" ");

const normalizeQualityScore = (score) => {
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore) || numericScore <= 0) {
    return null;
  }

  return Math.min(100, Math.round(numericScore <= 1 ? numericScore * 100 : numericScore));
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
        "relative h-full min-h-[260px] overflow-hidden rounded-[1.5rem] bg-[#17120d]",
        compact && "min-h-0 rounded-[1.25rem]",
      )}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(34deg, transparent 0 44%, rgba(255,255,255,.16) 45% 47%, transparent 48%), linear-gradient(118deg, transparent 0 35%, rgba(255,255,255,.13) 36% 38%, transparent 39%), linear-gradient(8deg, transparent 0 54%, rgba(255,255,255,.1) 55% 57%, transparent 58%), linear-gradient(90deg, transparent 0 64%, rgba(255,255,255,.08) 65% 67%, transparent 68%)",
          backgroundSize: "118px 118px, 136px 136px, 96px 96px, 132px 132px",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1b1510] to-transparent" />
      {showExpand ? (
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
      ) : null}
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
            <linearGradient id={`${svgId}-route-gradient`} x1="0" x2="1" y1="0" y2="1">
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
            <MapIcon className="mx-auto size-8 text-[#f59e0b]" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-white/80">{label}</p>
          </div>
        </div>
      )}
      {hasRoute && label ? (
        <p className="absolute left-4 top-4 max-w-[60%] rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-medium text-white/75 backdrop-blur">
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
  provider = "yandex",
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
  const routeKey = React.useMemo(
    () => JSON.stringify(routeCoordinates),
    [routeCoordinates],
  );
  const [mapComponents, setMapComponents] = React.useState(null);
  const [loadState, setLoadState] = React.useState("idle");
  const isPreview = variant === "preview";

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (isPreview || routeCoordinates.length === 0) {
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
  }, [isPreview, provider, routeCoordinates.length, routeKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const center = getMapCenter(routeCoordinates);
  const routeCenter = getRouteCenter(routeCoordinates);
  const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapFeature,
    YMapMarker,
  } = mapComponents ?? {};

  const surface = (
    <div
      className={cn(
        "h-[320px] min-h-[260px] bg-[#17120d] md:h-[460px]",
        isPreview && "h-full min-h-[300px] md:h-full",
        surfaceClassName,
      )}
    >
      {routeCoordinates.length === 0 ? (
        <RouteSvgFallback
          coordinates={[]}
          label={emptyLabel}
          qualityScore={qualityScore}
          labels={labels}
          showQuality={showQuality}
          showExpand={showExpand}
          expandLabel={expandLabel}
          onExpand={onExpand}
          compact={isPreview}
        />
      ) : isPreview ? (
        <RouteSvgFallback
          coordinates={routeCoordinates}
          label={emptyLabel}
          qualityScore={qualityScore}
          labels={labels}
          showQuality={showQuality}
          showExpand={showExpand}
          expandLabel={expandLabel}
          onExpand={onExpand}
          compact
        />
      ) : loadState === "loading" ? (
        <RouteSvgFallback
          coordinates={routeCoordinates}
          label={labels.loading}
          live
          qualityScore={qualityScore}
          labels={labels}
          showQuality={showQuality}
        />
      ) : loadState === "error" || !YMap ? (
        <RouteSvgFallback
          coordinates={routeCoordinates}
          label={labels.error}
          qualityScore={qualityScore}
          labels={labels}
          showQuality={showQuality}
        />
      ) : (
        <YMap
          key={routeKey}
          location={{
            center: routeCenter,
            zoom: routeCoordinates.length > 1 ? 15 : 16,
          }}
        >
          {YMapDefaultSchemeLayer ? <YMapDefaultSchemeLayer /> : null}
          {YMapDefaultFeaturesLayer ? <YMapDefaultFeaturesLayer /> : null}
          {YMapFeature && routeCoordinates.length > 1 ? (
            <YMapFeature
              geometry={{
                type: "LineString",
                coordinates: routeCoordinates,
              }}
              style={{
                stroke: [
                  { color: "#fbbf24", width: 9, opacity: 0.28 },
                  { color: "#f97316", width: 5 },
                ],
              }}
            />
          ) : null}
          {YMapMarker && routeCoordinates[0] ? (
            <YMapMarker coordinates={routeCoordinates[0]}>
              <div className="size-4 rounded-full border-2 border-white bg-[#7cc765] shadow" />
            </YMapMarker>
          ) : null}
          {YMapMarker ? (
            <YMapMarker coordinates={center}>
              <div className="size-4 rounded-full border-2 border-white bg-[#ef3f24] shadow" />
            </YMapMarker>
          ) : null}
        </YMap>
      )}
    </div>
  );

  if (isPreview) {
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
