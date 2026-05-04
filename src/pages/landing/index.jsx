import React, { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRightIcon,
  AwardIcon,
  BadgeCheckIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CheckIcon,
  CrownIcon,
  DropletsIcon,
  DumbbellIcon,
  FlameIcon,
  LanguagesIcon,
  LockKeyholeIcon,
  MedalIcon,
  SaladIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  UtensilsIcon,
  WalletCardsIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getPostAuthRoute } from "@/modules/auth/lib/auth-utils.js";
import { useAppModeStore, useAuthStore, useLanguageStore } from "@/store";

const LANGUAGES = [
  { code: "uz", label: "UZ", name: "O'zbekcha" },
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
];

const COPY = {
  ru: {
    nav: {
      signIn: "Войти",
      cta: "Получить план",
      language: "Язык",
      logoAlt: "Логотип LiveOn",
      links: [
        ["how", "Как работает"],
        ["plan", "План"],
        ["gamification", "Геймификация"],
        ["premium", "Premium"],
        ["faq", "FAQ"],
      ],
    },
    hero: {
      title: "AI-план питания и тренировок под твою цель — за 60 секунд",
      body: "LiveOn учитывает твой вес, цель, бюджет, продукты, уровень активности, оборудование и ограничения — и превращает это в понятный daily-план с трекингом, челленджами и прогрессом.",
      primaryCta: "Получить мой план за 60 секунд",
      secondaryCta: "Посмотреть пример плана",
      shortCta: "Начать",
      microcopy: [
        "Без сложных анкет",
        "Можно начать бесплатно",
        "План адаптируется под тебя",
      ],
      metrics: [
        ["60 сек", "до первого плана"],
        ["20+", "сигналов персонализации"],
        ["1 cockpit", "питание, workout и habits"],
      ],
    },
    trust: [
      ["60 секунд", "до первого плана"],
      ["Локальная еда", "привычные продукты и блюда"],
      ["AI-корректировки", "по прогрессу и привычкам"],
      ["Геймификация", "streaks, points, badges"],
    ],
    how: {
      label: "Как работает",
      title: "LiveOn превращает цель в понятный ежедневный план",
      body: "Три быстрых шага: рассказать контекст, получить AI-план и каждый день закрывать понятные действия.",
      cta: "Начать за 60 секунд",
      steps: [
        [
          "Расскажи о себе",
          "Цель, вес, рост, бюджет, питание, аллергии, уровень активности и оборудование.",
        ],
        [
          "AI собирает твой план",
          "LiveOn подбирает калории, блюда, тренировки, воду и ежедневные задачи под твой контекст.",
        ],
        [
          "Следуй daily-плану",
          "Отмечай питание, воду, тренировки и привычки. Получай очки, streaks и обновления плана.",
        ],
      ],
    },
    cockpit: {
      label: "Daily health cockpit",
      title: "Каждый день — понятный план, а не хаос.",
      body: "LiveOn показывает, что есть, какую тренировку сделать, сколько воды выпить и какие привычки закрыть сегодня. Это не статичный PDF, а живой daily cockpit.",
      features: [
        ["План питания на день", SaladIcon],
        ["Workout под твой уровень", DumbbellIcon],
        ["Калории и макросы", BarChart3Icon],
        ["Water tracking", DropletsIcon],
        ["AI adjustments", SparklesIcon],
        ["Daily checklist", CheckCircle2Icon],
      ],
    },
    preview: {
      today: "План на сегодня",
      ai: "AI обновил цель по белку после последнего workout",
      calories: "2 180 kcal",
      protein: "146g protein",
      water: "2.4L water",
      streak: "7 day streak",
      level: "Level 4 · В форме",
      points: "+240 points",
      challenge: "7-day reset",
      mealTitle: "Питание",
      meals: [
        ["Завтрак", "Омлет, творог, яблоко", "430 kcal"],
        ["Обед", "Курица, гречка, салат", "620 kcal"],
        ["Ужин", "Лагман light + овощи", "540 kcal"],
      ],
      workoutTitle: "Workout",
      workout: "Home upper body · 42 мин",
      checklistTitle: "Daily checklist",
      checklist: ["Вода 6/8", "Workout", "Protein target"],
      recommendation:
        "Ты близко к цели сегодня. Осталось 28g белка и 2 стакана воды.",
    },
    plan: {
      label: "Персональный план",
      title: "Питание и тренировки, которые подходят твоей реальной жизни.",
      body: "LiveOn не заставляет жить по чужому шаблону. План строится вокруг твоего бюджета, привычной еды, оборудования, графика и ограничений.",
      meal: {
        title: "Meal plan",
        body: "Бюджет, аллергии, disliked foods, eating schedule и макросы собираются в практичные блюда на день.",
        bullets: [
          "Блюда под калории и protein target",
          "Локальные продукты и привычная еда",
          "Smart replacements, если блюдо не подходит",
        ],
      },
      workout: {
        title: "Workout plan",
        body: "Home, gym или outdoor. План учитывает оборудование, уровень, ограничения и недельную прогрессию.",
        bullets: [
          "Beginner to advanced progression",
          "Equipment-aware упражнения",
          "Более безопасный выбор при ограничениях",
        ],
      },
      cards: [
        "Не хочешь зал? Получишь home workout.",
        "Есть бюджет? План учитывает цены и простые продукты.",
        "Нет времени? План адаптируется под график.",
        "Есть ограничения? Упражнения подбираются безопаснее.",
      ],
    },
    gamification: {
      label: "Геймификация",
      title: "Прогресс, который хочется продолжать.",
      body: "LiveOn превращает питание, воду, тренировки и привычки в ежедневные победы: очки, streaks, уровни, badges, challenges и AI-поддержка.",
      cta: "Начать прокачку",
      cards: {
        streak: ["Streak", "7 дней подряд", "Daily consistency"],
        points: ["Points", "+240 сегодня", "water, meals, workouts"],
        challenge: ["Challenge", "7-day reset", "осталось 3 дня"],
        badge: ["Badge unlocked", "Water Hero", "6/8 стаканов сегодня"],
      },
      mechanics: [
        [
          "Points",
          "за workouts, water target, meal plan, weight logging и habits",
        ],
        ["Streaks", "daily, workout, water и meal tracking consistency"],
        ["Levels", "Новичок → В форме → Атлет → Pro Mode"],
        ["Challenges", "7-day reset, no sugar week, daily water challenge"],
        ["AI motivation", "персональные nudges, weekly summary и поздравления"],
      ],
    },
    local: {
      label: "Local market fit",
      title: "План, который понимает локальный рынок.",
      body: "LiveOn учитывает не только калории, но и то, какие продукты реально доступны рядом с тобой, сколько они стоят и что ты привык есть.",
      cards: [
        [
          "Local foods",
          "Плов, лагман, гречка, яйца, курица, творог, фрукты и привычные блюда.",
        ],
        ["Budget tiers", "Эконом, стандарт, premium — план под твой бюджет."],
        [
          "Food preferences",
          "Аллергии, диета, disliked foods, eating schedule.",
        ],
        ["Realistic meals", "Еда, которую реально можно купить и приготовить."],
      ],
      slider: {
        title: "Budget-aware meal plan",
        low: "Эконом",
        mid: "Стандарт",
        high: "Premium",
      },
    },
    comparison: {
      label: "Сравнение",
      title: "Почему LiveOn лучше обычных фитнес-приложений?",
      genericTitle: "Обычные приложения",
      liveonTitle: "LiveOn",
      generic: [
        "Шаблонные планы",
        "Только подсчёт калорий",
        "Не учитывают бюджет",
        "Не знают локальные продукты",
        "Нет AI-корректировок",
        "Быстро надоедает",
      ],
      liveon: [
        "Персональный AI-план",
        "Питание + workout + habits",
        "Учитывает бюджет",
        "Локальные блюда и продукты",
        "Daily cockpit",
        "Streaks, points, challenges",
        "План меняется вместе с тобой",
      ],
    },
    testimonials: {
      label: "Demo testimonials",
      title: "Истории пользователей LiveOn",
      body: "Ниже demo-copy для будущих реальных отзывов. Без медицинских обещаний и нереалистичных claims.",
      items: [
        [
          "Алишер",
          "28",
          "похудение",
          "93 кг → 86 кг за 8 недель",
          "Я перестал гадать, что есть. Каждый день просто открываю план и выполняю.",
        ],
        [
          "Мадина",
          "31",
          "привычки",
          "14 дней water streak",
          "Мне помогла не диета, а понятная ежедневная система.",
        ],
        [
          "Рустам",
          "24",
          "muscle gain",
          "10 workouts completed",
          "План подстроился под зал, оборудование и мой график.",
        ],
      ],
    },
    premium: {
      label: "Premium",
      title: "Начни бесплатно. Улучшай план, когда захочешь больше контроля.",
      freeCta: "Начать бесплатно",
      premiumCta: "Посмотреть Premium",
      free: [
        "Базовый стартовый план",
        "Daily tracking",
        "Basic meals/workouts",
        "Limited gamification",
      ],
      paid: [
        "Advanced AI plan generation",
        "Weekly AI adjustments",
        "Deeper analytics",
        "Premium challenges",
        "Advanced rewards",
        "Progress reports",
        "Smart meal replacements",
        "Detailed workout progression",
      ],
    },
    faq: {
      label: "FAQ",
      title: "Вопросы перед стартом",
      items: [
        [
          "Сколько времени занимает создание плана?",
          "Первый профиль можно заполнить примерно за 60 секунд. Чем больше деталей ты добавишь, тем точнее будет план.",
        ],
        [
          "Можно ли начать бесплатно?",
          "Да. Бесплатный старт нужен, чтобы попробовать onboarding, tracking и базовый план.",
        ],
        [
          "Учитывает ли LiveOn мой бюджет?",
          "Да. Meal plan может учитывать budget tier и более доступные продукты.",
        ],
        [
          "Работает ли без спортзала?",
          "Да. Можно выбрать home, gym или outdoor workout.",
        ],
        [
          "Можно ли использовать локальные блюда?",
          "Да. LiveOn должен поддерживать привычные блюда и продукты локального рынка.",
        ],
        [
          "Что если у меня аллергии или ограничения?",
          "Ты указываешь ограничения в onboarding, а план избегает неподходящих вариантов.",
        ],
        [
          "Как работает геймификация?",
          "Ты получаешь points, streaks, badges, levels и challenges за ежедневные действия.",
        ],
        [
          "Чем Premium отличается от Free?",
          "Premium даёт более глубокие AI-корректировки, аналитику, challenges и гибкие замены.",
        ],
      ],
    },
    final: {
      title: "Начни с профиля — получи план уже через 60 секунд.",
      body: "LiveOn превратит твою цель, бюджет, питание и уровень активности в понятный daily-план.",
      cta: "Создать мой план",
      microcopy: [
        "Бесплатный старт",
        "Без сложной регистрации",
        "План можно изменить",
      ],
    },
    sticky: {
      text: "AI-план за 60 секунд",
      cta: "Начать",
    },
  },
  uz: {
    nav: {
      signIn: "Kirish",
      cta: "Reja olish",
      language: "Til",
      logoAlt: "LiveOn logotipi",
      links: [
        ["how", "Qanday ishlaydi"],
        ["plan", "Reja"],
        ["gamification", "Motivatsiya"],
        ["premium", "Premium"],
        ["faq", "FAQ"],
      ],
    },
    hero: {
      title: "Maqsadingizga mos AI ovqatlanish va workout rejasi — 60 soniyada",
      body: "LiveOn vazn, maqsad, budget, mahsulotlar, aktivlik, jihozlar va cheklovlarni hisobga olib, daily-plan, tracking, challenge va progress tizimini beradi.",
      primaryCta: "60 soniyada rejamni olish",
      secondaryCta: "Reja namunasini ko'rish",
      shortCta: "Boshlash",
      microcopy: [
        "Murakkab anketa yo'q",
        "Bepul boshlash mumkin",
        "Reja sizga moslashadi",
      ],
      metrics: [
        ["60 soniya", "birinchi reja"],
        ["20+", "personalizatsiya signali"],
        ["1 cockpit", "meal, workout va habits"],
      ],
    },
    trust: [
      ["60 soniya", "birinchi rejagacha"],
      ["Local food", "tanish ovqat va mahsulotlar"],
      ["AI tuzatishlar", "progressga qarab"],
      ["Motivatsiya", "streaks, points, badges"],
    ],
    how: {
      label: "Qanday ishlaydi",
      title: "LiveOn maqsadni kundalik aniq rejaga aylantiradi",
      body: "Kontekstni aytasiz, AI reja tuzadi, siz har kuni kichik vazifalarni yopasiz.",
      cta: "60 soniyada boshlash",
      steps: [
        [
          "O'zingiz haqida ayting",
          "Maqsad, vazn, bo'y, budget, ovqatlanish, allergiya, aktivlik va jihozlar.",
        ],
        [
          "AI rejangizni tuzadi",
          "Kaloriya, ovqatlar, workout, suv va kundalik tasklar kontekstga mos tanlanadi.",
        ],
        [
          "Daily-planga amal qiling",
          "Meal, suv, workout va odatlarni belgilang. Points, streaks va plan updates oling.",
        ],
      ],
    },
    cockpit: {
      label: "Daily health cockpit",
      title: "Har kuni aniq reja — tartibsizlik emas.",
      body: "LiveOn bugun nima yeyish, qaysi workoutni qilish, qancha suv ichish va qaysi odatlarni yopishni ko'rsatadi.",
      features: [
        ["Kunlik meal plan", SaladIcon],
        ["Darajaga mos workout", DumbbellIcon],
        ["Kaloriya va macros", BarChart3Icon],
        ["Water tracking", DropletsIcon],
        ["AI adjustments", SparklesIcon],
        ["Daily checklist", CheckCircle2Icon],
      ],
    },
    preview: {
      today: "Bugungi reja",
      ai: "AI oxirgi workoutdan keyin protein maqsadini yangiladi",
      calories: "2 180 kcal",
      protein: "146g protein",
      water: "2.4L suv",
      streak: "7 kun streak",
      level: "Level 4 · Formada",
      points: "+240 points",
      challenge: "7-day reset",
      mealTitle: "Ovqatlanish",
      meals: [
        ["Nonushta", "Omlet, tvorog, olma", "430 kcal"],
        ["Tushlik", "Tovuq, grechka, salat", "620 kcal"],
        ["Kechki", "Light lag'mon + sabzavot", "540 kcal"],
      ],
      workoutTitle: "Workout",
      workout: "Home upper body · 42 daq",
      checklistTitle: "Daily checklist",
      checklist: ["Suv 6/8", "Workout", "Protein target"],
      recommendation:
        "Bugungi maqsadga yaqinsiz. 28g protein va 2 stakan suv qoldi.",
    },
    plan: {
      label: "Personal reja",
      title: "Real hayotingizga mos ovqatlanish va mashg'ulotlar.",
      body: "LiveOn budget, odatiy ovqat, jihoz, vaqt va cheklovlarga qarab reja tuzadi.",
      meal: {
        title: "Meal plan",
        body: "Budget, allergiya, disliked foods, schedule va macros kundalik amaliy ovqatlarga aylanadi.",
        bullets: [
          "Kaloriya va protein target",
          "Local food catalog",
          "Mos kelmasa smart replacements",
        ],
      },
      workout: {
        title: "Workout plan",
        body: "Home, gym yoki outdoor. Reja jihoz, daraja, cheklov va haftalik progressni hisobga oladi.",
        bullets: [
          "Beginner to advanced",
          "Equipment-aware",
          "Cheklovlarga ehtiyotkorroq",
        ],
      },
      cards: [
        "Zal yo'qmi? Home workout olasiz.",
        "Budget bormi? Reja narxlarni hisobga oladi.",
        "Vaqt kammi? Reja grafikga moslashadi.",
        "Cheklov bormi? Mashqlar ehtiyotkor tanlanadi.",
      ],
    },
    gamification: {
      label: "Motivatsiya",
      title: "Davom ettirish yoqimli bo'lgan progress.",
      body: "LiveOn meal, suv, workout va odatlarni kundalik yutuqqa aylantiradi: points, streaks, levels, badges, challenges va AI support.",
      cta: "Boshlash",
      cards: {
        streak: ["Streak", "7 kun ketma-ket", "Daily consistency"],
        points: ["Points", "+240 bugun", "water, meals, workouts"],
        challenge: ["Challenge", "7-day reset", "3 kun qoldi"],
        badge: ["Badge unlocked", "Water Hero", "Bugun 6/8 stakan"],
      },
      mechanics: [
        ["Points", "workouts, suv, meal plan, vazn logging va habits uchun"],
        ["Streaks", "daily, workout, water va meal tracking"],
        ["Levels", "Boshlovchi → Formada → Atlet → Pro Mode"],
        ["Challenges", "7-day reset, no sugar week, daily water challenge"],
        ["AI motivation", "personal nudges, weekly summary va tabriklar"],
      ],
    },
    local: {
      label: "Local market fit",
      title: "Local bozorni tushunadigan reja.",
      body: "LiveOn nafaqat kaloriyani, balki yoningizdagi mahsulotlar, narx va odatiy ovqatlarni ham hisobga oladi.",
      cards: [
        [
          "Local foods",
          "Osh, lag'mon, grechka, tuxum, tovuq, tvorog, mevalar.",
        ],
        ["Budget tiers", "Ekonom, standart, premium — budgetingizga mos."],
        [
          "Food preferences",
          "Allergiya, diet, disliked foods, eating schedule.",
        ],
        [
          "Realistic meals",
          "Haqiqatan sotib olib tayyorlash mumkin bo'lgan ovqatlar.",
        ],
      ],
      slider: {
        title: "Budget-aware meal plan",
        low: "Ekonom",
        mid: "Standart",
        high: "Premium",
      },
    },
    comparison: {
      label: "Taqqoslash",
      title: "Nega LiveOn oddiy fitness applardan yaxshiroq?",
      genericTitle: "Oddiy ilovalar",
      liveonTitle: "LiveOn",
      generic: [
        "Shablon rejalar",
        "Faqat kaloriya sanaydi",
        "Budgetni hisobga olmaydi",
        "Local ovqatlarni bilmaydi",
        "AI tuzatish yo'q",
        "Tez zeriktiradi",
      ],
      liveon: [
        "Personal AI-plan",
        "Meal + workout + habits",
        "Budget-aware",
        "Local dishes",
        "Daily cockpit",
        "Streaks, points, challenges",
        "Reja siz bilan o'zgaradi",
      ],
    },
    testimonials: {
      label: "Demo testimonials",
      title: "LiveOn foydalanuvchi hikoyalari",
      body: "Hozircha demo-copy. Keyin real reviewlar bilan almashtiriladi.",
      items: [
        [
          "Alisher",
          "28",
          "vazn tashlash",
          "93 kg → 86 kg 8 haftada",
          "Nima yeyishni taxmin qilmay qo'ydim. Har kuni rejani ochaman va bajaraman.",
        ],
        [
          "Madina",
          "31",
          "odatlar",
          "14 kun water streak",
          "Menga dieta emas, kundalik aniq tizim yordam berdi.",
        ],
        [
          "Rustam",
          "24",
          "muscle gain",
          "10 workout completed",
          "Reja zal, jihozlar va grafikga moslashdi.",
        ],
      ],
    },
    premium: {
      label: "Premium",
      title:
        "Bepul boshlang. Ko'proq nazorat kerak bo'lsa planingizni kuchaytiring.",
      freeCta: "Bepul boshlash",
      premiumCta: "Premiumni ko'rish",
      free: [
        "Basic start plan",
        "Daily tracking",
        "Basic meals/workouts",
        "Limited gamification",
      ],
      paid: [
        "Advanced AI plan",
        "Weekly AI adjustments",
        "Deeper analytics",
        "Premium challenges",
        "Advanced rewards",
        "Progress reports",
        "Smart meal replacements",
        "Workout progression",
      ],
    },
    faq: {
      label: "FAQ",
      title: "Boshlashdan oldingi savollar",
      items: [
        [
          "Reja qancha vaqtda yaratiladi?",
          "Birinchi profil taxminan 60 soniyada to'ldiriladi.",
        ],
        [
          "Bepul boshlash mumkinmi?",
          "Ha, onboarding, tracking va basic planni sinab ko'rish mumkin.",
        ],
        [
          "Budget hisobga olinadimi?",
          "Ha, meal plan budget tier va arzonroq mahsulotlarni hisobga oladi.",
        ],
        ["Zalsiz ishlaydimi?", "Ha, home, gym yoki outdoor workout tanlanadi."],
        [
          "Local ovqatlar bormi?",
          "LiveOn local bozor ovqatlarini qo'llab-quvvatlashi kerak.",
        ],
        [
          "Allergiya yoki cheklovlar bo'lsa?",
          "Onboardingda ko'rsatiladi, reja mos kelmaydigan variantlardan qochadi.",
        ],
        [
          "Gamification qanday ishlaydi?",
          "Kunlik actionlar uchun points, streaks, badges, levels va challenges olasiz.",
        ],
        [
          "Premium farqi nima?",
          "Chuqur AI tuzatishlar, analytics, challenges va flexible replacements.",
        ],
      ],
    },
    final: {
      title: "Profilingizdan boshlang — reja 60 soniyada tayyor.",
      body: "LiveOn maqsad, budget, ovqatlanish va aktivlikni daily-planga aylantiradi.",
      cta: "Rejamni yaratish",
      microcopy: [
        "Bepul start",
        "Murakkab registration yo'q",
        "Rejani o'zgartirish mumkin",
      ],
    },
    sticky: { text: "AI-plan 60 soniyada", cta: "Boshlash" },
  },
  en: {
    nav: {
      signIn: "Sign in",
      cta: "Get plan",
      language: "Language",
      logoAlt: "LiveOn logo",
      links: [
        ["how", "How it works"],
        ["plan", "Plan"],
        ["gamification", "Gamification"],
        ["premium", "Premium"],
        ["faq", "FAQ"],
      ],
    },
    hero: {
      title: "AI meal and workout plan for your goal — in 60 seconds",
      body: "LiveOn uses your weight, goal, budget, foods, activity level, equipment and constraints to create a daily plan with tracking, challenges and progress.",
      primaryCta: "Get my plan in 60 seconds",
      secondaryCta: "See plan example",
      shortCta: "Start",
      microcopy: [
        "No complex forms",
        "Start for free",
        "The plan adapts to you",
      ],
      metrics: [
        ["60 sec", "to first plan"],
        ["20+", "personalization signals"],
        ["1 cockpit", "meals, workout and habits"],
      ],
    },
    trust: [
      ["60 seconds", "to first plan"],
      ["Local foods", "real meals and products"],
      ["AI adjustments", "based on progress"],
      ["Gamification", "streaks, points, badges"],
    ],
    how: {
      label: "How it works",
      title: "LiveOn turns your goal into a clear daily plan",
      body: "Tell your context, get an AI plan, and close simple actions every day.",
      cta: "Start in 60 seconds",
      steps: [
        [
          "Tell us about you",
          "Goal, weight, height, budget, food, allergies, activity and equipment.",
        ],
        [
          "AI builds your plan",
          "LiveOn sets calories, meals, workouts, water and daily tasks for your context.",
        ],
        [
          "Follow the daily plan",
          "Track meals, water, workouts and habits. Earn points, streaks and plan updates.",
        ],
      ],
    },
    cockpit: {
      label: "Daily health cockpit",
      title: "Every day gets a clear plan, not chaos.",
      body: "LiveOn shows what to eat, which workout to do, how much water to drink and which habits to complete today.",
      features: [
        ["Daily meal plan", SaladIcon],
        ["Workout for your level", DumbbellIcon],
        ["Calories and macros", BarChart3Icon],
        ["Water tracking", DropletsIcon],
        ["AI adjustments", SparklesIcon],
        ["Daily checklist", CheckCircle2Icon],
      ],
    },
    preview: {
      today: "Today plan",
      ai: "AI updated protein after your last workout",
      calories: "2,180 kcal",
      protein: "146g protein",
      water: "2.4L water",
      streak: "7 day streak",
      level: "Level 4 · In shape",
      points: "+240 points",
      challenge: "7-day reset",
      mealTitle: "Meals",
      meals: [
        ["Breakfast", "Omelet, cottage cheese, apple", "430 kcal"],
        ["Lunch", "Chicken, buckwheat, salad", "620 kcal"],
        ["Dinner", "Light lagman + vegetables", "540 kcal"],
      ],
      workoutTitle: "Workout",
      workout: "Home upper body · 42 min",
      checklistTitle: "Daily checklist",
      checklist: ["Water 6/8", "Workout", "Protein target"],
      recommendation:
        "You are close today. 28g protein and 2 glasses of water left.",
    },
    plan: {
      label: "Personal plan",
      title: "Meals and workouts that fit your real life.",
      body: "LiveOn plans around your budget, familiar foods, equipment, schedule and constraints.",
      meal: {
        title: "Meal plan",
        body: "Budget, allergies, disliked foods, eating schedule and macros become practical daily meals.",
        bullets: [
          "Meals for calories and protein",
          "Localized food catalog",
          "Smart replacements",
        ],
      },
      workout: {
        title: "Workout plan",
        body: "Home, gym or outdoor. The plan uses equipment, level, constraints and weekly progression.",
        bullets: [
          "Beginner to advanced",
          "Equipment-aware",
          "Safer choices for constraints",
        ],
      },
      cards: [
        "No gym? Get a home workout.",
        "On a budget? The plan uses simple products.",
        "No time? The plan adapts to your schedule.",
        "Constraints? Exercises are selected more carefully.",
      ],
    },
    gamification: {
      label: "Gamification",
      title: "Progress you want to continue.",
      body: "LiveOn turns meals, water, workouts and habits into daily wins: points, streaks, levels, badges, challenges and AI support.",
      cta: "Start leveling up",
      cards: {
        streak: ["Streak", "7 days in a row", "Daily consistency"],
        points: ["Points", "+240 today", "water, meals, workouts"],
        challenge: ["Challenge", "7-day reset", "3 days left"],
        badge: ["Badge unlocked", "Water Hero", "6/8 glasses today"],
      },
      mechanics: [
        ["Points", "for workouts, water, meal plan, weight logging and habits"],
        ["Streaks", "daily, workout, water and meal tracking"],
        ["Levels", "Beginner → In shape → Athlete → Pro Mode"],
        ["Challenges", "7-day reset, no sugar week, daily water challenge"],
        [
          "AI motivation",
          "personal nudges, weekly summaries and congratulations",
        ],
      ],
    },
    local: {
      label: "Local market fit",
      title: "A plan that understands the local market.",
      body: "LiveOn considers not just calories, but products available near you, their cost and what you already eat.",
      cards: [
        [
          "Local foods",
          "Pilaf, lagman, buckwheat, eggs, chicken, cottage cheese and fruits.",
        ],
        ["Budget tiers", "Economy, standard, premium — fit to your budget."],
        [
          "Food preferences",
          "Allergies, diet, disliked foods, eating schedule.",
        ],
        ["Realistic meals", "Food you can actually buy and cook."],
      ],
      slider: {
        title: "Budget-aware meal plan",
        low: "Economy",
        mid: "Standard",
        high: "Premium",
      },
    },
    comparison: {
      label: "Comparison",
      title: "Why LiveOn is better than ordinary fitness apps",
      genericTitle: "Generic apps",
      liveonTitle: "LiveOn",
      generic: [
        "Template plans",
        "Calorie counting only",
        "No budget context",
        "No local foods",
        "No AI adjustments",
        "Gets boring fast",
      ],
      liveon: [
        "Personal AI plan",
        "Meals + workout + habits",
        "Budget-aware",
        "Local dishes",
        "Daily cockpit",
        "Streaks, points, challenges",
        "Plan changes with you",
      ],
    },
    testimonials: {
      label: "Demo testimonials",
      title: "LiveOn user stories",
      body: "Demo copy for future real testimonials.",
      items: [
        [
          "Alisher",
          "28",
          "fat loss",
          "93 kg → 86 kg in 8 weeks",
          "I stopped guessing what to eat. I open the plan and follow it.",
        ],
        [
          "Madina",
          "31",
          "habits",
          "14 day water streak",
          "A clear daily system helped more than another diet.",
        ],
        [
          "Rustam",
          "24",
          "muscle gain",
          "10 workouts completed",
          "The plan adapted to my gym, equipment and schedule.",
        ],
      ],
    },
    premium: {
      label: "Premium",
      title: "Start free. Upgrade when you want more control.",
      freeCta: "Start free",
      premiumCta: "See Premium",
      free: [
        "Basic starter plan",
        "Daily tracking",
        "Basic meals/workouts",
        "Limited gamification",
      ],
      paid: [
        "Advanced AI plan",
        "Weekly AI adjustments",
        "Deeper analytics",
        "Premium challenges",
        "Advanced rewards",
        "Progress reports",
        "Smart meal replacements",
        "Workout progression",
      ],
    },
    faq: {
      label: "FAQ",
      title: "Questions before starting",
      items: [
        [
          "How long does plan creation take?",
          "The first profile can be completed in about 60 seconds.",
        ],
        [
          "Can I start free?",
          "Yes. Free start lets you try onboarding, tracking and a basic plan.",
        ],
        [
          "Does LiveOn consider my budget?",
          "Yes. Meal plan can use budget tiers and accessible products.",
        ],
        [
          "Does it work without a gym?",
          "Yes. Choose home, gym or outdoor workouts.",
        ],
        [
          "Can I use local foods?",
          "LiveOn is designed to support local meals and products.",
        ],
        [
          "What about allergies or constraints?",
          "Add them in onboarding and the plan avoids unsuitable options.",
        ],
        [
          "How does gamification work?",
          "You earn points, streaks, badges, levels and challenges for daily actions.",
        ],
        [
          "What is Premium?",
          "Premium adds deeper AI adjustments, analytics, challenges and flexible replacements.",
        ],
      ],
    },
    final: {
      title: "Start with your profile — get a plan in 60 seconds.",
      body: "LiveOn turns your goal, budget, meals and activity level into a clear daily plan.",
      cta: "Create my plan",
      microcopy: [
        "Free start",
        "No complex registration",
        "Plan can be changed",
      ],
    },
    sticky: { text: "AI plan in 60 seconds", cta: "Start" },
  },
};

