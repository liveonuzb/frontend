import React from "react";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useAuthMobileKeyboard } from "@/modules/auth/lib/mobile-keyboard";

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

function AuthKeyboardHidden({
  as: Component = "div",
  className,
  children,
  collapsedClassName,
  ...props
}) {
  const keyboardOpen = useAuthMobileKeyboard();

  return (
    <Component
      className={cn(
        "grid transition-[grid-template-rows,opacity,transform,margin,padding] duration-300 ease-out motion-reduce:transition-none",
        keyboardOpen
          ? cn(
              "grid-rows-[0fr] overflow-hidden opacity-0 translate-y-1 pointer-events-none",
              collapsedClassName,
            )
          : "grid-rows-[1fr] opacity-100 translate-y-0",
        className,
      )}
      aria-hidden={keyboardOpen ? "true" : undefined}
      {...props}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </Component>
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

function AuthTextFooter({ className, children, hideWhenKeyboardOpen = true }) {
  const content = (
    <FieldDescription
      className={cn("text-center text-sm leading-6 text-slate-500", className)}
    >
      {children}
    </FieldDescription>
  );

  if (!hideWhenKeyboardOpen) {
    return content;
  }

  return <AuthKeyboardHidden>{content}</AuthKeyboardHidden>;
}

export { AuthHeader, AuthKeyboardHidden, AuthPanel, AuthTextFooter };
