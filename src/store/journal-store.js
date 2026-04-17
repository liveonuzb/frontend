import { filter, some, reduce, map, uniq, round } from "lodash";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useJournalStore = create()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const today = new Date().toISOString().split("T")[0];
        const days = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
        const dayName = days[new Date().getDay()];
        set((state) => ({
          entries: [
            {
              id: Date.now(),
              date: today,
              day: dayName,
              mood: entry.mood,
              note: entry.note,
              meals: entry.meals ?? 0,
              water: entry.water ?? "0L",
              workout: entry.workout ?? "Yo'q",
              sleep: entry.sleep ?? "0 soat",
              createdAt: new Date().toISOString(),
            },
            ...state.entries,
          ],
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: filter(state.entries, (e) => e.id !== id),
        }));
      },

      getEntries: () => get().entries,

      getStats: () => {
        const entries = get().entries;
        const total = entries.length;
        if (total === 0) return { total: 0, streak: 0, avgMood: "-", weekCount: "0/7" };

        // Calculate streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          if (some(entries, (e) => e.date === key)) {
            streak++;
          } else {
            break;
          }
        }

        // Average mood
        const moodScores = { great: 5, good: 4, okay: 3, bad: 2, terrible: 1 };
        const moodLabels = { 5: "Ajoyib", 4: "Yaxshi", 3: "O'rtacha", 2: "Yomon", 1: "Juda yomon" };
        const scoredEntries = filter(entries, (e) => moodScores[e.mood]);
        const avgScore = scoredEntries.length > 0
          ? round(reduce(scoredEntries, (s, e) => s + moodScores[e.mood], 0) / scoredEntries.length)
          : 0;
        const avgMood = moodLabels[avgScore] ?? "-";

        // This week count
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEntries = filter(entries, (e) => new Date(e.date) >= weekStart);
        const uniqueDays = uniq(map(weekEntries, (e) => e.date)).length;

        return { total, streak: streak + " kun", avgMood, weekCount: `${uniqueDays}/7` };
      },
    }),
    {
      name: "journal-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useJournalStore;
