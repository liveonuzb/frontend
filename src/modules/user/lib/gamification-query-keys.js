export const ME_QUERY_KEY = ["me"];
export const GAMIFICATION_ACHIEVEMENTS_QUERY_KEY = [
  "gamification",
  "achievements",
];
export const GAMIFICATION_ACHIEVEMENT_CATEGORIES_QUERY_KEY = [
  "gamification",
  "achievement-categories",
];
export const GAMIFICATION_XP_HISTORY_QUERY_KEY = ["gamification", "xp-history"];
export const USER_NOTIFICATIONS_QUERY_KEY = ["me", "notifications"];

export const invalidateGamificationQueries = async (queryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
    queryClient.invalidateQueries({
      queryKey: GAMIFICATION_ACHIEVEMENTS_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: GAMIFICATION_ACHIEVEMENT_CATEGORIES_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: GAMIFICATION_XP_HISTORY_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: USER_NOTIFICATIONS_QUERY_KEY,
    }),
  ]);
