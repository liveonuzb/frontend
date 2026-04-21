import React from "react";
import { Navigate, Route, Routes } from "react-router";
import CoursePurchasesListPage from "./list/index.jsx";

const CoursePurchasesContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<CoursePurchasesListPage />} />
  </Routes>
);

export default CoursePurchasesContainer;
