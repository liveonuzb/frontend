import React from "react";
import { useTranslation } from "react-i18next";

const recipeKey = (key) => `user.nutrition.recipes.${key}`;

export const useRecipeTranslation = () => {
  const { t } = useTranslation();

  return React.useCallback((key, options) => t(recipeKey(key), options), [t]);
};

export default useRecipeTranslation;
