import React from "react";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";

const STATUS_VALUES = ["all", "proposed", "scheduled", "completed", "cancelled"];
const VIEW_VALUES = ["list", "calendar"];

export const useSessionFilters = () => {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringEnum(STATUS_VALUES).withDefault("all"),
  );
  const [clientId, setClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault(""),
  );
  const [dateFrom, setDateFrom] = useQueryState(
    "dateFrom",
    parseAsString.withDefault(""),
  );
  const [dateTo, setDateTo] = useQueryState(
    "dateTo",
    parseAsString.withDefault(""),
  );
  const [view, setView] = useQueryState(
    "view",
    parseAsStringEnum(VIEW_VALUES).withDefault("list"),
  );
  const [pageQuery, setPageQuery] = useQueryState(
    "page",
    parseAsString.withDefault("1"),
  );

  const currentPage = Math.max(1, Number(pageQuery) || 1);
  const pageSize = 12;

  const setFilter = React.useCallback(
    (setter) => (value) => {
      React.startTransition(() => {
        void setter(value);
        void setPageQuery("1");
      });
    },
    [setPageQuery],
  );

  return {
    status,
    clientId,
    dateFrom,
    dateTo,
    view,
    currentPage,
    pageSize,
    setStatus: setFilter(setStatus),
    setClientId: setFilter(setClientId),
    setDateFrom: setFilter(setDateFrom),
    setDateTo: setFilter(setDateTo),
    setView,
    setPageQuery,
  };
};
