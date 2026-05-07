import { Route, Routes } from "react-router";
import LandingLayout from "@/modules/landing/layout/index.jsx";
import LandingPage from "@/modules/landing/pages/landing/index.jsx";

const LandingModule = () => (
  <Routes>
    <Route element={<LandingLayout />}>
      <Route index element={<LandingPage />} />
    </Route>
  </Routes>
);

export default LandingModule;
