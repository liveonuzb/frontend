import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CoachOnboardingShell = ({
  step,
  totalSteps,
  title,
  description,
  children,
  footer,
  aside,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Coach onboarding</Badge>
          <Badge variant="secondary">
            {step}/{totalSteps}
          </Badge>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-balance text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {aside ? (
        <Card className="py-6">
          <CardContent>{aside}</CardContent>
        </Card>
      ) : null}

      <Card className="py-6">
        <CardHeader className="gap-1">
          <CardTitle>Ma'lumotlarni to'ldiring</CardTitle>
          <CardDescription>
            Keyingi bosqichga o'tish uchun ushbu bo'limni yakunlang.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>{children}</CardContent>
        {footer ? (
          <>
            <Separator />
            <CardFooter className="justify-end gap-3">{footer}</CardFooter>
          </>
        ) : null}
      </Card>
    </div>
  );
};

export default CoachOnboardingShell;
