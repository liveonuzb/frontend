import React from "react";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

function AuthPanel({ className, children, footer, ...props }) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[410px] flex-col justify-center",
        className,
      )}
      {...props}
    >
      <FieldGroup className="gap-7">{children}</FieldGroup>
      {footer}
    </div>
  );
}

function AuthHeader({ title, children }) {
  return (
    <div className="flex flex-col items-start gap-2 text-left">
      <h1 className="text-xl font-bold leading-tight tracking-[-0.035em]  sm:text-2xl">
        {title}
      </h1>
      {children}
    </div>
  );
}

function AuthTextFooter({ className, children }) {
  return (
    <FieldDescription
      className={cn("text-center text-sm leading-6 text-slate-500", className)}
    >
      {children}
    </FieldDescription>
  );
}

export { AuthHeader, AuthPanel, AuthTextFooter };
