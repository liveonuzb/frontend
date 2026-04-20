import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const DEFAULT_ITEMS = [
  { value: "active", label: "Faol" },
  { value: "trash", label: "Savatcha" },
  { value: "all", label: "Barchasi" },
];

export const LifecycleTabs = ({
  value = "active",
  onValueChange,
  items = DEFAULT_ITEMS,
  className,
}) => (
  <Tabs value={value} onValueChange={onValueChange} className={className}>
    <TabsList variant="line" className="w-full justify-start overflow-x-auto">
      {items.map((item) => (
        <TabsTrigger
          key={item.value}
          value={item.value}
          className={cn("min-w-fit px-3", item.className)}
        >
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

export default LifecycleTabs;
