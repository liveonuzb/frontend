import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ListPage from "./list/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";

const AchievementsModule = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<CreatePage />} />
      <Route path="edit/:id" element={<EditPage />} />
    </Route>
  </Routes>
);

export default AchievementsModule;
