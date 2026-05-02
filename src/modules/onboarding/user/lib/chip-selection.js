export const normalizeChipLabel = (value) =>
  String(value ?? "").replace(/\s+/g, " ").trim();

export const normalizeChipKey = (value) =>
  normalizeChipLabel(value).toLocaleLowerCase("uz-UZ");

export const normalizeCustomChips = (values = []) => {
  if (!Array.isArray(values)) return [];

  const seen = new Set();
  return values.reduce((acc, value) => {
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
  return values.some((value) => normalizeChipKey(value) === key);
};

export const toPositiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const normalizeSelectedIds = (values = []) =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(toPositiveId).filter((value) => value !== null)))
    : [];
