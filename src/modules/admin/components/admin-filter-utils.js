import { find, get, isEqual } from "lodash";

export const ADMIN_TEXT_OPERATORS = [
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is",
  "empty",
  "not_empty",
];

export const ADMIN_SELECT_OPERATORS = ["is", "is_not", "empty", "not_empty"];
export const ADMIN_SORT_DIRECTIONS = ["asc", "desc"];

export const clampAdminPage = (value) => Math.max(1, Number(value) || 1);

export const clampAdminPageSize = (value, fallback = 10, max = 100) =>
  Math.min(max, Math.max(1, Number(value) || fallback));

export const buildAdminSortingState = ({
  sortBy,
  sortDir,
  defaultSortBy,
  defaultSortDir,
}) =>
  sortBy === defaultSortBy && sortDir === defaultSortDir
    ? []
    : [{ id: sortBy, desc: sortDir === "desc" }];

export const getAdminFilterReader = (filters) => {
  const getFilter = (field) =>
    find(filters, (item) => isEqual(get(item, "field"), field));

  return {
    getFilter,
    getValue: (field, fallback = "") =>
      get(getFilter(field), "values[0]", fallback),
    getOperator: (field, fallback = "is") =>
      get(getFilter(field), "operator", fallback),
    isVisible: (field) => Boolean(getFilter(field)),
  };
};

export const isAdminEmptyOperator = (operator) =>
  operator === "empty" || operator === "not_empty";

export const makeAdminTextActiveFilter = ({
  field,
  value,
  operator = "contains",
  visible = false,
}) => {
  const normalizedValue = String(value ?? "").trim();
  if (!visible && !normalizedValue && !isAdminEmptyOperator(operator)) {
    return null;
  }

  return {
    id: field,
    field,
    operator,
    values: isAdminEmptyOperator(operator) ? [] : [value],
  };
};

export const makeAdminSelectActiveFilter = ({
  field,
  value,
  operator = "is",
  visible = false,
  emptyValue = "all",
}) => {
  if (
    !visible &&
    isEqual(value, emptyValue) &&
    !isAdminEmptyOperator(operator)
  ) {
    return null;
  }

  return {
    id: field,
    field,
    operator,
    values: isAdminEmptyOperator(operator) ? [] : [value],
  };
};

export const buildAdminFilterParams = (filters) =>
  filters.reduce((params, filter) => {
    const {
      key,
      opKey = `${key}Op`,
      value,
      operator,
      defaultOperator = "is",
      emptyValue = "all",
      trim = false,
      includeOperator = true,
    } = filter;
    const normalizedValue =
      typeof value === "string" && trim ? value.trim() : value;
    const hasValue =
      isAdminEmptyOperator(operator) ||
      (typeof normalizedValue === "string"
        ? normalizedValue.length > 0
        : !isEqual(normalizedValue, emptyValue));

    if (!isAdminEmptyOperator(operator) && hasValue) {
      params[key] = normalizedValue;
    }

    if (includeOperator && hasValue && operator !== defaultOperator) {
      params[opKey] = operator;
    }

    return params;
  }, {});
