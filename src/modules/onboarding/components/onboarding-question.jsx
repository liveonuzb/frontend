import React from "react";

export const OnboardingQuestion = ({ question }) => {
  return (
    <div className="flex items-end gap-3 mb-10 w-full justify-center">
      <div className="bg-card px-5 py-4 rounded-3xl rounded-bl-sm shadow-sm border border-border">
        <h1 className="text-xl font-bold">{question}</h1>
      </div>
    </div>
  );
};
