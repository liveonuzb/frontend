export const BADGES = [
    // Streak
    { id: 1, name: "Birinchi qadam", desc: "Birinchi kuningizni yakunlang", emoji: "👟", category: "streak", xp: 10, total: 1 },
    { id: 2, name: "7 kunlik streak", desc: "7 kun ketma-ket faol bo'ling", emoji: "🔥", category: "streak", xp: 50, total: 7 },
    { id: 3, name: "30 kunlik streak", desc: "30 kun ketma-ket faol bo'ling", emoji: "🔥", category: "streak", xp: 200, total: 30 },
    { id: 4, name: "100 kunlik streak", desc: "100 kun ketma-ket!", emoji: "⭐", category: "streak", xp: 500, total: 100 },
    // Nutrition
    { id: 5, name: "Sog'lom ovqatlanish", desc: "7 kun maqsadga erishing", emoji: "🥗", category: "nutrition", xp: 75, total: 7 },
    { id: 6, name: "Oqsil pro", desc: "30 kun oqsil maqsadiga erishing", emoji: "🥩", category: "nutrition", xp: 150, total: 30 },
    { id: 7, name: "Kaloriya hisobchisi", desc: "100 ta ovqat qayd qiling", emoji: "📊", category: "nutrition", xp: 100, total: 100 },
    // Water
    { id: 8, name: "Suv ichuvchi", desc: "7 kun suv maqsadiga erishing", emoji: "💧", category: "water", xp: 50, total: 7 },
    { id: 9, name: "Suv ustasi", desc: "30 kun suv maqsadiga erishing", emoji: "💧", category: "water", xp: 150, total: 30 },
    // Workout
    { id: 10, name: "Sport boshlovchi", desc: "10 ta mashg'ulot bajaring", emoji: "💪", category: "workout", xp: 75, total: 10 },
    { id: 11, name: "Marafon yuguruvchi", desc: "100 km yuguring", emoji: "🏃", category: "workout", xp: 300, total: 100 },
    { id: 12, name: "Kuch qiroli", desc: "50 kuch mashg'ulotini bajaring", emoji: "⚡", category: "workout", xp: 250, total: 50 },
    // Body & Wellness
    { id: 13, name: "Vazn maqsadi", desc: "Maqsad vaznga erishing", emoji: "⚖️", category: "body", xp: 500, total: 1 },
    { id: 14, name: "Sog'lom yurak", desc: "30 kun kardio bajaring", emoji: "❤️", category: "body", xp: 200, total: 30 },
    // Special
    { id: 15, name: "Erta qush", desc: "10 marta ertalab 7 dan oldin mashg'ulot", emoji: "🐦", category: "workout", xp: 100, total: 10 },
    { id: 16, name: "Yoga master", desc: "20 ta meditatsiya seansini bajaring", emoji: "🧘", category: "workout", xp: 120, total: 20 },
    { id: 17, name: "Shef-povar", desc: "50 ta retseptni sinab ko'ring", emoji: "👨‍🍳", category: "nutrition", xp: 200, total: 50 },
    { id: 18, name: "Bilimdon", desc: "Viktorinada 100% natija", emoji: "🧠", category: "body", xp: 80, total: 1 },
    { id: 19, name: "Legend", desc: "Barcha badgelarni yig'ing", emoji: "🏆", category: "body", xp: 1000, total: 18 },
];

export const MOCK_BADGE_PROGRESS = {
    1: { earned: true, progress: 1, date: "2025-01-05" },
    2: { earned: true, progress: 7, date: "2025-01-12" },
    3: { earned: false, progress: 18, date: null },
    4: { earned: false, progress: 42, date: null },
    5: { earned: true, progress: 7, date: "2025-01-20" },
    6: { earned: false, progress: 14, date: null },
    7: { earned: false, progress: 78, date: null },
    8: { earned: true, progress: 7, date: "2025-01-30" },
    9: { earned: false, progress: 16, date: null },
    10: { earned: true, progress: 10, date: "2025-02-01" },
    11: { earned: false, progress: 35, date: null },
    12: { earned: false, progress: 12, date: null },
    13: { earned: false, progress: 0, date: null },
    14: { earned: false, progress: 12, date: null },
    15: { earned: true, progress: 10, date: "2025-01-15" },
    16: { earned: false, progress: 14, date: null },
    17: { earned: false, progress: 31, date: null },
    18: { earned: false, progress: 0, date: null },
    19: { earned: false, progress: 6, date: null },
};

export const CATEGORY_CONFIG = {
    all: { label: "Barchasi", color: "text-primary" },
    streak: { label: "Streak", color: "text-orange-500" },
    nutrition: { label: "Ovqatlanish", color: "text-green-500" },
    water: { label: "Suv", color: "text-blue-500" },
    workout: { label: "Mashg'ulot", color: "text-purple-500" },
    body: { label: "Tana", color: "text-red-500" },
};
