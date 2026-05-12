import { Outlet } from "react-router";

const LandingLayout = () => (
  <main className="min-h-screen bg-white pb-16 text-slate-950 transition-colors dark:bg-[#070503] dark:text-white md:pb-0">
    <Outlet />
  </main>
);

export default LandingLayout;
