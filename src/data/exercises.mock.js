import { toPairs, flatMap, map } from "lodash";
// Exercise database grouped by muscle groups with rich details
export const EXERCISE_DATABASE = {
    chest: {
        label: "Ko'krak",
        emoji: "\u{1F4AA}",
        exercises: [
            {
                name: "Bench Press",
                emoji: "\u{1F3CB}",
                trackingType: "REPS_WEIGHT",
                defaultSets: 4,
                defaultReps: 10,
                defaultRest: 90,
                imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Pectoralis Major"],
                bodyParts: ["Chest"],
                equipments: ["Barbell", "Bench"],
                equipmentImages: [
                  { url: "https://cdn-icons-png.flaticon.com/512/3143/3143438.png" },
                  { url: "https://cdn-icons-png.flaticon.com/512/3143/3143438.png" }
                ],
                secondaryMuscles: ["Triceps", "Front Deltoids"],
                instructions: [
                    "Step 1: Benchni ustida yoting, oyoqlaringiz polda mustahkam tursin.",
                    "Step 2: Shtangani yelkadan biroz kengroq ushlang.",
                    "Step 3: Shtangani sekin ko'krakka tushiring.",
                    "Step 4: Kuch bilan shtangani yuqoriga ko'taring.",
                    "Step 5: Harakat davomida nafas chiqarishni unutmang."
                ]
            },
            {
                name: "Push-ups",
                emoji: "\u{1F4AA}",
                trackingType: "REPS_ONLY",
                defaultSets: 3,
                defaultReps: 15,
                defaultRest: 45,
                imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Chest"],
                bodyParts: ["Upper Body"],
                equipments: ["Bodyweight"],
                equipmentImageUrl: "https://cdn-icons-png.flaticon.com/512/2548/2548530.png",
                secondaryMuscles: ["Triceps", "Core"],
                instructions: [
                    "Step 1: Qo'llaringizni yelkadan biroz kengroq qilib yerga qo'ying.",
                    "Step 2: Gavdangizni to'g'ri chiziqda tuting.",
                    "Step 3: Tirsaklaringizni bukib, ko'kragingizni yerga yaqinlashtiring.",
                    "Step 4: Dastlabki holatga qayting."
                ]
            }
        ],
    },
    back: {
        label: "Orqa",
        emoji: "\u{1F9D7}",
        exercises: [
            {
                name: "Pull-ups",
                emoji: "\u{1F4AA}",
                trackingType: "REPS_ONLY",
                defaultSets: 3,
                defaultReps: 8,
                defaultRest: 90,
                imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Lats", "Upper Back"],
                bodyParts: ["Back"],
                equipments: ["Pull-up Bar"],
                equipmentImageUrl: "https://cdn-icons-png.flaticon.com/512/3144/3144837.png",
                secondaryMuscles: ["Biceps", "Forearms"],
                instructions: [
                    "Step 1: Turnikni kengroq ushlang.",
                    "Step 2: Gavdangizni yuqoriga, iyagingiz turnikdan o'tguncha torting.",
                    "Step 3: Sekin pastga tushing."
                ]
            }
        ],
    },
    legs: {
        label: "Oyoq",
        emoji: "\u{1F9B5}",
        exercises: [
            {
                name: "Squat",
                emoji: "\u{1F9B5}",
                trackingType: "REPS_WEIGHT",
                defaultSets: 4,
                defaultReps: 12,
                defaultRest: 120,
                imageUrl: "https://images.unsplash.com/photo-1574673130244-c49cf532f5e2?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Quadriceps", "Glutes"],
                bodyParts: ["Legs"],
                equipments: ["Barbell", "Rack"],
                equipmentImageUrl: "https://cdn-icons-png.flaticon.com/512/3144/3144855.png",
                secondaryMuscles: ["Hamstrings", "Lower Back"],
                instructions: [
                    "Step 1: Oyoqlarni yelka kengligida qo'ying.",
                    "Step 2: Belni to'g'ri tutgan holda, xuddi stulga o'tirayotgandek pastga tushing.",
                    "Step 3: Tovonlarga tayanib yuqoriga ko'taring."
                ]
            }
        ]
    },
    cardio: {
        label: "Kardio",
        emoji: "\u{1F3C3}",
        exercises: [
            {
                name: "Yugurish",
                emoji: "\u{1F3C3}",
                trackingType: "DURATION_DISTANCE",
                defaultSets: 1,
                defaultDurationSeconds: 900,
                defaultDistanceMeters: 2000,
                defaultRest: 0,
                imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Legs", "Cardio"],
                bodyParts: ["Full Body"],
                equipments: ["Treadmill"],
                equipmentImageUrl: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
                secondaryMuscles: ["Core"],
                instructions: [
                    "Step 1: Tezlikni yengil yurishdan boshlang.",
                    "Step 2: Nafas ritmini bir maromda ushlang.",
                    "Step 3: Belgilangan vaqt yoki masofani yakunlang."
                ]
            },
            {
                name: "Velotrenajer",
                emoji: "\u{1F6B4}",
                trackingType: "DURATION_DISTANCE",
                defaultSets: 1,
                defaultDurationSeconds: 1200,
                defaultDistanceMeters: 5000,
                defaultRest: 0,
                imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Legs", "Cardio"],
                bodyParts: ["Lower Body"],
                equipments: ["Bike"],
                equipmentImageUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063821.png",
                secondaryMuscles: ["Glutes"],
                instructions: [
                    "Step 1: O'rindiq balandligini to'g'rilang.",
                    "Step 2: Ritmni bir xil ushlab, pedalni aylantiring.",
                    "Step 3: Masofa yoki vaqt maqsadigacha davom eting."
                ]
            }
        ]
    },
    core: {
        label: "Core",
        emoji: "\u{1F9D8}",
        exercises: [
            {
                name: "Plank",
                emoji: "\u{1F9D8}",
                trackingType: "DURATION_ONLY",
                defaultSets: 3,
                defaultDurationSeconds: 45,
                defaultRest: 30,
                imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
                targetMuscles: ["Core"],
                bodyParts: ["Abs"],
                equipments: ["Bodyweight"],
                equipmentImageUrl: "https://cdn-icons-png.flaticon.com/512/2548/2548530.png",
                secondaryMuscles: ["Shoulders", "Glutes"],
                instructions: [
                    "Step 1: Tirsak va panjalarga tayaning.",
                    "Step 2: Gavdani to'g'ri chiziqda ushlang.",
                    "Step 3: Belgilangan vaqt davomida holatni saqlang."
                ]
            }
        ]
    }
};

// Flat list of all exercises for search
export const ALL_EXERCISES = flatMap(
    toPairs(EXERCISE_DATABASE),
    ([groupId, group]) =>
        map(group.exercises, (ex) => ({
            ...ex,
            group: groupId,
            groupLabel: group.label,
        }))
);
