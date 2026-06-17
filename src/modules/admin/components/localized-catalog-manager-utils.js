import get from "lodash/get";
import trim from "lodash/trim";

export const buildLocalizedCatalogPayload = ({
  form,
  currentLanguage,
  includeTagMapping = false,
}) => ({
  name: trim(get(form, "name", "")),
  isActive: get(form, "isActive"),
  isOnboarding: get(form, "isOnboarding"),
  translations: {
    [currentLanguage]: trim(get(form, "name", "")),
  },
  ...(includeTagMapping
    ? {
        dietaryTags: get(form, "dietaryTags", []),
        allergenTags: get(form, "allergenTags", []),
      }
    : {}),
});
