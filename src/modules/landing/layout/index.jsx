import { Outlet } from "react-router";

const LandingLayout = () => (
  <main className="min-h-screen bg-white pb-16 text-slate-950 md:pb-0">
    <Outlet />
  </main>
);

export default LandingLayout;
