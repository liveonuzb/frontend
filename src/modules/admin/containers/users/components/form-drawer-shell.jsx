import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const FormDrawerShell = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}) => (
  <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
    <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-md">
      <div className="mx-auto flex min-h-0 w-full flex-1 flex-col">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {children}
        </div>
        <DrawerFooter className="gap-2 border-t bg-muted/5 p-6">
          {footer}
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
);

export default FormDrawerShell;
