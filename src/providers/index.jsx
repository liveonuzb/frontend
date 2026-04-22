import React from "react";
import Query from "./query/index.jsx";
import { Toaster } from "@/components/ui/sonner.jsx";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import GetMe from "@/providers/get-me/index.jsx";
import { TooltipProvider } from "@/components/ui/tooltip.jsx";
import TelegramProvider from "@/providers/telegram/index.jsx";

const Index = ({ children }) => {
  return (
    <TelegramProvider>
      <NuqsAdapter>
        <Query>
          <GetMe>
            <TooltipProvider>
              {children}
              <Toaster richColors position={"top-right"} closeButton />
            </TooltipProvider>
          </GetMe>
        </Query>
      </NuqsAdapter>
    </TelegramProvider>
  );
};

export default Index;
