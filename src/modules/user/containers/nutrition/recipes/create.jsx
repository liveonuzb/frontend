import React from "react";
import { useNavigate } from "react-router";
import { useBreadcrumbStore } from "@/store";
import RecipeCreateWizard from "./components/recipe-create-wizard.jsx";

const NutritionRecipeCreatePage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user/dashboard", title: "Bosh sahifa" },
      { url: "/user/nutrition/overview", title: "Ovqatlanish" },
      { url: "/user/nutrition/recipes", title: "Retseptlar" },
      { url: "/user/nutrition/recipes/create", title: "Yangi retsept yaratish" },
    ]);

    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <RecipeCreateWizard
      onCancel={() => navigate("/user/nutrition/recipes")}
      onComplete={() => {}}
    />
  );
};

export default NutritionRecipeCreatePage;
