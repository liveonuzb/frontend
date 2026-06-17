import React from "react";
import { Navigate, Route } from "react-router";

import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import FoodRecipeDrawer from "@/modules/admin/containers/foods/recipe/index.jsx";
import TranslatePage from "@/modules/admin/containers/foods/translation/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import ListPage from "./list/index.jsx";
import PreviewPage from "./preview/index.jsx";

const RecipePage = () => <FoodRecipeDrawer mode="recipe" />;

const RecipesIndex = () => {
  return (
    <ProfileAwareRoutes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<ListPage />}>
        <Route path="create" element={<CreatePage />} />
        <Route path="edit/:id" element={<EditPage />} />
        <Route path="translate/:id" element={<TranslatePage />} />
        <Route path="recipe/:id" element={<RecipePage />} />
        <Route path="preview/:id" element={<PreviewPage />} />
      </Route>
    </ProfileAwareRoutes>
  );
};

export default RecipesIndex;
