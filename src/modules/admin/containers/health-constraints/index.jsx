import { Navigate, Route, Routes } from "react-router";

import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import ListPage from "./list/index.jsx";
import TranslationPage from "./translation/index.jsx";

const HealthConstraintsIndex = () => (
  <Routes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<CreatePage />} />
      <Route path="edit/:id" element={<EditPage />} />
      <Route path="translate/:id" element={<TranslationPage />} />
    </Route>
  </Routes>
);

export default HealthConstraintsIndex;
