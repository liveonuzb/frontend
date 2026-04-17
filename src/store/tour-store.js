import { create } from "zustand";
import { persist } from "zustand/middleware";

const useTourStore = create(
    persist(
        (set) => ({
            hasSeenTour: false,
            currentStep: 0,

            completeTour: () => set({ hasSeenTour: true, currentStep: 0 }),
            resetTour: () => set({ hasSeenTour: false, currentStep: 0 }),
            setStep: (step) => set({ currentStep: step }),
        }),
        { name: "tour-storage" }
    )
);

export default useTourStore;
