import {
  BellIcon,
  GlobeIcon,
  HeartPulseIcon,
  KeyIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { UserProfileTab } from "./tabs/user-profile-tab";
import { GeneralTab } from "./tabs/general-tab";
import { HealthTab } from "./tabs/health-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { SecurityTab } from "./tabs/security-tab";
import { FriendsTab } from "./tabs/friends-tab";
import { ReferralTab } from "./tabs/referral-tab";
import { PROFILE_TAB_IDS } from "@/modules/profile/lib/profile-tab-registry";

import map from "lodash/map";
import some from "lodash/some";

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
    id: "friends",
    labelKey: "profile.tabs.friends",
    descriptionKey: "profile.friends.description",
    icon: UsersIcon,
    component: FriendsTab,
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
  const registryIds = map(PROFILE_TAB_DEFINITIONS, ({ id }) => id);
  const hasRegistryMismatch =
    registryIds.length !== PROFILE_TAB_IDS.length ||
    some(registryIds, (id, index) => id !== PROFILE_TAB_IDS[index]);

  if (hasRegistryMismatch) {
    throw new Error("Profile tab registry is out of sync with profile tabs.");
  }
}

export const getProfileTabs = (t) =>
  map(
    PROFILE_TAB_DEFINITIONS,
    ({ id, labelKey, descriptionKey, icon, component }) => ({
      id,
      label: t(labelKey),
      description: t(descriptionKey),
      icon,
      component,
    }),
  );
