import React from "react";
import { Routes, Route, Navigate } from "react-router";

import ListPage from "./list/index.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";

const ChallengesModule = () => (
  <Routes>
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<CreatePage />} />
      <Route path="edit/:id" element={<EditPage />} />
    </Route>
    <Route index element={<Navigate to="list" replace />} />
  </Routes>
);

export default ChallengesModule;
