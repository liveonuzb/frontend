import { Navigate, Route } from "react-router";

import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import CreatePage from "./create/index.jsx";
import EditPage from "./edit/index.jsx";
import ListPage from "./list/index.jsx";
import PricePage from "./price/index.jsx";
import TranslationPage from "./translation/index.jsx";

const IngredientsIndex = () => (
  <ProfileAwareRoutes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />}>
      <Route path="create" element={<CreatePage />} />
      <Route path="edit/:id" element={<EditPage />} />
      <Route path="price/:id" element={<PricePage />} />
      <Route path="translate/:id" element={<TranslationPage />} />
    </Route>
  </ProfileAwareRoutes>
);

export default IngredientsIndex;
