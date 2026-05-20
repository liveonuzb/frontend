import { filter, isArray, reduce, some, toNumber, trim, map } from "lodash";
export const normalizeChipLabel = (value) =>
  trim(String(value ?? "").replace(/\s+/g, " "));

export const normalizeChipKey = (value) =>
  normalizeChipLabel(value).toLocaleLowerCase("uz-UZ");

export const normalizeCustomChips = (values = []) => {
  if (!isArray(values)) return [];

  const seen = new Set();
  return reduce(values, (acc, value) => {
    const label = normalizeChipLabel(value);
    const key = normalizeChipKey(label);

    if (!label || seen.has(key)) {
      return acc;
    }

    seen.add(key);
    acc.push(label);
    return acc;
  }, []);
};

export const hasChipLabel = (values = [], label) => {
  const key = normalizeChipKey(label);
  return some(values, (value) => normalizeChipKey(value) === key);
};

export const toPositiveId = (value) => {
  const id = toNumber(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const normalizeSelectedIds = (values = []) =>
  isArray(values)
    ? Array.from(new Set(filter(map(values, toPositiveId), (value) => value !== null)))
    : [];
