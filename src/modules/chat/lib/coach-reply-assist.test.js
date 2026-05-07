import { describe, expect, it } from "vitest";
import { buildGroundedCoachReplySuggestions } from "./coach-reply-assist.js";

describe("buildGroundedCoachReplySuggestions", () => {
    it("grounds nutrition replies in the active meal plan and exposes a reason", () => {
        const suggestions = buildGroundedCoachReplySuggestions({
            lastMessage: { text: "Bugun ovqatni qanday qilaman?" },
            clientContext: {
                detail: {
                    client: { name: "Ali" },
                    overview: {
                        activeMealPlan: { title: "May meal plan" },
                    },
                },
            },
        });

        expect(suggestions[0]).toMatchObject({
            text: expect.stringContaining("May meal plan"),
            reason: expect.stringContaining("active meal plan"),
        });
    });

    it("does not emit unsupported medical claim wording", () => {
        const suggestions = buildGroundedCoachReplySuggestions({
            lastMessage: { text: "Mashqdan keyin og'riq bor" },
            clientContext: {
                detail: {
                    client: { name: "Ali" },
                    overview: {
                        activeWorkoutPlan: { title: "Strength base" },
                    },
                    tasks: [{ status: "overdue" }],
                },
            },
        });

        expect(suggestions.map((item) => item.text).join(" ")).not.toMatch(
            /davolaydi|diagnoz|garantiya/i,
        );
    });
});
