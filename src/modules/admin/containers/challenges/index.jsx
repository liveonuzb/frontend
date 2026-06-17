import React from "react";
import { Route, Navigate } from "react-router";

import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import ListPage from "./list/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import TranslationPage from "./translation/index.jsx";

const ChallengesModule = () => (
  <ProfileAwareRoutes>
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<CreatePage />} />
      <Route path="edit/:id" element={<EditPage />} />
      <Route path="translate/:id" element={<TranslationPage />} />
    </Route>
    <Route index element={<Navigate to="list" replace />} />
  </ProfileAwareRoutes>
);

export default ChallengesModule;
