import { describe, expect, it } from "vitest";
import {
  buildCoachOnboardingPayload,
  mapCoachOnboardingDraftToStoreFields,
  normalizeCoachStepForApi,
} from "../../lib/coach-onboarding-dto";

describe("coach onboarding DTO mapping", () => {
  it("normalizes UI step ids to backend DTO step ids", () => {
    expect(normalizeCoachStepForApi("coach/category")).toBe("marketplace");
    expect(normalizeCoachStepForApi("coach/avatar")).toBe("marketplace");
    expect(normalizeCoachStepForApi("coach/pricing")).toBe("pricing");
  });

  it("builds the backend update payload from onboarding store fields", () => {
    expect(
      buildCoachOnboardingPayload({
        coachCategory: "FITNESS",
        coachCategories: ["YOGA"],
        targetAudience: ["beginners"],
        experience: "3 yil",
        specializations: ["weight-loss"],
        certificationType: "none",
        coachLanguages: ["uz", "ru"],
        coachCity: "Toshkent",
        coachWorkMode: "online",
        coachMonthlyPrice: "150000",
        coachMinMonthlyPrice: "",
        coachMaxMonthlyPrice: "250000",
        coachBio: "Kuch va vazn tashlash bo'yicha trener",
        wantsMarketplaceListing: true,
      }),
    ).toMatchObject({
      category: "FITNESS",
      categories: ["YOGA"],
      targetAudience: ["beginners"],
      experience: "3 yil",
      specializations: ["weight-loss"],
      certificationType: "none",
      languages: ["uz", "ru"],
      city: "Toshkent",
      workMode: "online",
      monthlyPrice: 150000,
      minMonthlyPrice: undefined,
      maxMonthlyPrice: 250000,
      bio: "Kuch va vazn tashlash bo'yicha trener",
      wantsMarketplaceListing: true,
    });
  });

  it("restores both new DTO keys and legacy draft keys into store fields", () => {
    expect(
      mapCoachOnboardingDraftToStoreFields({
        category: "BOXING",
        categories: ["MARTIAL_ARTS"],
        languages: ["uz"],
        city: "Samarqand",
        workMode: "hybrid",
        monthlyPrice: 90000,
        minMonthlyPrice: 50000,
        maxMonthlyPrice: 120000,
        bio: "Boks treneri",
        avatar: "https://cdn.example/avatar.jpg",
        wantsMarketplaceListing: false,
      }),
    ).toMatchObject({
      coachCategory: "BOXING",
      coachCategories: ["MARTIAL_ARTS"],
      coachLanguages: ["uz"],
      coachCity: "Samarqand",
      coachWorkMode: "hybrid",
      coachMonthlyPrice: "90000",
      coachMinMonthlyPrice: "50000",
      coachMaxMonthlyPrice: "120000",
      coachBio: "Boks treneri",
      coachAvatar: "https://cdn.example/avatar.jpg",
      wantsMarketplaceListing: false,
    });
  });
});
