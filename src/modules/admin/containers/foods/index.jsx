import React from "react";
import { Route, Navigate } from "react-router";

import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import ListPage from "./list/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import TranslatePage from "./translation/index.jsx";
import RecipePage from "./recipe/index.jsx";

const FoodsIndex = () => {
  return (
    <ProfileAwareRoutes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<ListPage />}>
        <Route path="create" element={<CreatePage />} />
        <Route path="edit/:id" element={<EditPage />} />
        <Route path="translate/:id" element={<TranslatePage />} />
        <Route path="recipe/:id" element={<RecipePage />} />
      </Route>
    </ProfileAwareRoutes>
  );
};

export default FoodsIndex;
