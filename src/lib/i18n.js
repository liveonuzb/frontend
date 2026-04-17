import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Common translations
import commonUz from "@/lib/locales/uz.json";
import commonEn from "@/lib/locales/en.json";
import commonRu from "@/lib/locales/ru.json";

// Module translations
import authUz from "@/modules/auth/lib/locales/uz.json";
import authEn from "@/modules/auth/lib/locales/en.json";
import authRu from "@/modules/auth/lib/locales/ru.json";

import coachUz from "@/modules/coach/lib/locales/uz.json";
import coachEn from "@/modules/coach/lib/locales/en.json";
import coachRu from "@/modules/coach/lib/locales/ru.json";

import profileUz from "@/modules/profile/lib/locales/uz.json";
import profileEn from "@/modules/profile/lib/locales/en.json";
import profileRu from "@/modules/profile/lib/locales/ru.json";

import userUz from "@/modules/user/lib/locales/uz.json";
import userEn from "@/modules/user/lib/locales/en.json";
import userRu from "@/modules/user/lib/locales/ru.json";

import adminUz from "@/modules/admin/lib/locales/uz.json";
import adminEn from "@/modules/admin/lib/locales/en.json";
import adminRu from "@/modules/admin/lib/locales/ru.json";

import onboardingUz from "@/modules/onboarding/lib/locales/uz.json";
import onboardingEn from "@/modules/onboarding/lib/locales/en.json";
import onboardingRu from "@/modules/onboarding/lib/locales/ru.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: {
        translation: {
          ...commonUz,
          ...authUz,
          ...coachUz,
          ...profileUz,
          ...userUz,
          ...adminUz,
          ...onboardingUz,
        },
      },
      en: {
        translation: {
          ...commonEn,
          ...authEn,
          ...coachEn,
          ...profileEn,
          ...userEn,
          ...adminEn,
          ...onboardingEn,
        },
      },
      ru: {
        translation: {
          ...commonRu,
          ...authRu,
          ...coachRu,
          ...profileRu,
          ...userRu,
          ...adminRu,
          ...onboardingRu,
        },
      },
    },
    fallbackLng: "uz",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
