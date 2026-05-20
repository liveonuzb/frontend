import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WorkoutImageCell from "./workout-image-cell.jsx";

describe("WorkoutImageCell", () => {
  it("uses the shared fallback when an image fails to load", () => {
    render(
      <WorkoutImageCell
        workout={{
          name: "Bench press",
          imageUrl: "https://cdn.example.com/broken.jpg",
        }}
      />,
    );

    fireEvent.error(screen.getByAltText("Bench press"));

    expect(
      screen.getByRole("img", { name: "Workout media mavjud emas" }),
    ).toBeInTheDocument();
  });

  it("renders a consistent video fallback when only youtube media exists", () => {
    render(
      <WorkoutImageCell
        workout={{
          name: "Pull-up",
          youtubeUrl: "https://youtu.be/example",
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Workout videosi mavjud" }),
    ).toBeInTheDocument();
  });
});
