import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { some, take, split } from "lodash";
import i18n from "@/lib/i18n";

const LEVEL_THRESHOLDS = [
  0, 500, 1000, 1500, 2000, 3000, 4000, 5500, 7000, 9000, 11000, 13500,
  16000, 19000, 22500, 26500, 31000, 36000, 42000, 50000,
];

const computeLevel = (xp) => {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
};

const computeNextLevelXP = (level) =>
  LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

const todayKey = () => split(new Date().toISOString(), "T")[0];

const tStore = (key, defaultValue, options = {}) =>
  i18n.t(`store.${key}`, { defaultValue, ...options });

const initialState = {
  xp: null,
  streak: null,
  longestStreak: null,
  lastActiveDate: null,
  earnedBadges: [],
  xpLog: [],
  leaderboardRank: null,
};

const useGamificationStore = create()(
  persist(
    (set, get) => ({
      ...initialState,

      getLevel: () => computeLevel(get().xp),
      getNextLevelXP: () => computeNextLevelXP(computeLevel(get().xp)),
      getLevelProgress: () => {
        const xp = get().xp;
        const level = computeLevel(xp);
        const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
        const nextThreshold = computeNextLevelXP(level);
        const range = nextThreshold - currentThreshold;
        if (range <= 0) return 100;
        return Math.round(((xp - currentThreshold) / range) * 100);
      },

      addXP: (amount, activityLabel = "") => {
        set((state) => {
          const newXP = state.xp + amount;
          const logEntry = {
            id: Date.now(),
            activity: activityLabel,
            xp: amount,
            timestamp: new Date().toISOString(),
          };
          return {
            xp: newXP,
            xpLog: take([logEntry, ...state.xpLog], 50),
          };
        });
      },

      spendXP: (amount) => {
        const { xp } = get();
        if (xp < amount) return false;
        set((state) => ({
          xp: state.xp - amount,
          xpLog: take(
            [
              {
                id: Date.now(),
                activity: tStore("gamification.xpSpent", "XP sarflandi"),
                xp: -amount,
                timestamp: new Date().toISOString(),
              },
              ...state.xpLog,
            ],
            50,
          ),
        }));
        return true;
      },

      updateStreak: () => {
        const today = todayKey();
        const { lastActiveDate, streak, longestStreak } = get();

        if (lastActiveDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = split(yesterday.toISOString(), "T")[0];

        let newStreak;
        if (lastActiveDate === yesterdayKey) {
          newStreak = streak + 1;
        } else if (!lastActiveDate) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }

        set({
          streak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastActiveDate: today,
        });
      },

      earnBadge: (badgeId) => {
        const { earnedBadges } = get();
        if (some(earnedBadges, (b) => b.id === badgeId)) return;
        set({
          earnedBadges: [
            ...earnedBadges,
            { id: badgeId, earnedAt: new Date().toISOString() },
          ],
        });
      },

      resetAll: () => set(initialState),
    }),
    {
      name: "gamification-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useGamificationStore;
