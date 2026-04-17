import React from "react";
import {
  BanknoteIcon,
  BellIcon,
  BellOffIcon,
  CalendarIcon,
  CheckCheckIcon,
  CheckIcon,
  CrownIcon,
  FilterIcon,
  Loader2Icon,
  MessageSquareIcon,
  TargetIcon,
  TrophyIcon,
  UserPlusIcon,
  UtensilsIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useBreadcrumbStore } from "@/store";
import { useUserNotificationsFeed } from "@/hooks/app/use-notifications";

const CATEGORY_OPTIONS = [
  { value: "", label: "Hammasi" },
  { value: "FRIENDS", label: "Do'stlar" },
  { value: "COACH", label: "Murabbiy" },
  { value: "CHALLENGE", label: "Musobaqalar" },
  { value: "PAYMENT", label: "To'lovlar" },
  { value: "PROGRESS", label: "Progress" },
  { value: "SYSTEM", label: "Tizim" },
];

const NOTIFICATION_ICONS = {
  challenge_invitation: { icon: TrophyIcon, color: "text-amber-500" },
  friend_request_incoming: { icon: UserPlusIcon, color: "text-emerald-500" },
  friend_request_accepted: { icon: CheckIcon, color: "text-emerald-500" },
  coach_invitation: { icon: UserPlusIcon, color: "text-blue-500" },
  weekly_check_in: { icon: CalendarIcon, color: "text-violet-500" },
  coach_feedback: { icon: MessageSquareIcon, color: "text-violet-500" },
  coach_task: { icon: TargetIcon, color: "text-cyan-500" },
  coach_plan_update: { icon: UtensilsIcon, color: "text-orange-500" },
  coach_connected: { icon: MessageSquareIcon, color: "text-emerald-500" },
  coach_payment_due: { icon: BanknoteIcon, color: "text-amber-500" },
  premium_expiring: { icon: CrownIcon, color: "text-amber-500" },
  premium_upsell: { icon: CrownIcon, color: "text-primary" },
};

const getNotificationIcon = (type) =>
  NOTIFICATION_ICONS[type] || { icon: BellIcon, color: "text-muted-foreground" };

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return date.toLocaleDateString("uz-UZ");

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Hozir";
  if (mins < 60) return `${mins} daqiqa oldin`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;

  return date.toLocaleDateString("uz-UZ");
};

const NotificationItem = ({ notification, onMarkRead }) => {
  const { icon: Icon, color } = getNotificationIcon(notification.type);
  const isRead = Boolean(notification.readAt);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-b last:border-b-0 transition-colors cursor-pointer hover:bg-muted/50",
        !isRead && "bg-primary/5",
      )}
      onClick={() => {
        if (!isRead) onMarkRead(notification.id);
      }}
    >
      <div
        className={cn(
          "flex-shrink-0 mt-0.5 h-9 w-9 rounded-full flex items-center justify-center",
          isRead ? "bg-muted" : "bg-primary/10",
        )}
      >
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            !isRead && "font-medium",
          )}
        >
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!isRead && (
        <div className="flex-shrink-0 mt-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
};

const NotificationSkeleton = () => (
  <div className="flex items-start gap-3 p-4 border-b">
    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const EmptyState = ({ filter }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <BellOffIcon className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground">
      {filter === "unread"
        ? "O'qilmagan bildirishnomalar yo'q"
        : "Bildirishnomalar yo'q"}
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      {filter === "unread"
        ? "Barcha bildirishnomalar o'qilgan"
        : "Yangi bildirishnomalar bu yerda paydo bo'ladi"}
    </p>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("all");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setBreadcrumbs);

  React.useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", href: "/user/dashboard" },
      { label: "Bildirishnomalar" },
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const filter = activeTab === "unread" ? "unread" : undefined;

  const {
    items,
    isLoading,
    hasMore,
    unreadCount,
    loadMore,
    markNotificationRead,
    markAllNotificationsRead,
    isUpdatingNotificationState,
  } = useUserNotificationsFeed({
    category: selectedCategory || undefined,
    filter,
  });

  const filteredItems = items;

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Bildirishnomalar</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount} ta o'qilmagan
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsRead}
              disabled={isUpdatingNotificationState}
            >
              {isUpdatingNotificationState ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <CheckCheckIcon className="h-4 w-4 mr-1.5" />
              )}
              Barchasini o'qilgan deb belgilash
            </Button>
          )}
        </div>

        {/* Tabs: All / Unread */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-3">
            <TabsList>
              <TabsTrigger value="all">Hammasi</TabsTrigger>
              <TabsTrigger value="unread">
                O'qilmagan
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-5 min-w-5 px-1 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {CATEGORY_OPTIONS.map((cat) => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          <TabsContent value="all" className="mt-3">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                  ))
                ) : filteredItems.length === 0 ? (
                  <EmptyState filter="all" />
                ) : (
                  <>
                    {filteredItems.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onMarkRead={markNotificationRead}
                      />
                    ))}
                    {hasMore && (
                      <div className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadMore}
                        >
                          Ko'proq yuklash
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unread" className="mt-3">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                  ))
                ) : filteredItems.length === 0 ? (
                  <EmptyState filter="unread" />
                ) : (
                  <>
                    {filteredItems.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onMarkRead={markNotificationRead}
                      />
                    ))}
                    {hasMore && (
                      <div className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadMore}
                        >
                          Ko'proq yuklash
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default Index;
