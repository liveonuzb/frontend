import React from "react";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RefreshButton = ({
  isLoading = false,
  onRefresh,
  children = "Yangilash",
  ...props
}) => (
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={onRefresh}
    disabled={isLoading || props.disabled}
    {...props}
  >
    <RefreshCwIcon
      className={isLoading ? "size-4 animate-spin" : "size-4"}
    />
    {children}
  </Button>
);

export default RefreshButton;
