import { Navigate, Route, Routes } from "react-router";
import SessionsListPage from "./list/index.jsx";

const SessionsContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<SessionsListPage />} />
  </Routes>
);

export default SessionsContainer;
