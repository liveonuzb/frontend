import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  get,
  map,
  split,
  join,
  size,
  slice,
  find,
  toUpper,
  filter,
  values,
} from "lodash";
import {
  CheckIcon,
  ChevronRightIcon,
  CrownIcon,
  PencilIcon,
  ZapIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import GamificationBadges from "@/components/gamification-badges";
import { Progress } from "@/components/ui/progress";
import CoachConnectionDetailsDrawer from "@/components/coach-connection-details-drawer";
import { useBreadcrumbStore, useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import OnboardingHealthReportCard from "@/components/onboarding-health-report-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DEFAULT_PROFILE_TAB,
  PROFILE_OVERVIEW_TAB,
  useProfileOverlay,
} from "@/modules/profile/hooks/use-profile-overlay";
import {
  normalizeProfileContentTab,
  normalizeProfileOverlayTab,
} from "@/modules/profile/lib/profile-tab-registry";
import { getStandaloneProfileTabPath } from "@/modules/profile/lib/profile-tab-navigation";
import { getUserOnboardingReportPath } from "@/lib/app-paths";
import useAppLanguages from "@/hooks/app/use-app-languages";
import { useLanguageStore } from "@/store";
import { ROLE_CONFIG } from "@/components/role-switcher";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import AccountDangerZone from "./account-danger-zone";
import { NotificationSettingsDrawer } from "./tabs/notifications-tab";
import { getProfileTabs } from "./profile-tabs";

const FALLBACK_LANGUAGES = [
  { code: "uz", name: "O'zbek tili", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

const SETTINGS_GROUPS = [
  ["general", "health", "notifications"],
  ["privacy", "security"],
  ["premium", "referral"],
];
const EMPTY_PROFILE_SETTINGS = {};

const getProfileIdentity = (user) => {
  const firstName = get(user, "firstName", "");
  const lastName = get(user, "lastName", "");
  const username = get(user, "username", "");

  const displayName = `${firstName} ${lastName}`.trim() || username || "User";

  const initials = join(
    map(split(displayName, " "), (part) => get(part, "[0]", "")),
    "",
  )
    .slice(0, 2)
    .toUpperCase();

  return { displayName, initials };
};

const getLanguageLabel = (languageCode) => {
  if (languageCode === "ru") {
    return "Русский";
  }

  if (languageCode === "en") {
    return "English";
  }

  return "O'zbek";
};

const getPremiumLabel = (user, t) => {
  if (user?.premium?.status === "active") {
    return t("profile.premium.status.active");
  }

  return t("profile.premium.status.free");
};

const getCoachConnectionSummary = (user) => {
  const coach = get(user, "coachConnection.coach");

  if (!get(coach, "id")) {
    return null;
  }

  return {
    id: coach.id,
    name: get(coach, "name", "Coach"),
    avatar: get(coach, "avatar"),
    email: get(coach, "email"),
    phone: get(coach, "phone"),
    status: get(user, "coachConnection.status"),
    specializations: get(coach, "specializations", []),
    connectedAt: get(user, "coachConnection.connectedAt"),
  };
};

const getNotificationSettingsCount = (settings) => {
  const source = settings ?? {};

  return filter(
    values({
      emailMarketing: source.emailMarketing ?? true,
      emailWorkout: source.emailWorkout ?? true,
      pushMeal: source.pushMeal ?? true,
      pushWater: source.pushWater ?? false,
      pushProgress: source.pushProgress ?? true,
    }),
    Boolean,
  ).length;
};

const formatConnectedDate = (value, t) => {
  if (!value) {
    return t("profile.coach.notSpecified");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t("profile.coach.notSpecified");
  }

  return new Intl.DateTimeFormat(t("common.locale", "uz-UZ"), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const CoachConnectionCard = ({ coachConnection, onOpenDetails }) => {
  const { t } = useTranslation();
  if (!coachConnection) {
    return null;
  }

  const initials = join(
    map(split(get(coachConnection, "name", ""), " "), (part) =>
      get(part, "[0]", ""),
    ),
    "",
  )
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="overflow-hidden py-6">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          <Avatar className="size-12 border">
            <AvatarImage
              src={get(coachConnection, "avatar")}
              alt={get(coachConnection, "name")}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("profile.coach.myCoach")}
            </div>
            <div className="text-base font-semibold">
              {get(coachConnection, "name")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("profile.coach.connectedAt", {
                date: formatConnectedDate(
                  get(coachConnection, "connectedAt"),
                  t,
                ),
              })}
            </div>
          </div>
        </div>

        {size(get(coachConnection, "specializations")) > 0 ? (
          <div className="flex flex-wrap gap-2">
            {map(
              slice(get(coachConnection, "specializations"), 0, 4),
              (item) => (
                <div
                  key={item}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              {t("profile.coach.email")}
            </div>
            <div className="mt-1 text-sm font-medium">
              {get(coachConnection, "email", t("profile.coach.notProvided"))}
            </div>
          </div>
          <div className="rounded-2xl border px-4 py-3">
            <div className="text-xs text-muted-foreground">
              {t("profile.coach.phone")}
            </div>
            <div className="mt-1 text-sm font-medium">
              {get(coachConnection, "phone", t("profile.coach.notProvided"))}
            </div>
          </div>
        </div>

        {onOpenDetails ? (
          <Button type="button" variant="outline" onClick={onOpenDetails}>
            {t("profile.viewDetails")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

const SettingsItem = ({
  icon: Icon,
  label,
  value,
  onClick,
  active = false,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3.5 px-6 py-4 text-left transition-colors sm:px-7",
      active ? "text-foreground" : "hover:bg-muted/40",
    )}
  >
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-4.5" />
    </div>
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="text-sm font-medium sm:text-[15px]">{label}</span>
      {value ? (
        <span className="ml-auto truncate text-xs text-muted-foreground sm:text-sm">
          {value}
        </span>
      ) : null}
    </div>
    <ChevronRightIcon
      className={cn(
        "size-4 shrink-0",
        active ? "text-primary" : "text-muted-foreground",
      )}
    />
  </button>
);

const getTabConfig = (tabId, user, t) => {
  const tabs = getProfileTabs(t);
  const tab = find(tabs, (tab) => tab.id === tabId) ?? null;
  if (!tab) return null;

  return tab;
};

const InlinePremiumItem = ({ tab, value, onClick }) => (
  <SettingsItem
    icon={tab.icon}
    label={tab.label}
    value={value}
    onClick={onClick}
  />
);

const InlineNotificationsItem = ({ tab, value, isCoach }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <SettingsItem
        icon={tab.icon}
        label={tab.label}
        value={value}
        onClick={() => setOpen(true)}
      />
      {open ? (
        <NotificationSettingsDrawer
          open={open}
          onOpenChange={setOpen}
          isCoach={isCoach}
        />
      ) : null}
    </>
  );
};

const getOverviewValue = (tabId, user, completion, t) => {
  switch (tabId) {
    case "general":
      return getLanguageLabel(user?.settings?.language);
    case "premium":
      return user?.premium?.status === "active"
        ? t("profile.premium.status.active")
        : t("profile.premium.status.free");
    case "referral":
      return `${completion}%`;
    default:
      return undefined;
  }
};

const InlineLangItem = ({
  tab,
  languages,
  currentLang,
  resolvedLang,
  setCurrentLanguage,
}) => {
  const { t } = useTranslation();
  const { saveGeneralSettings } = useProfileSettings();
  const [open, setOpen] = React.useState(false);

  const handleLanguageSelect = React.useCallback(
    async (languageCode) => {
      try {
        setCurrentLanguage(languageCode);
        await saveGeneralSettings({ language: languageCode });
        toast.success(t("profile.language.success"));
        setOpen(false);
      } catch (error) {
        toast.error(getRequestErrorMessage(error, t("profile.language.error")));
      }
    },
    [saveGeneralSettings, setCurrentLanguage, t],
  );
  return (
    <>
      <SettingsItem
        icon={tab.icon}
        label={tab.label}
        value={
          resolvedLang
            ? `${resolvedLang.flag} ${resolvedLang.name}`
            : currentLang.toUpperCase()
        }
        onClick={() => setOpen(true)}
      />
      {open ? (
        <Drawer open={open} onOpenChange={setOpen} direction="bottom">
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("profile.language.drawerTitle")}</DrawerTitle>
              <DrawerDescription>
                {t("profile.language.drawerDescription")}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerBody className="space-y-2">
              {map(languages, (language) => {
                const languageCode = get(language, "code");
                const isSelected = languageCode === currentLang;
                return (
                  <button
                    key={get(language, "id") || languageCode}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => void handleLanguageSelect(languageCode)}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl border p-4",
                        isSelected && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="text-base leading-none">
                          {get(language, "flag", "🌐")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium">{get(language, "name")}</p>
                          <p className="text-sm text-muted-foreground">
                            {toUpper(languageCode)}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckIcon className="size-4 text-primary" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
};

const SettingsGroupCard = ({
  items,
  activeTab,
  onTabChange,
  valueResolver,
  customRenderer,
  user,
  t,
}) => (
  <Card className="overflow-hidden py-6">
    <CardContent className="p-0">
      {map(items, (tabId, index) => {
        const tab = getTabConfig(tabId, user, t);

        if (!tab) {
          return null;
        }

        const custom = customRenderer?.(tabId);

        return (
          <React.Fragment key={tabId}>
            {index > 0 ? <div className="mx-6 border-t sm:mx-7" /> : null}
            {custom ?? (
              <SettingsItem
                icon={get(tab, "icon")}
                label={get(tab, "label")}
                value={valueResolver?.(tabId)}
                active={tabId === activeTab}
                onClick={() => onTabChange(tabId)}
              />
            )}
          </React.Fragment>
        );
      })}
    </CardContent>
  </Card>
);

const EmbeddedSettingsOverview = ({ user, completion, onTabChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { closeProfile } = useProfileOverlay();
  const { displayName, initials } = getProfileIdentity(user);
  const coachConnection = getCoachConnectionSummary(user);
  const [isCoachDetailsOpen, setIsCoachDetailsOpen] = React.useState(false);
  const setCurrentLanguage = useLanguageStore(
    (state) => state.setCurrentLanguage,
  );

  const { languages } = useAppLanguages();
  const settings = useAuthStore(
    (state) => state.user?.settings ?? EMPTY_PROFILE_SETTINGS,
  );
  const roles = useAuthStore((state) => state.roles);
  const activeRole = useAuthStore((state) => state.activeRole);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const isCoach = Array.isArray(roles) && roles.includes("COACH");
  const activeLanguages = React.useMemo(() => {
    const source = languages.length ? languages : FALLBACK_LANGUAGES;
    return source.filter((l) => l.isActive !== false);
  }, [languages]);
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "uz";
  const availableRoles = React.useMemo(() => {
    const configuredRoles = Object.keys(ROLE_CONFIG);
    const nextRoles = new Set(Array.isArray(roles) ? roles : []);
    nextRoles.add("USER");
    return configuredRoles.filter((role) => nextRoles.has(role));
  }, [roles]);
  const currentRole = React.useMemo(() => {
    if (activeRole && availableRoles.includes(activeRole)) {
      return activeRole;
    }

    return availableRoles[0] ?? "USER";
  }, [activeRole, availableRoles]);
  const xp = Number(user?.xp) || 0;
  const level = Number(user?.level) || 1;
  const levelProgress = Math.max(
    0,
    Math.min(100, Number(user?.levelProgress) || 0),
  );
  const levelRemaining = Math.max(0, 100 - levelProgress);
  const streakDays = 3;

  const handleRoleSwitch = React.useCallback(
    (role) => {
      const nextConfig = ROLE_CONFIG[role];
      if (!nextConfig) {
        return;
      }

      setActiveRole(role);
      closeProfile();
      navigate(nextConfig.path);
    },
    [closeProfile, navigate, setActiveRole],
  );
  const openHealthReport = React.useCallback(() => {
    closeProfile?.();
    navigate(getUserOnboardingReportPath());
  }, [closeProfile, navigate]);

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden border-border/60 py-0 shadow-none">
        <CardContent className="space-y-4 p-0">
          <div className="bg-gradient-to-b from-primary/10 via-background to-background px-5 pb-4 pt-5">
            <div className="flex items-start justify-center gap-4 mb-2">
              <div className="relative shrink-0">
                <Avatar className="size-20 border-2 border-background shadow-sm">
                  <AvatarImage src={user?.avatar} alt={displayName} />
                  <AvatarFallback className="text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => onTabChange("profile")}
                  className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                >
                  <PencilIcon className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="text-center">
              <p className="truncate text-lg font-semibold tracking-tight leading-none">
                {displayName}
              </p>
              {user?.email || user?.phone ? (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {user?.email || user?.phone}
                </p>
              ) : null}
              <p className="truncate text-sm font-medium">
                {user?.username
                  ? `@${user.username}`
                  : t("profile.usernamePlaceholder")}
              </p>
            </div>
          </div>

          <div className="px-5 pb-5">
            {/* Level Unit - Above the Card */}
            <div className="mb-4 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1.5 rounded-3xl bg-primary/20 blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative flex size-14 items-center justify-center rounded-[1.25rem] bg-primary text-primary-foreground shadow-lg transform rotate-2 group-hover:rotate-0 transition-all">
                  <span className="text-2xl font-black leading-none italic">
                    {level}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 italic">
                {t("profile.level", { level })}
              </p>
            </div>

            {/* Stats Card - Unified Pill Row */}
            <div className="rounded-[2.25rem] border border-border/50 bg-muted/5 p-5 shadow-xs transition-colors hover:bg-muted/10">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3.5 py-1.5 shadow-xs transition-all hover:border-primary/30">
                  <CrownIcon className="size-3.5 text-primary" />
                  <span className="max-w-[80px] truncate text-xs font-bold italic text-foreground/80">
                    {xp} XP
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3.5 py-1.5 shadow-xs transition-all hover:border-amber-500/30">
                  <ZapIcon className="size-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="max-w-[80px] truncate text-xs font-bold italic text-foreground/80">
                    {t("profile.streakDays", { count: streakDays })}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/60 px-3.5 py-1.5 shadow-xs transition-all hover:border-emerald-500/30">
                  <CheckCircle2Icon className="size-3.5 text-emerald-500" />
                  <span className="max-w-[80px] truncate text-xs font-bold italic text-foreground/80">
                    {levelProgress}%
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                <Progress
                  value={levelProgress}
                  className="h-1.5 bg-primary/5"
                />
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/30 italic">
                  {t("profile.nextLevel", { percent: levelRemaining })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {availableRoles.length > 1 ? (
        <Card className="overflow-hidden py-2 shadow-none border-border/60">
          <div className="px-6 py-3">
            <p className="text-sm font-semibold text-primary tracking-wide">
              {t("common.navUser.accounts")}
            </p>
          </div>
          <CardContent className="p-0">
            {map(availableRoles, (role, index) => {
              const config = get(ROLE_CONFIG, role);
              if (!config) return null;

              const isActive = role === currentRole;
              const RoleIcon = config.icon;

              return (
                <React.Fragment key={role}>
                  {index > 0 ? (
                    <div className="mx-6 border-t border-border/40 sm:mx-7" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleRoleSwitch(role)}
                    className="flex w-full items-center gap-3.5 px-6 py-3.5 text-left transition-colors hover:bg-muted/40 sm:px-7"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-10 border border-border/50">
                        <AvatarImage
                          src={get(user, "avatar")}
                          alt={get(config, "label")}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <RoleIcon className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      {isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-background bg-emerald-500">
                          <CheckIcon
                            className="size-2.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5">
                      <span className="truncate text-[15px] font-medium leading-none">
                        {t(`common.roles.${role}.label`)}
                      </span>
                      <span className="truncate text-xs text-muted-foreground mt-0.5">
                        {t(`common.roles.${role}.description`)}
                      </span>
                    </div>
                    {!isActive ? (
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : null}
                  </button>
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <CoachConnectionCard
        coachConnection={coachConnection}
        onOpenDetails={
          coachConnection ? () => setIsCoachDetailsOpen(true) : undefined
        }
      />

      {isCoachDetailsOpen ? (
        <CoachConnectionDetailsDrawer
          open={isCoachDetailsOpen}
          onOpenChange={setIsCoachDetailsOpen}
          coachConnection={coachConnection}
        />
      ) : null}

      {map(SETTINGS_GROUPS, (group, index) => (
        <SettingsGroupCard
          key={index}
          items={group}
          onTabChange={(tabId) => {
            if (tabId === "general" || tabId === "premium") return;
            if (tabId === "health") {
              closeProfile?.();
              navigate(getStandaloneProfileTabPath("health") ?? "/user/health");
              return;
            }
            if (tabId === "referral") {
              closeProfile?.();
              navigate("/user/referrals");
              return;
            }
            onTabChange(tabId);
          }}
          user={{ ...user, _isCoach: isCoach }}
          t={t}
          valueResolver={(tabId) =>
            getOverviewValue(tabId, user, completion, t)
          }
          customRenderer={(tabId) => {
            if (tabId === "general") {
              const tabs = getProfileTabs(t);
              const tab = find(tabs, (t) => t.id === "general");
              const resolvedLang = find(
                activeLanguages,
                (l) => l.code === currentLang,
              );
              return (
                <InlineLangItem
                  key="lang-picker"
                  tab={tab}
                  languages={activeLanguages}
                  currentLang={currentLang}
                  resolvedLang={resolvedLang}
                  setCurrentLanguage={setCurrentLanguage}
                />
              );
            }
            if (tabId === "premium") {
              const tabs = getProfileTabs(t);
              const tab = find(tabs, (t) => t.id === "premium");
              return (
                <InlinePremiumItem
                  key="premium-item"
                  tab={tab}
                  value={getPremiumLabel(user, t)}
                  onClick={() => onTabChange("premium")}
                />
              );
            }
            if (tabId === "notifications") {
              const tabs = getProfileTabs(t);
              const tab = find(tabs, (t) => t.id === "notifications");
              return (
                <InlineNotificationsItem
                  key="notifications-item"
                  tab={tab}
                  isCoach={isCoach}
                  value={`${getNotificationSettingsCount(settings)} yoqilgan`}
                />
              );
            }
            return null;
          }}
        />
      ))}

      <OnboardingHealthReportCard
        compact
        title={t("profile.healthReport.title")}
        description={t("profile.healthReport.description")}
        badge={t("profile.healthReport.badge")}
        actionLabel={t("profile.healthReport.action")}
        onAction={openHealthReport}
      />

      <AccountDangerZone />
    </div>
  );
};

const getProfileCompletion = (user) => {
  const fields = [
    get(user, "firstName"),
    get(user, "lastName"),
    get(user, "username"),
    get(user, "email") || get(user, "phone"),
    get(user, "bio"),
  ];
  const completedCount = filter(fields, Boolean).length;
  return Math.round((completedCount / fields.length) * 100);
};

const getCompletionTone = (completion) => {
  if (completion >= 80) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (completion >= 50) {
    return "text-primary";
  }

  return "text-amber-600 dark:text-amber-400";
};

const SettingsSidebar = ({ activeTab, completion, onTabChange, user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const coachConnection = getCoachConnectionSummary(user);
  const [isCoachDetailsOpen, setIsCoachDetailsOpen] = React.useState(false);
  const roles = useAuthStore((state) => state.roles);
  const isCoach = Array.isArray(roles) && roles.includes("COACH");
  const enrichedUser = React.useMemo(
    () => ({ ...user, _isCoach: isCoach }),
    [user, isCoach],
  );

  const handleTabChange = React.useCallback(
    (tabId) => {
      if (tabId === "referral") {
        navigate("/user/referrals");
        return;
      }
      onTabChange(tabId);
    },
    [navigate, onTabChange],
  );
  const openHealthReport = React.useCallback(() => {
    navigate(getUserOnboardingReportPath());
  }, [navigate]);

  return (
    <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
      <Card className="border-border/60 py-6 shadow-none">
        <CardContent className="p-6">
          <GamificationBadges />
        </CardContent>
      </Card>
      {map(SETTINGS_GROUPS, (group, index) => (
        <SettingsGroupCard
          key={index}
          items={group}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={enrichedUser}
          t={t}
        />
      ))}
      <Card className="border-border/60 py-6 shadow-none">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t("profile.completion")}</p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  getCompletionTone(completion),
                )}
              >
                {completion}%
              </p>
            </div>
            <Progress value={completion} className="h-1.5 rounded-full" />
          </div>

          <div className="text-sm leading-6 text-muted-foreground">
            {t("profile.completionDesc")}
          </div>
        </CardContent>
      </Card>
      <CoachConnectionCard
        coachConnection={coachConnection}
        onOpenDetails={
          coachConnection ? () => setIsCoachDetailsOpen(true) : undefined
        }
      />
      <OnboardingHealthReportCard
        compact
        title={t("profile.healthReport.title")}
        description={t("profile.healthReport.description")}
        badge={t("profile.healthReport.badge")}
        actionLabel={t("profile.healthReport.action")}
        onAction={openHealthReport}
      />
      <CoachConnectionDetailsDrawer
        open={isCoachDetailsOpen}
        onOpenChange={setIsCoachDetailsOpen}
        coachConnection={coachConnection}
      />
    </aside>
  );
};

const Index = ({ embedded = false }) => {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProfileTab, setProfileTab } = useProfileOverlay();
  const tabs = React.useMemo(() => getProfileTabs(t), [t]);
  const rawRequestedTab = searchParams.get("tab");
  const requestedProfileTab = normalizeProfileContentTab(rawRequestedTab);
  const requestedTab = embedded ? activeProfileTab : requestedProfileTab;
  const activeConfig = tabs.find((tab) => tab.id === requestedTab) ?? null;
  const ActiveTab = activeConfig?.component ?? null;
  const completion = getProfileCompletion(user);

  React.useEffect(() => {
    if (embedded || rawRequestedTab === requestedProfileTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", requestedProfileTab);
    setSearchParams(nextParams, { replace: true });
  }, [
    embedded,
    rawRequestedTab,
    requestedProfileTab,
    searchParams,
    setSearchParams,
  ]);

  React.useEffect(() => {
    if (embedded) {
      return undefined;
    }

    setBreadcrumbs([
      { url: "/user", title: t("common.navUser.home") },
      { url: "/user/profile", title: t("common.navUser.profileAndSettings") },
    ]);
  }, [embedded, setBreadcrumbs, t]);

  const handleTabChange = React.useCallback(
    (tabId) => {
      if (embedded) {
        setProfileTab(normalizeProfileOverlayTab(tabId));
        return;
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("tab", normalizeProfileContentTab(tabId));
      setSearchParams(nextParams, { replace: true });
    },
    [embedded, searchParams, setProfileTab, setSearchParams],
  );

  if (embedded && requestedTab === PROFILE_OVERVIEW_TAB)
    return (
      <div className="p-3 pb-6">
        <EmbeddedSettingsOverview
          user={user}
          completion={completion}
          onTabChange={handleTabChange}
        />
      </div>
    );
  else {
    return embedded &&
      requestedTab === PROFILE_OVERVIEW_TAB ? null : embedded ? (
      ActiveTab ? (
        <ActiveTab embedded />
      ) : null
    ) : (
      <>
        {embedded ? null : (
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("profile.title")}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("profile.subtitle")}
            </p>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <SettingsSidebar
            activeTab={requestedTab}
            completion={completion}
            onTabChange={handleTabChange}
            user={user}
          />
          <main className="min-w-0">{ActiveTab ? <ActiveTab /> : null}</main>
        </div>
      </>
    );
  }
};

export default Index;
