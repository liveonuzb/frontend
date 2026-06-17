import React from "react";
import get from "lodash/get";
import toNumber from "lodash/toNumber";
import { useGetQuery } from "@/hooks/api";

export const WORKOUT_WEATHER_QUERY_KEY = ["user", "workout", "weather", "today"];

const TASHKENT_COORDINATES = {
  latitude: 41.311081,
  longitude: 69.240562,
};

const defaultWeather = {
  location: "Tashkent",
  temperatureC: null,
  feelsLikeC: null,
  condition: "Ob-havo yuklanmoqda",
  humidity: null,
  windKph: null,
  aqi: null,
  aqiLabel: "Unknown",
  pm25: null,
  source: "fallback",
  updatedAt: null,
};

const resolveResponseData = (response, fallback = defaultWeather) =>
  get(response, "data.data", get(response, "data", fallback));

const normalizeWeather = (payload = {}) => ({
  location: payload.location || defaultWeather.location,
  temperatureC:
    payload.temperatureC === undefined || payload.temperatureC === null
      ? null
      : toNumber(payload.temperatureC),
  feelsLikeC:
    payload.feelsLikeC === undefined || payload.feelsLikeC === null
      ? null
      : toNumber(payload.feelsLikeC),
  condition: payload.condition || defaultWeather.condition,
  humidity:
    payload.humidity === undefined || payload.humidity === null
      ? null
      : toNumber(payload.humidity),
  windKph:
    payload.windKph === undefined || payload.windKph === null
      ? null
      : toNumber(payload.windKph),
  aqi:
    payload.aqi === undefined || payload.aqi === null ? null : toNumber(payload.aqi),
  aqiLabel: payload.aqiLabel || defaultWeather.aqiLabel,
  pm25:
    payload.pm25 === undefined || payload.pm25 === null
      ? null
      : toNumber(payload.pm25),
  source: payload.source || defaultWeather.source,
  updatedAt: payload.updatedAt || null,
});

export const useWorkoutWeatherToday = (options = {}) => {
  const [coordinates, setCoordinates] = React.useState(null);
  const [locationStatus, setLocationStatus] = React.useState("pending");
  const enabled = options.enabled ?? true;

  React.useEffect(() => {
    if (!enabled || coordinates) {
      return undefined;
    }

    let isCurrent = true;
    const applyFallbackLocation = () => {
      if (!isCurrent) {
        return;
      }

      setCoordinates(TASHKENT_COORDINATES);
      setLocationStatus("fallback");
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation?.getCurrentPosition
    ) {
      queueMicrotask(applyFallbackLocation);
      return () => {
        isCurrent = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isCurrent) {
          return;
        }

        setCoordinates({
          latitude: toNumber(position.coords.latitude),
          longitude: toNumber(position.coords.longitude),
        });
        setLocationStatus("granted");
      },
      applyFallbackLocation,
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30 * 60 * 1000,
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [coordinates, enabled]);

  const queryString = coordinates
    ? new URLSearchParams({
        lat: String(coordinates.latitude),
        lon: String(coordinates.longitude),
      }).toString()
    : "";

  const { data, ...query } = useGetQuery({
    url: queryString
      ? `/user/workout/weather/today?${queryString}`
      : "/user/workout/weather/today",
    queryProps: {
      queryKey: [...WORKOUT_WEATHER_QUERY_KEY, coordinates],
      enabled: Boolean(enabled && coordinates),
      staleTime: 10 * 60 * 1000,
      retry: 1,
    },
  });

  const weather = React.useMemo(
    () => normalizeWeather(resolveResponseData(data)),
    [data],
  );

  return {
    ...query,
    data,
    weather,
    coordinates,
    locationStatus,
    isLocationFallback: locationStatus === "fallback",
  };
};

export default useWorkoutWeatherToday;