const normalizeLanguage = (language) => {
  if (language?.startsWith("uz")) return "uz";
  if (language?.startsWith("en")) return "en";
  return "ru";
};

const trackLandingEvent = (event, payload = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("liveon:analytics", {
      detail: { event, payload, source: "landing" },
    }),
  );
  window.dataLayer?.push({ event, ...payload });
};

const MotionSection = ({ id, eventName, children, className }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={cn("scroll-mt-24", className)}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onViewportEnter={() => {
        if (eventName) trackLandingEvent(eventName);
      }}
    >
      {children}
    </motion.section>
  );
};

const CTAButton = ({ children, onClick, variant = "primary", className }) => (
  <Button
    type="button"
    size="xl"
    variant={variant === "light" ? "secondary" : "default"}
    onClick={onClick}
    className={cn(
      "min-h-11 gap-2 px-5 text-sm font-medium md:px-6",
      variant === "dark" &&
        "bg-none bg-foreground text-background hover:bg-foreground/90",
      variant === "light" &&
        "bg-background text-foreground hover:bg-background/90",
      className,
    )}
  >
    {children}
    <ArrowRightIcon data-icon="inline-end" />
  </Button>
);

const SectionHeader = ({ label, title, body, align = "left" }) => (
  <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
    <Badge variant="outline" className="uppercase tracking-[0.14em]">
      {label}
    </Badge>
    <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
      {title}
    </h2>
    {body ? (
      <p className="mt-4 text-base leading-7 text-muted-foreground">{body}</p>
    ) : null}
  </div>
);

