import React from "react";

const ProfileRouteLocationContext = React.createContext(null);

export const ProfileRouteLocationProvider = ({ children, location }) => (
  <ProfileRouteLocationContext.Provider value={location}>
    {children}
  </ProfileRouteLocationContext.Provider>
);

export const useProfileRouteLocation = (fallbackLocation) =>
  React.useContext(ProfileRouteLocationContext) ?? fallbackLocation;
