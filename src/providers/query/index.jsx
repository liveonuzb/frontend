import React, { useEffect } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useLanguageStore } from "@/store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const QueryProvider = ({ children }) => {
  const { currentLanguage } = useLanguageStore();

  useEffect(() => {
    queryClient.invalidateQueries();
  }, [currentLanguage]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export default QueryProvider;
