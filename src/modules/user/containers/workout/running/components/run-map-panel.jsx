import React from "react";
import { MapIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadMapProvider } from "@/lib/maps";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = [69.240562, 41.311081];

const roundCoordinate = (value) => Math.round(value * 1e6) / 1e6;

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

const getMapCenter = (coordinates) =>
  coordinates.length > 0 ? coordinates[coordinates.length - 1] : DEFAULT_CENTER;

const RouteFallback = ({ label }) => (
  <div className="flex h-full min-h-[260px] items-center justify-center p-6 text-center">
    <div>
      <MapIcon className="mx-auto size-8 text-primary" />
      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  </div>
);

const RunMapPanel = ({
  points = [],
  polyline = null,
  title = "Route map",
  emptyLabel = "No route recorded",
  provider = "yandex",
  className,
  contentClassName,
}) => {
  const routeCoordinates = React.useMemo(() => {
    const pointCoordinates = normalizePointCoordinates(points);
    return pointCoordinates.length > 0
      ? pointCoordinates
      : decodeGooglePolyline(polyline);
  }, [points, polyline]);
  const routeKey = React.useMemo(
    () => JSON.stringify(routeCoordinates),
    [routeCoordinates],
  );
  const [mapComponents, setMapComponents] = React.useState(null);
  const [loadState, setLoadState] = React.useState("idle");

  React.useEffect(() => {
    if (routeCoordinates.length === 0) {
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
  }, [provider, routeCoordinates.length, routeKey]);

  const center = getMapCenter(routeCoordinates);
  const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapFeature,
    YMapMarker,
  } = mapComponents ?? {};

  return (
    <Card className={cn("overflow-hidden", className)}>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={cn("p-0", contentClassName)}>
        <div className="h-[320px] min-h-[260px] bg-muted/30">
          {routeCoordinates.length === 0 ? (
            <RouteFallback label={emptyLabel} />
          ) : loadState === "loading" ? (
            <RouteFallback label="Loading map" />
          ) : loadState === "error" || !YMap ? (
            <RouteFallback label="Map unavailable" />
          ) : (
            <YMap
              key={routeKey}
              location={{
                center,
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
                    stroke: [{ color: "#16a34a", width: 5 }],
                  }}
                />
              ) : null}
              {YMapMarker ? (
                <YMapMarker coordinates={center}>
                  <div className="size-4 rounded-full border-2 border-background bg-primary shadow" />
                </YMapMarker>
              ) : null}
            </YMap>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RunMapPanel;