const LandingHeader = ({
  copy,
  language,
  setLanguage,
  onStart,
  onAnchor,
  backgroundStyle,
  borderStyle,
}) => (
  <motion.header
    className="fixed inset-x-0 top-0 z-50 border-b px-4 py-3 backdrop-blur-xl md:px-8"
    style={{ backgroundColor: backgroundStyle, borderColor: borderStyle }}
  >
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-3 rounded-md text-white outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <img
          src="/madagascar/logo-main.webp"
          alt={copy.nav.logoAlt}
          className="size-10 object-contain"
        />
        <span className="text-lg font-black">LiveOn</span>
      </Link>

      <nav
        className="hidden items-center gap-1 lg:flex"
        aria-label="Landing navigation"
      >
        {copy.nav.links.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onAnchor(id)}
            className="min-h-10 rounded-md px-3 text-sm font-semibold text-white/72 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/80"
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 p-1"
          aria-label={copy.nav.language}
        >
          <LanguagesIcon className="ml-1 hidden size-4 text-white/70 sm:block" />
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={cn(
                "min-h-9 rounded-md px-2.5 text-sm font-bold text-white/70 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/80",
                language === item.code && "bg-white text-slate-950",
              )}
              aria-pressed={language === item.code}
              title={item.name}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Link
          to="/auth/sign-in"
          className="hidden min-h-11 items-center rounded-md px-4 text-sm font-bold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80 md:inline-flex"
        >
          {copy.nav.signIn}
        </Link>
        <CTAButton
          variant="light"
          onClick={() => onStart("header_cta_clicked")}
          className="hidden min-h-11 px-4 lg:inline-flex"
        >
          {copy.nav.cta}
        </CTAButton>
      </div>
    </div>
  </motion.header>
);

