import React from "react";
import Query from "./query/index.jsx";
import { Toaster } from "@/components/ui/sonner.jsx";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import GetMe from "@/providers/get-me/index.jsx";
import { TooltipProvider } from "@/components/ui/tooltip.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import TelegramProvider from "@/providers/telegram/index.jsx";

const GOOGLE_CLIENT_ID = "155441452257-sa00b4ppis9556an8049n76o433alk84.apps.googleusercontent.com";

const Index = ({ children }) => {
  return (
    <TelegramProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
      </GoogleOAuthProvider>
    </TelegramProvider>
  );
};

export default Index;
