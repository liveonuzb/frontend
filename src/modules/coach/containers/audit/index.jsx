import { Navigate, Route, Routes } from "react-router";
import AuditLogsListPage from "./list/index.jsx";

const AuditContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<AuditLogsListPage />} />
  </Routes>
);

export default AuditContainer;
