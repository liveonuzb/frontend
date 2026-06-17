import React from "react";
import { Routes, useLocation } from "react-router";
import {
  ProfileRouteLocationProvider,
  useProfileRouteLocation,
} from "@/modules/profile/lib/profile-route-location-context.jsx";
import { stripProfileRouteSuffix } from "@/modules/profile/lib/profile-route-state";

const ProfileAwareRoutes = ({ children }) => {
  const routerLocation = useLocation();
  const location = useProfileRouteLocation(routerLocation);
  const routeLocation = React.useMemo(
    () => ({
      ...location,
      pathname: stripProfileRouteSuffix(location.pathname),
    }),
    [location],
  );

  return (
    <ProfileRouteLocationProvider location={location}>
      <Routes location={routeLocation}>{children}</Routes>
    </ProfileRouteLocationProvider>
  );
};

export default ProfileAwareRoutes;
