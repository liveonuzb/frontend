import React from "react";
import { Navigate, Route, Routes } from "react-router";

import RecipePage from "@/modules/admin/containers/foods/recipe/index.jsx";
import TranslatePage from "@/modules/admin/containers/foods/translation/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import ListPage from "./list/index.jsx";
import PreviewPage from "./preview/index.jsx";

const RecipesIndex = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<ListPage />}>
        <Route path="create" element={<CreatePage />} />
        <Route path="edit/:id" element={<EditPage />} />
        <Route path="translate/:id" element={<TranslatePage />} />
        <Route path="recipe/:id" element={<RecipePage />} />
        <Route path="preview/:id" element={<PreviewPage />} />
      </Route>
    </Routes>
  );
};

export default RecipesIndex;
