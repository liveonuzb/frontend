import { Navigate, Route, Routes } from "react-router";
import PaymentsListPage from "./list/index.jsx";

const PaymentsContainer = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<PaymentsListPage />} />
  </Routes>
);

export default PaymentsContainer;
