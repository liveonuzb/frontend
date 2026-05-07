import {
  BarChart3Icon,
  BellIcon,
  BookOpenIcon,
  BotIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  DumbbellIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageIcon,
  ReceiptTextIcon,
  SendIcon,
  SettingsIcon,
  Share2Icon,
  ShieldCheckIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon,
  UtensilsIcon,
  WalletCardsIcon,
} from "lucide-react";

export const COACH_NAV_GROUPS = [
  {
    key: "crm",
    label: "CRM",
    items: [
      {
        to: "/coach/dashboard",
        label: "Boshqaruv",
        icon: LayoutDashboardIcon,
      },
      { to: "/coach/clients", label: "Mijozlar", icon: UsersIcon },
      { to: "/coach/chat", label: "Chat", icon: MessageSquareIcon },
      {
        to: "/coach/sessions",
        label: "Sessiyalar",
        icon: CalendarClockIcon,
      },
      {
        to: "/coach/notifications",
        label: "Bildirishnomalar",
        icon: BellIcon,
      },
    ],
  },
  {
    key: "plans",
    label: "Rejalar",
    items: [
      {
        to: "/coach/meal-plans",
        label: "Ovqat rejalari",
        icon: UtensilsIcon,
      },
      {
        to: "/coach/workout-plans",
        label: "Mashq rejalari",
        icon: DumbbellIcon,
      },
      {
        to: "/coach/programs",
        label: "Dasturlar",
        icon: ClipboardListIcon,
      },
      { to: "/coach/challenges", label: "Sinovlar", icon: TrophyIcon },
      { to: "/coach/snippets", label: "Shablonlar", icon: FileTextIcon },
    ],
  },
  {
    key: "commerce",
    label: "Savdo",
    items: [
      { to: "/coach/payments", label: "To'lovlar", icon: WalletCardsIcon },
      { to: "/coach/packages", label: "Paketlar", icon: PackageIcon },
      { to: "/coach/courses", label: "Kurslar", icon: BookOpenIcon },
      {
        to: "/coach/course-purchases",
        label: "Kurs xaridlari",
        icon: ReceiptTextIcon,
      },
      { to: "/coach/earnings", label: "Daromad", icon: BarChart3Icon },
      { to: "/coach/referrals", label: "Referallar", icon: Share2Icon },
    ],
  },
  {
    key: "telegram",
    label: "Telegram",
    items: [
      { to: "/coach/telegram-bot", label: "Telegram bot", icon: SendIcon },
      { to: "/coach/groups", label: "Guruhlar", icon: UsersRoundIcon },
    ],
  },
  {
    key: "analytics",
    label: "Analitika",
    items: [
      { to: "/coach/reports", label: "Hisobotlar", icon: FileTextIcon },
      { to: "/coach/ai", label: "AI yordamchi", icon: BrainCircuitIcon },
      { to: "/coach/audit-logs", label: "Audit loglar", icon: ShieldCheckIcon },
    ],
  },
  {
    key: "settings",
    label: "Sozlamalar",
    items: [
      { to: "/coach/profile", label: "Profil", icon: UserIcon },
      { to: "/coach/settings", label: "Sozlamalar", icon: SettingsIcon },
    ],
  },
];

export const COACH_MOBILE_NAV_ITEMS = [
  {
    to: "/coach/dashboard",
    label: "Boshqaruv",
    icon: LayoutDashboardIcon,
  },
  { to: "/coach/clients", label: "Mijozlar", icon: UsersIcon },
  { to: "/coach/chat", label: "Chat", icon: MessageSquareIcon },
  { to: "/coach/payments", label: "To'lovlar", icon: WalletCardsIcon },
  { to: "/coach/telegram-bot", label: "Telegram", icon: BotIcon },
];
