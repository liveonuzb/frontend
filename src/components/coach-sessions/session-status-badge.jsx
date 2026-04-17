import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SESSION_STATUS_META } from "./session-utils.js";

const SessionStatusBadge = ({ status, className }) => {
  const meta = SESSION_STATUS_META[status] || SESSION_STATUS_META.proposed;

  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {meta.label}
    </Badge>
  );
};

export default SessionStatusBadge;
