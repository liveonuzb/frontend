import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkoutMediaFallback from "./workout-media-fallback.jsx";

describe("WorkoutMediaFallback", () => {
  it("replaces a broken image with the shared fallback state", () => {
    render(
      <WorkoutMediaFallback
        src="https://cdn.example.com/missing.jpg"
        alt="Bench press"
        label="Mashq rasmi mavjud emas"
      />,
    );

    fireEvent.error(screen.getByAltText("Bench press"));

    expect(
      screen.getByRole("img", { name: "Mashq rasmi mavjud emas" }),
    ).toBeInTheDocument();
  });

  it("renders a compact video fallback when only an external video is available", () => {
    render(
      <WorkoutMediaFallback
        variant="video"
        compact
        label="Workout videosi mavjud"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Workout videosi mavjud" }),
    ).toBeInTheDocument();
  });
});
