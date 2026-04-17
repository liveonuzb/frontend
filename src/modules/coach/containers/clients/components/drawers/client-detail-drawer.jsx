import React from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import ClientDetailDrawerContent from "@/modules/coach/components/client-detail-drawer-content.jsx";

export const ClientDetailDrawer = ({ clientId, onClose }) => {
  return (
    <Drawer 
      open={Boolean(clientId)} 
      onOpenChange={(open) => !open && onClose()} 
      direction="right"
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-full p-0">
        <div className="flex h-[100dvh] flex-col">
          <ClientDetailDrawerContent clientId={clientId} onClose={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
