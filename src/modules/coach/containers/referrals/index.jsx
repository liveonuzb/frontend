import { Navigate, Route, Routes } from "react-router";
import ReferralsListPage from "./list/index.jsx";

const ReferralsContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ReferralsListPage />} />
  </Routes>
);

export default ReferralsContainer;
