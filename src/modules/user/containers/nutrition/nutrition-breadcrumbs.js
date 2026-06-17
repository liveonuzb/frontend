import React from "react";

export const getNutritionBreadcrumbTitle = (entryView) => {
  if (entryView === "plans") {
    return "Ovqatlanish rejalari";
  }

  if (entryView === "report") {
    return "Ovqatlanish hisobotlari";
  }

  return "Ovqatlanish";
};

export const useNutritionBreadcrumbs = (entryView, setBreadcrumbs) => {
  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      {
        url: "/user/nutrition/overview",
        title: getNutritionBreadcrumbTitle(entryView),
      },
    ]);
  }, [entryView, setBreadcrumbs]);
};
