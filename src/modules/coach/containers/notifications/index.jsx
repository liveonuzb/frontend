import { Navigate, Route, Routes } from "react-router";
import NotificationsListPage from "./list/index.jsx";

const NotificationsContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<NotificationsListPage />} />
  </Routes>
);

export default NotificationsContainer;
