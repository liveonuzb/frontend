import React from "react";
import { Navigate, Route, Routes } from "react-router";
import ChallengeShell from "./challenge-shell.jsx";
import ChallengeHomePage from "@/modules/user/pages/challenges/home/index.jsx";
import ChallengeMyChallengesPage from "@/modules/user/pages/challenges/my/index.jsx";
import ChallengeExplorePage from "@/modules/user/pages/challenges/explore/index.jsx";
import ChallengeReportPage from "@/modules/user/pages/challenges/report/index.jsx";
import ChallengeCreatePage from "@/modules/user/pages/challenges/create/index.jsx";
import ChallengeDetailPage from "@/modules/user/pages/challenges/detail/index.jsx";

const ChallengeRoutes = () => (
  <Routes>
    <Route element={<ChallengeShell />}>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<ChallengeHomePage />} />
      <Route path="my" element={<ChallengeMyChallengesPage />} />
      <Route path="explore" element={<ChallengeExplorePage />} />
      <Route path="report" element={<ChallengeReportPage />} />
    </Route>
    <Route path="create/*" element={<ChallengeCreatePage />} />
    <Route path=":id" element={<ChallengeDetailPage />} />
  </Routes>
);

export default ChallengeRoutes;
