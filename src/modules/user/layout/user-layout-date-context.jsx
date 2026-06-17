import React from "react";

const UserLayoutDateContext = React.createContext(null);

export const UserLayoutDateProvider = ({
  children,
  selectedDate,
  setSelectedDate,
}) => {
  const value = React.useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
    }),
    [selectedDate, setSelectedDate],
  );

  return (
    <UserLayoutDateContext.Provider value={value}>
      {children}
    </UserLayoutDateContext.Provider>
  );
};

export const useUserLayoutDate = () => React.useContext(UserLayoutDateContext);
