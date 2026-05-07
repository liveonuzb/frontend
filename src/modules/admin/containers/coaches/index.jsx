import React from "react";
import { Navigate, Route, Routes } from "react-router";

import ListPage from "./list/index.jsx";
import DetailPage from "./detail/index.jsx";
import WorkspacePage from "./workspace/index.jsx";

const CoachesIndex = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="list" replace />} />
      <Route path="list" element={<ListPage />}>
        <Route path="detail/:id" element={<DetailPage />} />
      </Route>
      <Route path=":id" element={<WorkspacePage />} />
    </Routes>
  );
};

export default CoachesIndex;
