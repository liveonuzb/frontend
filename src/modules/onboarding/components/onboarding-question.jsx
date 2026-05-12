import React from "react";

export const OnboardingQuestion = ({ question }) => {
  return (
    <div className="mb-4 flex w-full justify-center px-1 text-center md:mb-5">
      <h1 className="max-w-[22rem] text-balance text-2xl font-black leading-tight text-foreground md:max-w-[34rem] md:text-3xl">
        {question}
      </h1>
    </div>
  );
};
