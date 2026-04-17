import { values, toPairs, map, filter, find, compact, join } from "lodash";
const normalizeText = (value) => String(value ?? "").trim();

export const resolveTranslatedLocationLabel = (
  translations,
  fallback,
  language,
) => {
  if (translations && typeof translations === "object" && !Array.isArray(translations)) {
    const direct = normalizeText(translations[language]);
    if (direct) {
      return direct;
    }

    const uz = normalizeText(translations.uz);
    if (uz) {
      return uz;
    }

    const firstVal = find(values(translations), (value) => typeof value === "string" && normalizeText(value));
    if (typeof firstVal === "string" && normalizeText(firstVal)) {
      return normalizeText(firstVal);
    }
  }

  return normalizeText(fallback);
};

export const cleanLocationTranslations = (translations = {}) =>
  Object.fromEntries(
    filter(
      map(toPairs(translations), ([key, value]) => [normalizeText(key).toLowerCase(), normalizeText(value)]),
      ([key, value]) => Boolean(key) && Boolean(value),
    ),
  );

export const countFilledLocationTranslations = (translations = {}) =>
  filter(values(translations), (value) => typeof value === "string" && normalizeText(value)).length;

const localizeNodes = (nodes = [], language, parentPath = []) =>
  map(nodes, (node) => {
    const localizedName = resolveTranslatedLocationLabel(
      node.translations,
      node.name,
      language,
    );
    const localizedPath = [...parentPath, localizedName];
    const localizedChildren = localizeNodes(
      node.children || [],
      language,
      localizedPath,
    );

    return {
      ...node,
      name: localizedName,
      path: localizedPath,
      pathLabel: join(localizedPath, " / "),
      children: localizedChildren,
    };
  });

export const localizeLocationTree = (nodes = [], language) =>
  localizeNodes(nodes, language);

export const getTranslatedBranchLocationLabel = (branch, language) => {
  if (!branch) {
    return "";
  }

  const city = resolveTranslatedLocationLabel(
    branch.cityTranslations,
    branch.city,
    language,
  );
  const district = resolveTranslatedLocationLabel(
    branch.districtTranslations,
    branch.district,
    language,
  );
  const region = resolveTranslatedLocationLabel(
    branch.regionTranslations,
    branch.region,
    language,
  );
  const country = resolveTranslatedLocationLabel(
    branch.countryTranslations,
    branch.country,
    language,
  );

  return join(compact([city, district, region, country]), ", ");
};
