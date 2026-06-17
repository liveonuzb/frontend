import { Navigate, Route } from "react-router";
import ProfileAwareRoutes from "@/modules/profile/components/profile-aware-routes.jsx";
import ListPage from "./list/index.jsx";

const MealPlansContainer = () => (
  <ProfileAwareRoutes>
    <Route index element={<Navigate to="list" replace />} />
    <Route path="list" element={<ListPage />} />
  </ProfileAwareRoutes>
);

export default MealPlansContainer;
