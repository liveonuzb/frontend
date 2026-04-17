import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { filter, reduce, take } from "lodash";

const useWorkoutStore = create()(
    persist(
        (set, get) => ({
            workoutHistory: [], // [{ id, date, duration, calories, exercises: [] }]
            personalRecords: {}, // { "Bench Press": { weight: 100, date: "..." } }

            finishWorkout: (workout) => {
                set((state) => {
                    // 1. Add to history
                    const entry = {
                        id: Date.now(),
                        date: workout.date || new Date().toISOString(),
                        ...workout,
                    };
                    const newHistory = take([entry, ...state.workoutHistory], 50);

                    // 2. Check for Personal Records (PRs)
                    const newPRs = { ...state.personalRecords };
                    workout.exercises.forEach((ex) => {
                        if (ex.weight && ex.reps) {
                            const currentPR = newPRs[ex.name]?.weight || 0;
                            if (ex.weight > currentPR) {
                                newPRs[ex.name] = {
                                    weight: ex.weight,
                                    reps: ex.reps,
                                    date: new Date().toISOString(),
                                };
                            }
                        }
                    });

                    return {
                        workoutHistory: newHistory,
                        personalRecords: newPRs,
                    };
                });
            },

            getWeeklyStats: () => {
                const { workoutHistory } = get();
                const now = new Date();
                const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

                const weeklyWorkouts = filter(workoutHistory, w => new Date(w.date) > oneWeekAgo);

                return {
                    count: weeklyWorkouts.length,
                    calories: reduce(weeklyWorkouts, (acc, w) => acc + w.calories, 0),
                    duration: reduce(weeklyWorkouts, (acc, w) => acc + parseInt(w.duration), 0),
                };
            }
        }),
        {
            name: "workout-storage",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useWorkoutStore;
