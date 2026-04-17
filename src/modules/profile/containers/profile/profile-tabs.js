import {
  BellIcon,
  CrownIcon,
  GlobeIcon,
  HeartPulseIcon,
  KeyIcon,
  PaletteIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { UserProfileTab } from "./tabs/user-profile-tab";
import { GeneralTab } from "./tabs/general-tab";
import { AppearanceTab } from "./tabs/appearance-tab";
import { HealthTab } from "./tabs/health-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { SecurityTab } from "./tabs/security-tab";
import { PremiumTab } from "./tabs/premium-tab";
import { ReferralTab } from "./tabs/referral-tab";
import { PROFILE_TAB_IDS } from "@/modules/profile/lib/profile-tab-registry";

const PROFILE_TAB_DEFINITIONS = [
  {
    id: "profile",
    labelKey: "profile.tabs.profile",
    descriptionKey: "profile.subtitle",
    icon: UserIcon,
    component: UserProfileTab,
  },
  {
    id: "general",
    labelKey: "profile.tabs.general",
    descriptionKey: "profile.language.description",
    icon: GlobeIcon,
    component: GeneralTab,
  },
  {
    id: "appearance",
    labelKey: "profile.tabs.appearance",
    descriptionKey: "profile.appearance.description",
    icon: PaletteIcon,
    component: AppearanceTab,
  },
  {
    id: "health",
    labelKey: "profile.tabs.health",
    descriptionKey: "profile.health.description",
    icon: HeartPulseIcon,
    component: HealthTab,
  },
  {
    id: "notifications",
    labelKey: "profile.tabs.notifications",
    descriptionKey: "profile.notifications.description",
    icon: BellIcon,
    component: NotificationsTab,
  },
  {
    id: "privacy",
    labelKey: "profile.tabs.privacy",
    descriptionKey: "profile.privacy.description",
    icon: ShieldIcon,
    component: PrivacyTab,
  },
  {
    id: "security",
    labelKey: "profile.tabs.security",
    descriptionKey: "profile.security.description",
    icon: KeyIcon,
    component: SecurityTab,
  },
  {
    id: "premium",
    labelKey: "profile.tabs.premium",
    descriptionKey: "profile.premium.description",
    icon: CrownIcon,
    component: PremiumTab,
  },
  {
    id: "referral",
    labelKey: "profile.tabs.referral",
    descriptionKey: "profile.referral.description",
    icon: SparklesIcon,
    component: ReferralTab,
  },
];

if (import.meta.env.DEV) {
  const registryIds = PROFILE_TAB_DEFINITIONS.map(({ id }) => id);
  const hasRegistryMismatch =
    registryIds.length !== PROFILE_TAB_IDS.length ||
    registryIds.some((id, index) => id !== PROFILE_TAB_IDS[index]);

  if (hasRegistryMismatch) {
    throw new Error("Profile tab registry is out of sync with profile tabs.");
  }
}

export const getProfileTabs = (t) =>
  PROFILE_TAB_DEFINITIONS.map(
    ({ id, labelKey, descriptionKey, icon, component }) => ({
      id,
      label: t(labelKey),
      description: t(descriptionKey),
      icon,
      component,
    }),
  );
