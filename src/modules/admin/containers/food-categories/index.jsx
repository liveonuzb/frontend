import React from "react";
import { Route, Routes, Navigate } from "react-router";

import ListPage from "./list/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import TranslatePage from "./translation/index.jsx";

const FoodCategoriesIndex = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<ListPage />}>
        <Route path="create" element={<CreatePage />} />
        <Route path="edit/:id" element={<EditPage />} />
        <Route path="translate/:id" element={<TranslatePage />} />
      </Route>
    </Routes>
  );
};

export default FoodCategoriesIndex;
