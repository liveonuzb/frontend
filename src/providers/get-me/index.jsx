import React, { useEffect } from "react";
import { useAuthStore } from "@/store/index.js";
import { Spinner } from "@/components/ui/spinner.jsx";
import { applyUserPreferences } from "@/lib/user-preferences";
import useMe from "@/hooks/app/use-me.js";

const Index = ({ children }) => {
  const { initializeUser } = useAuthStore();
  const { user, isLoading } = useMe();

  useEffect(() => {
    if (!isLoading && user) {
      initializeUser(user);
      applyUserPreferences(user?.settings ?? {});
    }
  }, [initializeUser, isLoading, user]);

  if (isLoading) {
    return (
      <div className={"h-svh w-svw flex items-center justify-center"}>
        <Spinner className={"size-28 text-orange-400"} />
      </div>
    );
  }

  return <>{children}</>;
};

export default Index;
