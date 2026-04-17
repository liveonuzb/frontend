import React from "react";
import { useNavigate } from "react-router";
import { get } from "lodash";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCoachInvitations } from "@/hooks/app/use-coach-invitations";
import { useUserCoachSessions } from "@/hooks/app/use-user-coach-sessions";
import { CalendarIcon, MessageCircleIcon } from "lucide-react";
import { api } from "@/hooks/api/use-api";

const formatSessionDate = (date, slot) => {
  if (!date) return "—";
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
  return slot ? `${dateStr}, ${slot}` : dateStr;
};

const SESSION_STATUS_LABELS = {
  proposed: "Taklif etilgan",
  scheduled: "Rejalashtirilgan",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan",
};

const UpcomingSessionsSection = () => {
  const { upcomingSessions, isLoading } = useUserCoachSessions();
  if (isLoading || upcomingSessions.length === 0) return null;
  return (
    <div className="rounded-3xl border px-5 py-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Kelgusi sessiyalar</h3>
        </div>
        <div className="space-y-2">
          {upcomingSessions.slice(0, 3).map((session) => (
            <div key={session.id} className="rounded-2xl border px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {formatSessionDate(session.sessionDate, session.selectedSlot)}
                </p>
                <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {SESSION_STATUS_LABELS[session.status] ?? session.status}
                </span>
              </div>
              {session.notes ? (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{session.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const formatConnectedDate = (value) => {
  if (!value) {
    return "Hozircha ko'rsatilmagan";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Hozircha ko'rsatilmagan";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatConnectionStatus = (value) => {
  switch (String(value || "").toLowerCase()) {
    case "active":
      return "Faol ulanish";
    case "paused":
      return "Vaqtincha to'xtatilgan";
    case "completed":
      return "Yakunlangan";
    default:
      return "Faol murabbiy";
  }
};

const CoachConnectionDetailsDrawer = ({
  open,
  onOpenChange,
  coachConnection,
  onDisconnected,
}) => {
  const navigate = useNavigate();
  const [isDisconnectOpen, setIsDisconnectOpen] = React.useState(false);
  const { disconnectCoach, isDisconnecting } = useCoachInvitations();
  const coach = get(coachConnection, "coach", coachConnection);

  if (!coach?.id) {
    return null;
  }

  const initials = String(coach.name || "C")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDisconnect = async () => {
    try {
      await disconnectCoach();
      setIsDisconnectOpen(false);
      onOpenChange(false);
      onDisconnected?.();
      toast.success("Murabbiy bilan bog'lanish uzildi");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Bog'lanishni uzib bo'lmadi",
      );
    }
  };

  const [isOpeningChat, setIsOpeningChat] = React.useState(false);
  const handleOpenChat = async () => {
    setIsOpeningChat(true);
    try {
      const response = await api.post("/chat/rooms", { userId: coach.id });
      onOpenChange(false);
      navigate(`/user/chat/${response?.data?.roomId ?? ""}`);
    } catch (error) {
      toast.error("Chatni ochib bo'lmadi");
    } finally {
      setIsOpeningChat(false);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle>Murabbiy tafsilotlari</DrawerTitle>
          <DrawerDescription>
            Siz bilan ishlayotgan murabbiy haqida asosiy ma&apos;lumotlar.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-2">
          <div className="rounded-3xl border px-5 py-6">
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border">
                <AvatarImage src={coach.avatar} alt={coach.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-2">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                  {formatConnectionStatus(
                    get(coachConnection, "status", coach.status),
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{coach.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Bog&apos;langan sana:{" "}
                    {formatConnectedDate(
                      get(coachConnection, "connectedAt", coach.connectedAt),
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border px-5 py-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border px-4 py-3">
                <div className="text-xs text-muted-foreground">Holat</div>
                <div className="mt-1 text-sm font-medium">
                  {formatConnectionStatus(
                    get(coachConnection, "status", coach.status),
                  )}
                </div>
              </div>
              <div className="rounded-2xl border px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  Yo&apos;nalishlar soni
                </div>
                <div className="mt-1 text-sm font-medium">
                  {Array.isArray(coach.specializations)
                    ? coach.specializations.length
                    : 0}
                </div>
              </div>
            </div>
          </div>

          {Array.isArray(coach.specializations) && coach.specializations.length > 0 ? (
            <div className="rounded-3xl border px-5 py-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">Yo&apos;nalishlari</h3>
                  <p className="text-sm text-muted-foreground">
                    Murabbiy ko&apos;proq shu yo&apos;nalishlar bo&apos;yicha ishlaydi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coach.specializations.map((item) => (
                    <div
                      key={item}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <UpcomingSessionsSection />

          <div className="rounded-3xl border px-5 py-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Bog&apos;lanish ma&apos;lumotlari</h3>
              <div className="grid gap-3">
                <div className="rounded-2xl border px-4 py-3">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="mt-1 text-sm font-medium">
                    {coach.email || "Kiritilmagan"}
                  </div>
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  <div className="text-xs text-muted-foreground">Telefon</div>
                  <div className="mt-1 text-sm font-medium">
                    {coach.phone || "Kiritilmagan"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border px-5 py-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Murabbiy bilan ishlash</h3>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="rounded-2xl border px-4 py-3">
                  Murabbiy sizga meal plan va kundalik tavsiyalar yuborishi mumkin.
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  O&apos;lchamlar va progress bo&apos;yicha kuzatuv olib boriladi.
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  Siz esa tavsiyalarni kuzatib borib natijani tezlashtirasiz.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DrawerFooter className="border-t bg-background">
          <Button
            className="h-12 w-full gap-2 rounded-2xl font-black shadow-lg shadow-primary/20"
            onClick={handleOpenChat}
            disabled={isOpeningChat}
          >
            <MessageCircleIcon className="size-5" />
            {isOpeningChat ? "Ochilmoqda..." : "Chatni ochish"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 rounded-2xl"
            onClick={() => setIsDisconnectOpen(true)}
          >
            Bog&apos;lanishni uzish
          </Button>
        </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={isDisconnectOpen} onOpenChange={setIsDisconnectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bog&apos;lanishni uzasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Murabbiy va shogirt bir-biringiz ro&apos;yxatidan chiqasiz. Murabbiyga
              bog&apos;langan rejalar sizda oddiy reja sifatida saqlanadi, lekin endi
              sync bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDisconnect();
              }}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Uzilmoqda..." : "Bog'lanishni uzish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CoachConnectionDetailsDrawer;
