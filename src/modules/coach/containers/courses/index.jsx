import React from "react";
import { Navigate, Route, Routes } from "react-router";
import CoursesListPage from "./list/index.jsx";

const CoursesContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<CoursesListPage />} />
  </Routes>
);

export default CoursesContainer;
