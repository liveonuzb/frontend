import React from "react";
import { filter, isEqual, map, values } from "lodash";
import { useTranslation } from "react-i18next";
import {
  BellIcon,
  DropletsIcon,
  Link2Icon,
  MailIcon,
  MoonIcon,
  RefreshCwIcon,
  Settings2Icon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { TimePicker } from "@/components/ui/time-picker";
import useProfileSettings, {
  getRequestErrorMessage,
} from "@/hooks/app/use-profile-settings";
import {
  useCoachNotificationPreferences,
  useQuietHours,
} from "@/hooks/app/use-notifications";
import {
  NotificationFeedPanel,
  useNotificationCenterModel,
} from "@/components/notification-center";
import useMe from "@/hooks/app/use-me";
import useUserTelegram from "@/hooks/app/use-user-telegram";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";
import { useAuthStore } from "@/store";

const openTelegramLink = (url) => {
  if (!url) return;

  const tg = window.Telegram?.WebApp;
  if (typeof tg?.openTelegramLink === "function") {
    tg.openTelegramLink(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
};

const getNotificationOptions = (t) => [
  {
    key: "emailMarketing",
    title: t("profile.notifications.emailMarketing"),
    description: t("profile.notifications.emailMarketingDesc"),
    icon: SparklesIcon,
  },
  {
    key: "emailWorkout",
    title: t("profile.notifications.emailWorkout"),
    description: t("profile.notifications.emailWorkoutDesc"),
    icon: MailIcon,
  },
  {
    key: "pushMeal",
    title: t("profile.notifications.pushMeal"),
    description: t("profile.notifications.pushMealDesc"),
    icon: UtensilsIcon,
  },
  {
    key: "pushWater",
    title: t("profile.notifications.pushWater"),
    description: t("profile.notifications.pushWaterDesc"),
    icon: DropletsIcon,
  },
  {
    key: "pushProgress",
    title: t("profile.notifications.pushProgress"),
    description: t("profile.notifications.pushProgressDesc"),
    icon: BellIcon,
  },
];

const getTelegramLanguageLabel = (languageCode, t) => {
  if (languageCode === "ru") {
    return t("profile.general.languageRu", {
      defaultValue: "Русский",
    });
  }

  if (languageCode === "en") {
    return t("profile.general.languageEn", {
      defaultValue: "English",
    });
  }

  return t("profile.general.languageUz", {
    defaultValue: "O'zbek",
  });
};

const createInitialForm = (settings) => ({
  emailMarketing: settings.emailMarketing ?? true,
  emailWorkout: settings.emailWorkout ?? true,
  pushMeal: settings.pushMeal ?? true,
  pushWater: settings.pushWater ?? false,
  pushProgress: settings.pushProgress ?? true,
});

const COACH_NOTIFICATION_LABELS = {
  COACH_PAYMENT_DUE: {
    title: "To'lov muddati",
    description: "Mijoz to'lovi yaqinlashganda signal.",
  },
  COACH_PAYMENT_OVERDUE: {
    title: "Kechikkan to'lov",
    description: "To'lov muddati o'tganda yuqori prioritet signal.",
  },
  COACH_CHECK_IN_SUBMITTED: {
    title: "Check-in yuborildi",
    description: "Mijoz haftalik check-in topshirganda.",
  },
  COACH_SESSION_REMINDER: {
    title: "Sessiya eslatmasi",
    description: "Rejalashtirilgan sessiya boshlanishidan oldin.",
  },
  COACH_COURSE_PURCHASE: {
    title: "Kurs xaridi",
    description: "Telegramdan yangi kurs to'lov cheki kelganda.",
  },
  COACH_BOT_ERROR: {
    title: "Bot xatosi",
    description: "Telegram bot ishlovida xatolik bo'lganda.",
  },
  WEEKLY_CHECK_IN: {
    title: "Weekly check-in",
    description: "Kutilayotgan yoki kechikkan weekly check-inlar.",
  },
  COACH_FEEDBACK: {
    title: "Feedback",
    description: "Mijoz feedback oqimi bo'yicha signal.",
  },
  COACH_TASK: {
    title: "Vazifa",
    description: "Coach vazifalari va progress signallari.",
  },
  COACH_PLAN_UPDATE: {
    title: "Plan update",
    description: "Meal/workout plan yangilanish holatlari.",
  },
  COACH_CONNECTED: {
    title: "Coach ulanishi",
    description: "Coach-client aloqasi bo'yicha yangilanishlar.",
  },
};

const NotificationsSettingsForm = ({ form, setForm, t }) => (
  <div className="space-y-3">
    {getNotificationOptions(t).map((option) => {
      const Icon = option.icon;

      return (
        <Card key={option.key}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{option.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              checked={form[option.key]}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, [option.key]: checked }))
              }
            />
          </CardContent>
        </Card>
      );
    })}
  </div>
);

