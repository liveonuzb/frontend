import React from "react";
import { Route, Navigate } from "react-router";

import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import ListPage from "./list/index.jsx";
import CreatePage from "./create/index.jsx";
import DetailPage from "./detail/index.jsx";
import EditPage from "./edit/index.jsx";
import WorkspacePage from "./workspace/index.jsx";

const UsersIndex = () => {
  return (
    <ProfileAwareRoutes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<ListPage />}>
        <Route path="create" element={<CreatePage />} />
        <Route path="detail/:id" element={<DetailPage />} />
        <Route path="edit/:id" element={<EditPage />} />
      </Route>
      <Route path=":id" element={<WorkspacePage />} />
    </ProfileAwareRoutes>
  );
};

export default UsersIndex;
