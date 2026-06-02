import lodashValues from "lodash/values";
import toPairs from "lodash/toPairs";
import map from "lodash/map";
import filter from "lodash/filter";
import find from "lodash/find";
import compact from "lodash/compact";
import join from "lodash/join";
import fromPairs from "lodash/fromPairs";
import isArray from "lodash/isArray";
import trim from "lodash/trim";
import toLower from "lodash/toLower";
const normalizeText = (value) => trim(String(value ?? ""));

export const resolveTranslatedLocationLabel = (
  translations,
  fallback,
  language,
) => {
  if (translations && typeof translations === "object" && !isArray(translations)) {
    const direct = normalizeText(translations[language]);
    if (direct) {
      return direct;
    }

    const uz = normalizeText(translations.uz);
    if (uz) {
      return uz;
    }

    const firstVal = find(lodashValues(translations), (value) => typeof value === "string" && normalizeText(value));
    if (typeof firstVal === "string" && normalizeText(firstVal)) {
      return normalizeText(firstVal);
    }
  }

  return normalizeText(fallback);
};

export const cleanLocationTranslations = (translations = {}) =>
  fromPairs(filter(
    map(toPairs(translations), ([key, value]) => [toLower(normalizeText(key)), normalizeText(value)]),
    ([key, value]) => Boolean(key) && Boolean(value),
  ));

export const countFilledLocationTranslations = (translations = {}) =>
  filter(lodashValues(translations), (value) => typeof value === "string" && normalizeText(value)).length;

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



