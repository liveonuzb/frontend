import React from "react";

export const OnboardingQuestion = ({ question }) => {
  return (
    <div className="flex items-end gap-3 mb-2 w-full justify-center">
      <h1 className="text-xl font-bold text-center">{question}</h1>
    </div>
  );
};
