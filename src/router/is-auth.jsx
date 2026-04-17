import { useAuthStore } from "@/store";

const IsGuest = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return children;
  }
};

export default IsGuest;
