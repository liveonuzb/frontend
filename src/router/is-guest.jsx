import { Navigate } from "react-router";
import { useAuthStore } from "@/store";
import { getPostAuthRoute } from "@/modules/auth/lib/auth-utils.js";

const IsGuest = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return children;
  }

  return <Navigate to={getPostAuthRoute(user)} replace />;
};

export default IsGuest;
