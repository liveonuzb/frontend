import React from "react";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useAuthMobileKeyboard } from "@/modules/auth/lib/mobile-keyboard";

function AuthPanel({ className, children, footer, ...props }) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[430px] flex-col justify-center text-slate-950 dark:text-white",
        "[&_[data-slot=field-label]]:text-slate-700 [&_[data-slot=field-description]]:text-slate-500 [&_[data-slot=field-error]]:text-red-600 dark:[&_[data-slot=field-label]]:text-white/82 dark:[&_[data-slot=field-description]]:text-white/60 dark:[&_[data-slot=field-error]]:text-red-300",
        "[&_[data-slot=input]]:border-[rgb(var(--accent-rgb)/0.32)] [&_[data-slot=input]]:bg-white/86 [&_[data-slot=input]]:text-slate-950 [&_[data-slot=input]]:shadow-[0_14px_34px_rgba(15,23,42,0.08)] [&_[data-slot=input]]:placeholder:text-slate-400 dark:[&_[data-slot=input]]:border-white/12 dark:[&_[data-slot=input]]:bg-white/[0.08] dark:[&_[data-slot=input]]:text-white dark:[&_[data-slot=input]]:shadow-none dark:[&_[data-slot=input]]:placeholder:text-white/45",
        "[&_[data-slot=button][data-variant=outline]]:border-[rgb(var(--accent-rgb)/0.28)] [&_[data-slot=button][data-variant=outline]]:bg-white/80 [&_[data-slot=button][data-variant=outline]]:text-slate-950 [&_[data-slot=button][data-variant=outline]]:hover:bg-white dark:[&_[data-slot=button][data-variant=outline]]:border-white/12 dark:[&_[data-slot=button][data-variant=outline]]:bg-white/[0.08] dark:[&_[data-slot=button][data-variant=outline]]:text-white dark:[&_[data-slot=button][data-variant=outline]]:hover:bg-white/[0.12]",
        "[&_[data-slot=input-otp-slot]]:border-[rgb(var(--accent-rgb)/0.32)] [&_[data-slot=input-otp-slot]]:bg-white/86 [&_[data-slot=input-otp-slot]]:text-slate-950 [&_[data-slot=input-otp-slot][data-active=true]]:border-primary/80 [&_[data-slot=input-otp-slot][data-active=true]]:ring-primary/25 dark:[&_[data-slot=input-otp-slot]]:border-white/12 dark:[&_[data-slot=input-otp-slot]]:bg-white/[0.08] dark:[&_[data-slot=input-otp-slot]]:text-white",
        className,
      )}
      {...props}
    >
      <FieldGroup className="gap-6">{children}</FieldGroup>
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

function AuthHeader({ title, description, children }) {
  return (
    <div className="flex flex-col items-start gap-3 text-left">
      <h1 className="text-2xl font-semibold leading-tight text-slate-950 dark:text-white">
        {title}
      </h1>
      {description ? (
        <FieldDescription className="text-sm leading-6 text-slate-500 dark:text-white/62">
          {description}
        </FieldDescription>
      ) : null}
      {children}
    </div>
  );
}

function AuthTextFooter({ className, children, hideWhenKeyboardOpen = true }) {
  const content = (
    <FieldDescription
      className={cn(
        "text-center text-sm leading-6 text-slate-500 dark:text-white/62",
        className,
      )}
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
