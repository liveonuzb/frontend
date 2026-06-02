import React from "react";
import { DrawerBody, DrawerContent } from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils";

export function NutritionDrawerContent(props) {
  return (
    <DrawerContent
      {...props}
      className="data-[vaul-drawer-direction=bottom]:md:max-w-sm"
    />
  );
}

export function NutritionDrawerBody({ className, ...props }) {
  return <DrawerBody className={cn("px-5 py-4", className)} {...props} />;
}
