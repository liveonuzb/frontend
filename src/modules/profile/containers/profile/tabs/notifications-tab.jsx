import React from "react";
import isEqual from "lodash/isEqual";
import map from "lodash/map";
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
  UnplugIcon,
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
import { useQuietHours } from "@/hooks/app/use-notifications";
import useMe from "@/hooks/app/use-me";
import useUserTelegram from "@/hooks/app/use-user-telegram";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";

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

const createInitialForm = (settings) => {
  const source = settings ?? {};

  return {
    emailMarketing: source.emailMarketing ?? true,
    emailWorkout: source.emailWorkout ?? true,
    pushMeal: source.pushMeal ?? true,
    pushWater: source.pushWater ?? false,
    pushProgress: source.pushProgress ?? true,
  };
};

const NotificationsSettingsForm = ({ form, setForm, t }) => (
  <div className="space-y-3">
    {map(getNotificationOptions(t), (option) => {
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
  const {
    createConnectLink,
    disconnectTelegram,
    isCreatingConnectLink,
    isDisconnectingTelegram,
  } = useUserTelegram();
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

  const handleDisconnect = React.useCallback(async () => {
    try {
      await disconnectTelegram();
      toast.success(
        t("profile.notifications.telegramDisconnectSuccess", {
          defaultValue: "Telegram uzildi.",
        }),
      );
      void refetch();
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          t("profile.notifications.telegramDisconnectError", {
            defaultValue: "Telegramni uzib bo'lmadi.",
          }),
        ),
      );
    }
  }, [disconnectTelegram, refetch, t]);

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
                      "LiveOn reminder bot ulangan. Birinchi kirishda til va telefon raqami so'raladi, keyin status va reminderlarni shu chatdan boshqarasiz. Agar START ko'rinmasa Menu yoki /start dan foydalaning.",
                  })
                : t("profile.notifications.telegramDisconnectedDesc", {
                    defaultValue:
                      "Reminderlarni Telegramga yuborish uchun @liveonappbot ni ulang. Bot birinchi kirishda til va telefon raqamini so'raydi. Agar START ko'rinmasa Menu yoki /start dan foydalaning.",
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
            <RefreshCwIcon data-icon="inline-start" />
            {t("profile.notifications.telegramRefresh", {
              defaultValue: "Statusni yangilash",
            })}
          </Button>
          {telegramConnected ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnectingTelegram}
            >
              <UnplugIcon data-icon="inline-start" />
              {t("profile.notifications.telegramDisconnect", {
                defaultValue: "Telegramni uzish",
              })}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationSettingsDrawer = ({
  open,
  onOpenChange,
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
    quietHours,
    updateQuietHours,
    isUpdating: isUpdatingQuietHours,
  } = useQuietHours({
    enabled: open,
  });
  const [qhEnabled, setQhEnabled] = React.useState(false);
  const [qhStart, setQhStart] = React.useState("22:00");
  const [qhEnd, setQhEnd] = React.useState("08:00");

  /*
   * Drawer form state is reset from the latest server preferences whenever
   * settings are refetched/opened.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  React.useEffect(() => {
    setQhEnabled(quietHours.enabled ?? false);
    setQhStart(quietHours.start ?? "22:00");
    setQhEnd(quietHours.end ?? "08:00");
  }, [quietHours.enabled, quietHours.end, quietHours.start]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const isDirty = !isEqual(form, initialForm);
  const isQuietHoursDirty =
    qhEnabled !== (quietHours.enabled ?? false) ||
    qhStart !== (quietHours.start ?? "22:00") ||
    qhEnd !== (quietHours.end ?? "08:00");

  const handleSave = React.useCallback(async () => {
    try {
      await Promise.all([
        isDirty ? saveNotificationSettings(form) : Promise.resolve(),
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
    form,
    isDirty,
    isQuietHoursDirty,
    onOpenChange,
    qhEnabled,
    qhEnd,
    qhStart,
    saveNotificationSettings,
    t,
    updateQuietHours,
  ]);

  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>{t("profile.notifications.settingsTitle")}</DrawerTitle>
          <DrawerDescription>
            {t("profile.notifications.settingsSubtitle")}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <TelegramConnectCard t={t} />
          <NotificationsSettingsForm form={form} setForm={setForm} t={t} />

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
              (!isDirty && !isQuietHoursDirty) ||
              isSavingNotifications ||
              isUpdatingQuietHours
            }
            onClick={handleSave}
          >
            {isSavingNotifications ||
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
  const {
    activeProfileDrawer,
    closeProfileDrawer,
    openProfileDrawer,
  } = useProfileOverlay();
  const settingsOpen = activeProfileDrawer === "settings";
  const handleSettingsOpenChange = React.useCallback(
    (nextOpen) => {
      if (nextOpen) {
        openProfileDrawer("settings", "notifications");
        return;
      }

      closeProfileDrawer();
    },
    [closeProfileDrawer, openProfileDrawer],
  );

  return (
    <>
      <div
        className={
          embedded
            ? "flex h-full min-h-0 flex-col px-5 pb-6 pt-8 sm:px-6"
            : "flex flex-col"
        }
      >
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {t("profile.notifications.feedSubtitle")}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                {t("profile.tabs.notifications")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("profile.notifications.settingsSubtitle")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => openProfileDrawer("settings", "notifications")}
            >
              <Settings2Icon className="size-4" />
              Sozlamalar
            </Button>
          </div>
        </div>
      </div>

      <NotificationSettingsDrawer
        open={settingsOpen}
        onOpenChange={handleSettingsOpenChange}
      />
    </>
  );
};