const TelegramConnectCard = ({ t }) => {
  const { user, refetch, isFetching } = useMe();
  const { createConnectLink, isCreatingConnectLink } = useUserTelegram();
  const telegramConnected = Boolean(user?.telegramConnected);
  const telegramLanguageLabel = getTelegramLanguageLabel(
    user?.telegramLanguage,
    t,
  );
  const telegramMuted = Boolean(user?.telegramMuted);

  const handleConnect = React.useCallback(async () => {
    try {
      const payload = await createConnectLink();
      openTelegramLink(payload?.deepLink || payload?.botUrl);
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.notifications.telegramError", {
            defaultValue: "Telegram ulash havolasini yaratib bo'lmadi.",
          }),
        ),
      );
    }
  }, [createConnectLink, t]);

  const handleRefresh = React.useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <Card className="border-border/60 bg-card/90 shadow-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Link2Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {t("profile.notifications.telegramTitle", {
                defaultValue: "Telegram bot",
              })}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {telegramConnected
                ? t("profile.notifications.telegramConnectedDesc", {
                    defaultValue:
                      "LiveOn reminder bot ulangan. /start orqali tilni o'zgartirish, statusni ko'rish va reminderlarni boshqarish mumkin.",
                  })
                : t("profile.notifications.telegramDisconnectedDesc", {
                    defaultValue:
                      "Reminderlarni Telegramga yuborish uchun @liveonappbot ni ulang, botda /start bosib tilni tanlang.",
                  })}
            </p>
            {telegramConnected ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {t("profile.notifications.telegramLanguage", {
                    defaultValue: "Til",
                  })}
                  : {telegramLanguageLabel}
                </span>
                <span>
                  {t("profile.notifications.telegramChatStatus", {
                    defaultValue: "Chat status",
                  })}
                  :{" "}
                  {telegramMuted
                    ? t("profile.notifications.telegramPaused", {
                        defaultValue: "To'xtatilgan",
                      })
                    : t("profile.notifications.telegramActive", {
                        defaultValue: "Faol",
                      })}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleConnect}
            disabled={isCreatingConnectLink}
          >
            {telegramConnected
              ? t("profile.notifications.telegramOpen", {
                  defaultValue: "Botni ochish",
                })
              : t("profile.notifications.telegramConnect", {
                  defaultValue: "Telegramni ulash",
                })}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCwIcon className="size-4" />
            {t("profile.notifications.telegramRefresh", {
              defaultValue: "Statusni yangilash",
            })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationSettingsDrawer = ({
  open,
  onOpenChange,
  isCoach = false,
}) => {
  const { t } = useTranslation();
  const { settings, saveNotificationSettings, isSavingNotifications } =
    useProfileSettings();
  const initialForm = React.useMemo(
    () => createInitialForm(settings),
    [settings],
  );
  const [form, setForm] = React.useState(initialForm);
  const {
    preferences: coachPreferences,
    updatePreferences: updateCoachPreferences,
    isUpdating: isUpdatingCoachPreferences,
  } = useCoachNotificationPreferences({
    enabled: open && isCoach,
  });
  const initialCoachPrefsForm = React.useMemo(
    () =>
      coachPreferences.map((preference) => ({
        type: preference.type,
        inAppEnabled: preference.inAppEnabled ?? true,
        pushEnabled: preference.pushEnabled ?? true,
        emailEnabled: preference.emailEnabled ?? false,
        digestEnabled: preference.digestEnabled ?? false,
      })),
    [coachPreferences],
  );
  const [coachPrefsForm, setCoachPrefsForm] = React.useState([]);
  const {
    quietHours,
    updateQuietHours,
    isUpdating: isUpdatingQuietHours,
  } = useQuietHours({
    enabled: open,
  });
  const [qhEnabled, setQhEnabled] = React.useState(false);
  const [qhStart, setQhStart] = React.useState("22:00");
  const [qhEnd, setQhEnd] = React.useState("08:00");

  React.useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  React.useEffect(() => {
    setCoachPrefsForm(initialCoachPrefsForm);
  }, [initialCoachPrefsForm]);

  React.useEffect(() => {
    setQhEnabled(quietHours.enabled ?? false);
    setQhStart(quietHours.start ?? "22:00");
    setQhEnd(quietHours.end ?? "08:00");
  }, [quietHours.enabled, quietHours.end, quietHours.start]);

  const isDirty = !isEqual(form, initialForm);
  const isCoachPrefsDirty =
    isCoach && !isEqual(coachPrefsForm, initialCoachPrefsForm);
  const isQuietHoursDirty =
    qhEnabled !== (quietHours.enabled ?? false) ||
    qhStart !== (quietHours.start ?? "22:00") ||
    qhEnd !== (quietHours.end ?? "08:00");

  const handleSave = React.useCallback(async () => {
    try {
      await Promise.all([
        isDirty ? saveNotificationSettings(form) : Promise.resolve(),
        isCoach && isCoachPrefsDirty
          ? updateCoachPreferences(coachPrefsForm)
          : Promise.resolve(),
        isQuietHoursDirty
          ? updateQuietHours({
              enabled: qhEnabled,
              start: qhStart,
              end: qhEnd,
            })
          : Promise.resolve(),
      ]);
      toast.success(t("profile.notifications.saveSuccess"));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, t("profile.notifications.saveError")),
      );
    }
  }, [
    coachPrefsForm,
    form,
    isCoach,
    isCoachPrefsDirty,
    isDirty,
    isQuietHoursDirty,
    onOpenChange,
    qhEnabled,
    qhEnd,
    qhStart,
    saveNotificationSettings,
    t,
    updateCoachPreferences,
    updateQuietHours,
  ]);

  const updateCoachPreferenceField = React.useCallback((type, field, value) => {
    setCoachPrefsForm((current) =>
      current.map((preference) =>
        preference.type === type
          ? {
              ...preference,
              [field]: value,
            }
          : preference,
      ),
    );
  }, []);

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("profile.notifications.settingsTitle")}</DrawerTitle>
          <DrawerDescription>
            {t("profile.notifications.settingsSubtitle")}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <TelegramConnectCard t={t} />
          <NotificationsSettingsForm form={form} setForm={setForm} t={t} />

          {isCoach && coachPrefsForm.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-primary" />
                <p className="text-sm font-semibold">
                  Coach notification center
                </p>
              </div>
              {coachPrefsForm.map((preference) => {
                const labels = COACH_NOTIFICATION_LABELS[preference.type] ?? {
                  title: preference.type,
                  description: "Coach notification turi.",
                };

                return (
                  <Card key={preference.type}>
                    <CardContent className="space-y-4 p-4">
                      <div>
                        <p className="font-semibold">{labels.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {labels.description}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                          <span className="text-sm">Feed’da ko'rsatish</span>
                          <Switch
                            checked={preference.inAppEnabled}
                            onCheckedChange={(checked) =>
                              updateCoachPreferenceField(
                                preference.type,
                                "inAppEnabled",
                                checked,
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                          <span className="text-sm">Daily digest</span>
                          <Switch
                            checked={preference.digestEnabled}
                            onCheckedChange={(checked) =>
                              updateCoachPreferenceField(
                                preference.type,
                                "digestEnabled",
                                checked,
                              )
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MoonIcon className="size-4 text-primary" />
              <p className="text-sm font-semibold">Tinch soatlar</p>
            </div>
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Yoqish</p>
                    <p className="text-xs text-muted-foreground">
                      Belgilangan vaqtda bildirishnomalar yuborilmaydi
                    </p>
                  </div>
                  <Switch checked={qhEnabled} onCheckedChange={setQhEnabled} />
                </div>

                {qhEnabled ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Boshlanish
                      </p>
                      <TimePicker value={qhStart} onChange={setQhStart} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Tugash
                      </p>
                      <TimePicker value={qhEnd} onChange={setQhEnd} />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button
            type="button"
            disabled={
              (!isDirty && !isCoachPrefsDirty && !isQuietHoursDirty) ||
              isSavingNotifications ||
              isUpdatingCoachPreferences ||
              isUpdatingQuietHours
            }
            onClick={handleSave}
          >
            {isSavingNotifications ||
            isUpdatingCoachPreferences ||
            isUpdatingQuietHours
              ? t("profile.general.saving")
              : t("profile.general.save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const NotificationsTab = ({ embedded = false }) => {
  const { t } = useTranslation();
  const activeRole = useAuthStore((state) => state.activeRole);
  const isCoach = activeRole === "COACH";
  const notificationModel = useNotificationCenterModel();
  const { closeProfile } = useProfileOverlay();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const feedContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("profile.notifications.feedSubtitle")}
          </p>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("profile.tabs.notifications")}
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2Icon className="size-4" />
          Sozlamalar
        </Button>
      </div>

      <div className="mt-4 min-h-0 flex-1">
        <div className="mb-4">
          <TelegramConnectCard t={t} />
        </div>
        <NotificationFeedPanel
          model={notificationModel}
          contentClassName={embedded ? "max-h-[48vh]" : "max-h-[56vh]"}
          onSelectNotification={(notification) => {
            if (embedded) {
              closeProfile();
            }
            void notificationModel.handleNotificationClick(notification);
          }}
        />
      </div>

      {!embedded ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("profile.notifications.feedHint")}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      {embedded ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8 sm:px-6">
            {feedContent}
          </div>
        </div>
      ) : (
        feedContent
      )}

      <NotificationSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isCoach={isCoach}
      />
    </>
  );
};
