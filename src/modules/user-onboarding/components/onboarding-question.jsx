import React from "react";
import { cn } from "@/lib/utils";

export const OnboardingQuestion = ({ className, description, question }) => {
  const descriptionId = React.useId();

  return (
    <div
      className={cn(
        "mb-4 flex w-full flex-col items-center justify-center px-1 text-center md:mb-5",
        className,
      )}
    >
      <h1
        aria-describedby={description ? descriptionId : undefined}
        className="max-w-[22rem] text-balance text-xl font-black leading-tight text-foreground md:max-w-[34rem] md:text-2xl"
      >
        {question}
      </h1>
      {description ? (
        <p
          id={descriptionId}
          className="mt-2 max-w-[21rem] text-balance text-sm font-medium leading-5 text-muted-foreground md:max-w-[30rem]"
        >
          {description}
        </p>
      ) : null}
    </div>
  );
};
