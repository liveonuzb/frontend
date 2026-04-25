import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Auth form submit button — fixed height + full width.
 * The mode gradient is applied automatically by the Button default variant.
 */
const AuthSubmitButton = ({ className, ...props }) => (
  <Button className={cn("h-11 w-full", className)} {...props} />
);

export default AuthSubmitButton;
