import React from "react";
import { DrawerBody, DrawerContent } from "@/components/ui/drawer.jsx";
import { cn } from "@/lib/utils";

const CONTENT_SIZE_CLASSNAMES = {
  sm: "data-[vaul-drawer-direction=bottom]:md:max-w-md mx-auto",
  md: "data-[vaul-drawer-direction=bottom]:md:max-w-2xl mx-auto",
  lg: "max-w-full w-full mx-auto md:max-w-2xl lg:max-w-3xl",
  full: "data-[vaul-drawer-direction=bottom]:w-full data-[vaul-drawer-direction=bottom]:sm:max-w-full",
};

export function NutritionDrawerContent({
  size = "sm",
  className,
  ...props
}) {
  return (
    <DrawerContent
      className={cn("overflow-hidden", CONTENT_SIZE_CLASSNAMES[size], className)}
      {...props}
    />
  );
}

export function NutritionDrawerBody({ className, ...props }) {
  return <DrawerBody className={cn("px-5 py-4", className)} {...props} />;
}

