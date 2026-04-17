import React from "react";
import { get, filter, find, map, orderBy, findIndex } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteQuery, useGetQuery, usePostQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";

export const MEASUREMENTS_QUERY_KEY = ["measurements"];
export const MEASUREMENTS_TRENDS_QUERY_KEY = [
  ...MEASUREMENTS_QUERY_KEY,
  "trends",
];

export const DEFAULT_MEASUREMENTS = {
  weight: 0,
  chest: 0,
  waist: 0,
  hips: 0,
  arm: 0,
  thigh: 0,
  neck: 0,
  bodyFat: 0,
};

const normalizeDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }
  return value.toISOString().split("T")[0];
};

export const normalizeMeasurementEntry = (entry = {}) => ({
  id: get(entry, "id"),
  date: normalizeDateKey(get(entry, "date")),
  weight: get(entry, "weight", 0),
  chest: get(entry, "chest", 0),
  waist: get(entry, "waist", 0),
  hips: get(entry, "hips", 0),
  arm: get(entry, "arm", 0),
  thigh: get(entry, "thigh", 0),
  neck: get(entry, "neck", 0),
  bodyFat: get(entry, "bodyFat", 0),
});

const sortHistory = (history) =>
  orderBy(history, [(entry) => get(entry, "date", "")], ["desc"]);

const normalizeHistory = (entries = []) =>
  sortHistory(map(entries, (entry) => normalizeMeasurementEntry(entry)));

const setMeasurementsCache = (queryClient, history) => {
  queryClient.setQueryData(MEASUREMENTS_QUERY_KEY, {
    data: normalizeHistory(history),
  });
};

const invalidateMeasurementQueries = (queryClient) =>
  queryClient.invalidateQueries({
    queryKey: MEASUREMENTS_TRENDS_QUERY_KEY,
  });

const mergeMeasurementEntry = (history, entry) => {
  const normalizedEntry = normalizeMeasurementEntry(entry);
  const nextHistory = [...history];
  const entryId = get(normalizedEntry, "id");
  const entryDate = get(normalizedEntry, "date");

  const existingIndex = findIndex(
    nextHistory,
    (item) => get(item, "id") === entryId || get(item, "date") === entryDate,
  );

  if (existingIndex >= 0) {
    nextHistory[existingIndex] = {
      ...nextHistory[existingIndex],
      ...normalizedEntry,
    };
    return normalizeHistory(nextHistory);
  }

  return normalizeHistory([normalizedEntry, ...nextHistory]);
};

const toMeasurementPayload = (entry = {}) => ({
  date: normalizeDateKey(get(entry, "date")),
  weight: get(entry, "weight"),
  chest: get(entry, "chest"),
  waist: get(entry, "waist"),
  hips: get(entry, "hips"),
  arm: get(entry, "arm"),
  thigh: get(entry, "thigh"),
  neck: get(entry, "neck"),
  bodyFat: get(entry, "bodyFat"),
});

export const useMeasurements = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/measurements",
    queryProps: {
      queryKey: MEASUREMENTS_QUERY_KEY,
    },
  });
  const { mutateAsync: saveMutation, isPending: isSaving } = usePostQuery();
  const { mutateAsync: deleteMutation, isPending: isDeleting } =
    useDeleteQuery();

  const history = React.useMemo(
    () => normalizeHistory(getApiResponseData(data, [])),
    [data],
  );

  const getLatest = React.useCallback(
    () => get(history, "[0]") ?? { date: "", ...DEFAULT_MEASUREMENTS },
    [history],
  );

  const getChange = React.useCallback(
    (id) => {
      if (get(history, "length", 0) < 2) return 0;
      return (
        (get(history, `[0].${id}`) ?? 0) - (get(history, `[1].${id}`) ?? 0)
      );
    },
    [history],
  );

  const saveMeasurement = React.useCallback(
    async (entry) => {
      const entryDate = normalizeDateKey(get(entry, "date"));
      const existingEntry =
        find(history, (item) => get(item, "date") === entryDate) ??
        find(
          history,
          (item) => !entryDate && get(entry, "id") === get(item, "id"),
        );
      const optimisticEntry = normalizeMeasurementEntry({
        ...existingEntry,
        ...entry,
        date: entryDate,
        id: get(existingEntry, "id") ?? `optimistic-${Date.now()}`,
      });
      const snapshot = queryClient.getQueryData(MEASUREMENTS_QUERY_KEY);
      setMeasurementsCache(
        queryClient,
        mergeMeasurementEntry(history, optimisticEntry),
      );

      try {
        const response = await saveMutation({
          url: "/measurements",
          attributes: toMeasurementPayload(entry),
        });
        const savedEntry = normalizeMeasurementEntry(
          getApiResponseData(response, {}),
        );
        setMeasurementsCache(
          queryClient,
          mergeMeasurementEntry(
            get(queryClient.getQueryData(MEASUREMENTS_QUERY_KEY), "data", []),
            savedEntry,
          ),
        );
        await invalidateMeasurementQueries(queryClient);
        return savedEntry;
      } catch (error) {
        if (snapshot)
          queryClient.setQueryData(MEASUREMENTS_QUERY_KEY, snapshot);
        throw error;
      }
    },
    [history, queryClient, saveMutation],
  );

  const deleteMeasurement = React.useCallback(
    async (entryIdOrDate) => {
      const target = find(
        history,
        (entry) =>
          get(entry, "id") === entryIdOrDate ||
          get(entry, "date") === entryIdOrDate,
      );

      const targetId = get(target, "id");
      if (!targetId) {
        return;
      }

      const snapshot = queryClient.getQueryData(MEASUREMENTS_QUERY_KEY);
      const nextHistory = filter(
        history,
        (entry) => get(entry, "id") !== targetId,
      );
      setMeasurementsCache(queryClient, nextHistory);

      try {
        await deleteMutation({
          url: `/measurements/${targetId}`,
        });
        await invalidateMeasurementQueries(queryClient);
      } catch (error) {
        if (snapshot)
          queryClient.setQueryData(MEASUREMENTS_QUERY_KEY, snapshot);
        throw error;
      }
    },
    [deleteMutation, history, queryClient],
  );

  return {
    ...query,
    history,
    getLatest,
    getChange,
    saveMeasurement,
    deleteMeasurement,
    isSaving,
    isDeleting,
  };
};

export default useMeasurements;