const ProgressRing = ({ value = 72, label, caption }) => (
  <div className="flex items-center gap-4">
    <div
      className="grid size-24 place-items-center rounded-full p-2 md:size-28"
      style={{
        background: `conic-gradient(#f97316 ${value}%, rgba(255,255,255,0.12) 0)`,
      }}
    >
      <div className="grid size-full place-items-center rounded-full bg-slate-950 text-center">
        <span className="text-2xl font-black text-white">{value}%</span>
      </div>
    </div>
    <div>
      <p className="text-lg font-black text-white">{label}</p>
      <p className="mt-1 text-sm text-white/60">{caption}</p>
    </div>
  </div>
);

const DashboardPreview = ({ copy, compact = false }) => (
  <motion.div
    className={cn("relative", compact ? "max-w-xl" : "w-full")}
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.35 }}
    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    aria-label={copy.today}
  >
    <Card
      className={cn(
        "overflow-hidden border-white/15 bg-slate-950 text-white shadow-[0_30px_120px_rgba(2,6,23,0.34)] ring-white/10",
        compact ? "max-w-xl" : "w-full",
      )}
    >
      <CardHeader className="border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge
              variant="outline"
              className="border-white/15 bg-white/5 text-orange-200"
            >
              LiveOn cockpit
            </Badge>
            <CardTitle className="mt-3 text-2xl font-semibold text-white">
              {copy.today}
            </CardTitle>
            <CardDescription className="mt-2 max-w-md leading-6 text-white/60">
              {copy.ai}
            </CardDescription>
          </div>
          <Badge className="hidden bg-emerald-400/15 text-emerald-100 sm:inline-flex">
            <SparklesIcon data-icon="inline-start" />
            AI ready
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 pt-4 md:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3">
          <Card className="bg-white/[0.06] text-white ring-white/10">
            <CardContent className="pt-6">
              <ProgressRing
                value={78}
                label={copy.calories}
                caption={copy.protein}
              />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              icon={DropletsIcon}
              value={copy.water}
              label="Water"
              tone="blue"
            />
            <MetricTile
              icon={FlameIcon}
              value={copy.streak}
              label="Streak"
              tone="orange"
            />
          </div>
          <Card className="hidden border-orange-400/20 bg-orange-400/10 text-white ring-orange-300/20 sm:flex">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-orange-100/70">{copy.level}</p>
                  <p className="mt-1 text-xl font-semibold">{copy.points}</p>
                </div>
                <TrophyIcon className="size-9 text-orange-300" />
              </div>
              <Progress
                value={68}
                className="mt-4 bg-white/10 [&>div]:bg-orange-400"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3">
          <Card className="bg-background text-foreground">
            <CardHeader className="!flex flex-row items-center justify-between gap-3 pb-0">
              <CardTitle className="font-semibold">{copy.mealTitle}</CardTitle>
              <UtensilsIcon className="size-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="grid gap-2 pt-3">
              {copy.meals.map(([name, meal, kcal], index) => (
                <div
                  key={name}
                  className="grid min-h-14 grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl bg-muted px-3"
                >
                  <img
                    src={
                      [
                        "/madagascar/dashboard/light/breakfast.png",
                        "/madagascar/dashboard/light/lunch.png",
                        "/madagascar/dashboard/light/dinner.png",
                      ][index]
                    }
                    alt=""
                    className="size-9 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {meal}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {kcal}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <Card className="bg-white/[0.06] text-white ring-white/10">
              <CardHeader>
                <DumbbellIcon className="size-7 text-orange-300" />
                <CardDescription className="text-white/55">
                  {copy.workoutTitle}
                </CardDescription>
                <CardTitle className="font-semibold text-white">
                  {copy.workout}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="hidden bg-white/[0.06] text-white ring-white/10 sm:flex">
              <CardHeader>
                <BadgeCheckIcon className="size-7 text-emerald-300" />
                <CardDescription className="text-white/55">
                  {copy.challenge}
                </CardDescription>
                <CardTitle className="font-semibold text-white">
                  {copy.checklistTitle}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="hidden bg-emerald-400/10 text-white ring-emerald-300/20 md:flex">
            <CardContent className="pt-6">
              <div className="grid gap-2">
                {copy.checklist.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2Icon className="size-4 text-emerald-300" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-emerald-50/70">
                {copy.recommendation}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const MetricTile = ({ icon: Icon, value, label, tone }) => (
  <Card className="bg-white/[0.06] text-white ring-white/10">
    <CardHeader>
      <Icon
        className={cn(
          "size-6",
          tone === "blue" ? "text-blue-300" : "text-orange-300",
        )}
      />
      <CardDescription className="text-white/55">{label}</CardDescription>
      <CardTitle className="text-lg font-semibold text-white">
        {value}
      </CardTitle>
    </CardHeader>
  </Card>
);

const TrustBar = ({ items }) => (
  <section className="border-y border-border bg-background">
    <div className="mx-auto grid max-w-7xl px-5 md:grid-cols-4 md:px-8">
      {items.map(([value, label], index) => (
        <div key={value} className="py-5 md:px-5">
          <Badge variant="secondary">{value}</Badge>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {label}
          </p>
          {index < items.length - 1 ? (
            <Separator className="mt-5 md:hidden" />
          ) : null}
        </div>
      ))}
    </div>
  </section>
);

const StepCard = ({ index, title, body }) => (
  <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
    <Card className="h-full rounded-none border-0 ring-0">
      <CardHeader>
        <Badge className="size-11 rounded-xl text-sm">{index}</Badge>
        <Progress value={66} className="mt-4" />
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="leading-7">{body}</CardDescription>
      </CardHeader>
    </Card>
  </motion.article>
);

const FeatureCard = ({ icon: Icon, label }) => (
  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
    <Card size="sm">
      <CardContent className="flex min-h-16 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          <Icon className="size-5" />
        </span>
        <CardTitle className="font-semibold">{label}</CardTitle>
      </CardContent>
    </Card>
  </motion.div>
);

const MealPlanCard = ({ data }) => (
  <Card>
    <CardHeader>
      <SaladIcon className="size-8 text-emerald-600" />
      <CardTitle className="text-xl font-semibold">{data.title}</CardTitle>
      <CardDescription className="leading-7">{data.body}</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3">
      {data.bullets.map((item) => (
        <div key={item} className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          {item}
        </div>
      ))}
    </CardContent>
  </Card>
);

const WorkoutPlanCard = ({ data }) => (
  <Card className="bg-slate-950 text-white ring-white/10">
    <CardHeader>
      <DumbbellIcon className="size-8 text-orange-300" />
      <CardTitle className="text-xl font-semibold text-white">
        {data.title}
      </CardTitle>
      <CardDescription className="leading-7 text-white/65">
        {data.body}
      </CardDescription>
    </CardHeader>
    <CardContent className="grid gap-3">
      {data.bullets.map((item) => (
        <div key={item} className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2Icon className="size-4 text-orange-300" />
          {item}
        </div>
      ))}
    </CardContent>
  </Card>
);

const GamificationCard = ({
  icon: Icon,
  title,
  value,
  body,
  tone = "orange",
}) => (
  <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
    <Card className="h-full border-white/10 bg-white/[0.06] text-white ring-white/10">
      <CardHeader>
        <Icon
          className={cn(
            "size-8",
            tone === "emerald" && "text-emerald-300",
            tone === "blue" && "text-blue-300",
            tone === "orange" && "text-orange-300",
          )}
        />
        <CardDescription className="uppercase tracking-[0.14em] text-white/45">
          {title}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold text-white">
          {value}
        </CardTitle>
        <CardDescription className="leading-6 text-white/60">
          {body}
        </CardDescription>
      </CardHeader>
    </Card>
  </motion.div>
);

const LocalFoodBudgetSection = ({ copy }) => (
  <MotionSection id="local" className="bg-background py-16 md:py-24">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
      <SectionHeader label={copy.label} title={copy.title} body={copy.body} />
      <div className="grid gap-4">
        <Card>
          <CardHeader className="!flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                {copy.slider.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {copy.slider.low} → {copy.slider.mid} → {copy.slider.high}
              </CardDescription>
            </div>
            <WalletCardsIcon className="size-8 text-orange-600" />
          </CardHeader>
          <CardContent>
            <Progress value={58} className="h-3" />
            <div className="mt-5 grid grid-cols-3 text-xs font-medium text-muted-foreground">
              <span>{copy.slider.low}</span>
              <span className="text-center">{copy.slider.mid}</span>
              <span className="text-right">{copy.slider.high}</span>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          {copy.cards.map(([title, body]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="font-semibold">{title}</CardTitle>
                <CardDescription className="leading-6">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </MotionSection>
);

const ComparisonTable = ({ copy }) => (
  <MotionSection
    id="comparison"
    eventName="comparison_section_viewed"
    className="bg-muted/35 py-16 md:py-24"
  >
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <SectionHeader align="center" label={copy.label} title={copy.title} />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="!flex flex-row items-center gap-3">
            <XIcon className="size-6 text-slate-400" />
            <CardTitle className="text-xl font-semibold">
              {copy.genericTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {copy.generic.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-muted-foreground"
              >
                <XIcon className="size-4 text-slate-400" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-orange-300/20">
          <CardHeader className="!flex flex-row items-center gap-3">
            <CheckCircle2Icon className="size-6 text-orange-300" />
            <CardTitle className="text-xl font-semibold text-white">
              {copy.liveonTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {copy.liveon.map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/78">
                <CheckIcon className="size-4 text-orange-300" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </MotionSection>
);

const TestimonialCard = ({ item, index }) => {
  const [name, age, goal, result, quote] = item;
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Card className="h-full">
        <CardHeader className="!flex flex-row items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl bg-foreground text-lg font-semibold text-background">
            {name[0]}
          </div>
          <div>
            <CardTitle className="font-semibold">
              {name}, {age}
            </CardTitle>
            <CardDescription>{goal}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Badge className="bg-emerald-100 text-emerald-800">{result}</Badge>
          <p className="mt-5 leading-7 text-foreground/80">“{quote}”</p>
          <Progress value={64 + index * 10} className="mt-5" />
        </CardContent>
      </Card>
    </motion.article>
  );
};

const PricingCard = ({ title, features, cta, highlighted, onClick }) => (
  <Card
    className={cn(
      "h-full",
      highlighted
        ? "border-orange-300 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] ring-orange-300/20"
        : "text-foreground",
    )}
  >
    <CardHeader className="!flex flex-row items-center justify-between gap-4">
      <CardTitle
        className={cn("text-xl font-semibold", highlighted && "text-white")}
      >
        {title}
      </CardTitle>
      {highlighted ? (
        <CrownIcon className="size-8 text-orange-300" />
      ) : (
        <LockKeyholeIcon className="size-8 text-muted-foreground" />
      )}
    </CardHeader>
    <CardContent className="grid gap-3">
      {features.map((item) => (
        <div
          key={item}
          className={cn(
            "flex items-center gap-2 text-sm font-semibold",
            highlighted ? "text-white/72" : "text-muted-foreground",
          )}
        >
          <CheckCircle2Icon
            className={cn(
              "size-4",
              highlighted ? "text-orange-300" : "text-emerald-600",
            )}
          />
          {item}
        </div>
      ))}
    </CardContent>
    <CardFooter>
      <CTAButton
        variant={highlighted ? "primary" : "dark"}
        onClick={onClick}
        className="w-full"
      >
        {cta}
      </CTAButton>
    </CardFooter>
  </Card>
);

const FAQAccordion = ({ items }) => {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="faq-0"
      className="mx-auto mt-10 max-w-4xl bg-card"
    >
      {items.map(([question, answer], index) => (
        <AccordionItem key={question} value={`faq-${index}`}>
          <AccordionTrigger
            onClick={() => trackLandingEvent("faq_opened", { question })}
            className="min-h-16 text-base font-medium no-underline hover:no-underline"
          >
            {question}
          </AccordionTrigger>
          <AccordionContent className="leading-7 text-muted-foreground">
            {answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

const FinalCTA = ({ copy, preview, onStart }) => (
  <section className="px-5 pb-28 md:px-8">
    <Card className="mx-auto !grid max-w-7xl gap-8 overflow-hidden bg-slate-950 p-5 text-white ring-white/10 md:grid-cols-[0.95fr_1.05fr] md:p-8">
      <div className="flex flex-col justify-center">
        <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-xl leading-7 text-white/70">{copy.body}</p>
        <div className="mt-7">
          <CTAButton onClick={() => onStart("final_cta_clicked")}>
            {copy.cta}
          </CTAButton>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {copy.microcopy.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="border-white/15 bg-white/[0.06] text-white/70"
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>
      <DashboardPreview copy={preview} compact />
    </Card>
  </section>
);

const StickyCTA = ({ copy, onStart }) => (
  <Card className="fixed inset-x-0 bottom-0 z-50 rounded-none border-white/10 bg-slate-950/88 px-4 py-3 text-white shadow-[0_-16px_48px_rgba(15,23,42,0.18)] ring-white/10 backdrop-blur-xl md:left-auto md:right-6 md:bottom-6 md:w-[360px] md:rounded-2xl md:border">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 md:max-w-none">
      <div>
        <p className="text-sm font-semibold">{copy.text}</p>
        <p className="text-xs text-white/55">LiveOn daily cockpit</p>
      </div>
      <CTAButton
        onClick={() => onStart("sticky_cta_clicked")}
        className="min-h-10 px-4"
      >
        {copy.cta}
      </CTAButton>
    </div>
  </Card>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const headerBackground = useTransform(
    scrollYProgress,
    [0, 0.035],
    ["rgba(2,6,23,0)", "rgba(2,6,23,0.78)"],
  );
  const headerBorder = useTransform(
    scrollYProgress,
    [0, 0.035],
    ["rgba(255,255,255,0)", "rgba(255,255,255,0.12)"],
  );
  const dashboardY = useTransform(scrollYProgress, [0, 0.28], [0, -22]);
  const { currentLanguage, hasSelectedLanguage, setCurrentLanguage } =
    useLanguageStore();
  const mode = useAppModeStore((state) => state.mode);
  const { isAuthenticated, user } = useAuthStore();
  const language = hasSelectedLanguage
    ? normalizeLanguage(currentLanguage)
    : "ru";
  const copy = COPY[language] ?? COPY.ru;

  useEffect(() => {
    if (!hasSelectedLanguage) setCurrentLanguage("ru");
  }, [hasSelectedLanguage, setCurrentLanguage]);

  const heroMicrocopy = useMemo(() => copy.hero.microcopy, [copy]);

  const setLandingLanguage = (nextLanguage) => {
    setCurrentLanguage(nextLanguage);
    trackLandingEvent("language_changed", { language: nextLanguage });
  };

  const startOnboarding = (eventName = "hero_cta_clicked") => {
    trackLandingEvent(eventName, { language });
    if (!hasSelectedLanguage) setCurrentLanguage(language);
    if (isAuthenticated) {
      navigate(getPostAuthRoute(user));
      return;
    }
    if (!mode) {
      navigate("/auth/select-mode", { state: { returnTo: "/auth/sign-up" } });
      return;
    }
    trackLandingEvent("onboarding_started", { source: "landing" });
    navigate("/auth/sign-up");
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const viewPlanExample = () => {
    trackLandingEvent("secondary_cta_clicked", { target: "cockpit" });
    scrollToSection("cockpit");
  };

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <LandingHeader
        copy={copy}
        language={language}
        setLanguage={setLandingLanguage}
        onStart={startOnboarding}
        onAnchor={scrollToSection}
        backgroundStyle={headerBackground}
        borderStyle={headerBorder}
      />

      <section className="relative min-h-[100svh] overflow-hidden bg-slate-950 pt-20 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ backgroundImage: "url('/madagascar/background.webp')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.88)_43%,rgba(2,6,23,0.58)_100%)]" />
        <img
          src="/madagascar/onboarding/male-young-3.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 right-[2%] hidden max-h-[58svh] opacity-35 blur-[1px] lg:block"
          loading="lazy"
        />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8 md:pb-20 md:pt-16">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="text-2xl font-semibold text-white md:text-3xl">
              LiveOn
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {copy.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              {copy.hero.body}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton
                onClick={() => startOnboarding("hero_cta_clicked")}
                className="w-full sm:w-auto"
              >
                {copy.hero.primaryCta}
              </CTAButton>
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={viewPlanExample}
                className="min-h-11 w-full border-white/25 bg-white/10 px-6 text-base font-medium text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                {copy.hero.secondaryCta}
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {heroMicrocopy.map((item) => (
                <Badge
                  key={item}
                  variant="outline"
                  className="border-white/15 bg-white/[0.06] text-white/70"
                >
                  {item}
                </Badge>
              ))}
            </div>

            <dl className="mt-9 grid gap-4 sm:grid-cols-3">
              {copy.hero.metrics.map(([value, label]) => (
                <div
                  key={value}
                  className="border-l border-white/20 pl-4 text-white"
                >
                  <dt className="text-2xl font-semibold">{value}</dt>
                  <dd className="mt-1 text-sm leading-5 text-white/58">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-2xl md:max-w-none"
            style={shouldReduceMotion ? undefined : { y: dashboardY }}
          >
            <DashboardPreview copy={copy.preview} />
          </motion.div>
        </div>
      </section>

      <TrustBar items={copy.trust} />

      <MotionSection
        id="how"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.78fr_1.22fr] md:px-8 md:py-24"
      >
        <div>
          <SectionHeader
            label={copy.how.label}
            title={copy.how.title}
            body={copy.how.body}
          />
          <CTAButton
            variant="dark"
            onClick={() => startOnboarding("how_cta_clicked")}
            className="mt-7"
          >
            {copy.how.cta}
          </CTAButton>
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-3">
          {copy.how.steps.map(([title, body], index) => (
            <StepCard key={title} index={index + 1} title={title} body={body} />
          ))}
        </div>
      </MotionSection>

      <MotionSection id="cockpit" className="bg-background py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[1.08fr_0.92fr] md:items-center md:px-8">
          <DashboardPreview copy={copy.preview} compact />
          <div>
            <SectionHeader
              label={copy.cockpit.label}
              title={copy.cockpit.title}
              body={copy.cockpit.body}
            />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {copy.cockpit.features.map(([label, Icon]) => (
                <FeatureCard key={label} icon={Icon} label={label} />
              ))}
            </div>
            <CTAButton
              onClick={() => startOnboarding("cockpit_cta_clicked")}
              className="mt-7"
            >
              {copy.hero.primaryCta}
            </CTAButton>
          </div>
        </div>
      </MotionSection>

      <MotionSection id="plan" className="bg-muted/35 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader
            align="center"
            label={copy.plan.label}
            title={copy.plan.title}
            body={copy.plan.body}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <MealPlanCard data={copy.plan.meal} />
            <WorkoutPlanCard data={copy.plan.workout} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {copy.plan.cards.map((item) => (
              <Card key={item} size="sm">
                <CardContent className="pt-4 text-sm font-medium leading-6">
                  {item}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection
        id="gamification"
        eventName="gamification_section_viewed"
        className="bg-slate-950 py-16 text-white md:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
            <div>
              <Badge
                variant="outline"
                className="border-white/15 bg-white/[0.06] uppercase tracking-[0.14em] text-orange-200"
              >
                {copy.gamification.label}
              </Badge>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {copy.gamification.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                {copy.gamification.body}
              </p>
              <CTAButton
                onClick={() => startOnboarding("gamification_cta_clicked")}
                className="mt-7"
              >
                {copy.gamification.cta}
              </CTAButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <GamificationCard
                icon={FlameIcon}
                title={copy.gamification.cards.streak[0]}
                value={copy.gamification.cards.streak[1]}
                body={copy.gamification.cards.streak[2]}
              />
              <GamificationCard
                icon={StarIcon}
                title={copy.gamification.cards.points[0]}
                value={copy.gamification.cards.points[1]}
                body={copy.gamification.cards.points[2]}
                tone="blue"
              />
              <GamificationCard
                icon={TrophyIcon}
                title={copy.gamification.cards.challenge[0]}
                value={copy.gamification.cards.challenge[1]}
                body={copy.gamification.cards.challenge[2]}
                tone="emerald"
              />
              <GamificationCard
                icon={AwardIcon}
                title={copy.gamification.cards.badge[0]}
                value={copy.gamification.cards.badge[1]}
                body={copy.gamification.cards.badge[2]}
              />
            </div>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-5">
            {copy.gamification.mechanics.map(([title, body], index) => {
              const Icon =
                [MedalIcon, FlameIcon, CrownIcon, TargetIcon, ZapIcon][index] ??
                BadgeCheckIcon;
              return (
                <Card
                  key={title}
                  className="border-white/10 bg-white/[0.04] text-white ring-white/10"
                >
                  <CardHeader>
                    <Icon className="size-6 text-orange-300" />
                    <CardTitle className="font-semibold text-white">
                      {title}
                    </CardTitle>
                    <CardDescription className="leading-6 text-white/58">
                      {body}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </MotionSection>

      <LocalFoodBudgetSection copy={copy.local} />

      <ComparisonTable copy={copy.comparison} />

      <MotionSection id="testimonials" className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader
            align="center"
            label={copy.testimonials.label}
            title={copy.testimonials.title}
            body={copy.testimonials.body}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {copy.testimonials.items.map((item, index) => (
              <TestimonialCard key={item[0]} item={item} index={index} />
            ))}
          </div>
        </div>
      </MotionSection>

      <MotionSection
        id="premium"
        eventName="pricing_viewed"
        className="bg-muted/35 py-16 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <SectionHeader
            align="center"
            label={copy.premium.label}
            title={copy.premium.title}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <PricingCard
              title="Free"
              features={copy.premium.free}
              cta={copy.premium.freeCta}
              onClick={() => startOnboarding("pricing_free_cta_clicked")}
            />
            <PricingCard
              title="Premium"
              features={copy.premium.paid}
              cta={copy.premium.premiumCta}
              highlighted
              onClick={() => startOnboarding("premium_cta_clicked")}
            />
          </div>
        </div>
      </MotionSection>

      <MotionSection id="faq" className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionHeader
            align="center"
            label={copy.faq.label}
            title={copy.faq.title}
          />
          <FAQAccordion items={copy.faq.items} />
        </div>
      </MotionSection>

      <FinalCTA
        copy={copy.final}
        preview={copy.preview}
        onStart={startOnboarding}
      />
      <StickyCTA copy={copy.sticky} onStart={startOnboarding} />
    </main>
  );
};

export default LandingPage;
