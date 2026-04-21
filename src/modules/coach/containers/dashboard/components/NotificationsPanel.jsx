import React from "react";
import {
  CheckCircle2Icon,
  ClockIcon,
  MegaphoneIcon,
  XIcon,
} from "lucide-react";
import { slice } from "lodash";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, ListRow, SectionCard } from "./dashboard-ui.jsx";

const alertSeverityLabel = (severity) => {
  if (severity === "high") return "Yuqori";
  if (severity === "medium") return "O'rta";
  return "Past";
};

export const NotificationsPanel = ({
  alerts = [],
  pendingInvitations = [],
  isLoading = false,
  respondToInvitation,
}) => {
  const navigate = useNavigate();
  const [invitationActionState, setInvitationActionState] = React.useState({});

  const setInvitationPending = React.useCallback((id, pending) => {
    setInvitationActionState((state) =>
      pending
        ? { ...state, [id]: true }
        : Object.fromEntries(Object.entries(state).filter(([key]) => key !== id)),
    );
  }, []);

  const isInvitationPending = React.useCallback(
    (id) => Boolean(invitationActionState[id]),
    [invitationActionState],
  );

  const handleInvitationResponse = React.useCallback(
    async (invitationId, action) => {
      setInvitationPending(invitationId, true);
      try {
        await respondToInvitation(invitationId, action);
        toast.success(
          action === "accept" ? "Mijoz biriktirildi" : "So'rov rad etildi",
        );
      } catch {
        toast.error("Xatolik");
      } finally {
        setInvitationPending(invitationId, false);
      }
    },
    [respondToInvitation, setInvitationPending],
  );

  return (
    <>
      {alerts.length > 0 && !isLoading ? (
        <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <MegaphoneIcon className="size-4 text-destructive" />
            <p className="text-sm font-bold text-destructive">
              Muhim xabarnomalar
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {slice(alerts, 0, 4).map((alert) => (
              <div
                key={alert.id}
                className="flex cursor-pointer items-center justify-between rounded-2xl bg-background/60 px-4 py-3 transition-colors hover:bg-background/80"
                onClick={() => {
                  if (alert.clientId) {
                    navigate(`/coach/clients?clientId=${alert.clientId}`);
                  }
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{alert.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-3 shrink-0 text-[10px]",
                    alert.severity === "high" &&
                      "bg-destructive/10 text-destructive",
                    alert.severity === "medium" &&
                      "bg-amber-500/10 text-amber-600",
                  )}
                >
                  {alertSeverityLabel(alert.severity)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {pendingInvitations.length > 0 ? (
        <SectionCard
          title="Yangi mijozlar so'rovi"
          description="Qabul qilishni kutayotgan mijozlar"
          badge={pendingInvitations.length}
        >
          {slice(pendingInvitations, 0, 3).map((invitation, index) => (
            <React.Fragment key={invitation.id}>
              {index > 0 ? <div className="mx-4 border-t" /> : null}
              <ListRow>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(invitation.client?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">
                      {invitation.client?.name}
                    </p>
                    <p className="mt-0.5 flex truncate text-[10px] font-medium text-muted-foreground">
                      <ClockIcon className="mr-1 size-3" />
                      {invitation.client?.email ||
                        invitation.client?.phone ||
                        "Kontakt ma'lumotlari yo'q"}
                    </p>
                  </div>
                </div>
                {!invitation.initiatedByCoach ? (
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                      disabled={isInvitationPending(invitation.id)}
                      onClick={() =>
                        handleInvitationResponse(invitation.id, "decline")
                      }
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 rounded-xl"
                      disabled={isInvitationPending(invitation.id)}
                      onClick={() =>
                        handleInvitationResponse(invitation.id, "accept")
                      }
                    >
                      <CheckCircle2Icon className="mr-1.5 size-3.5" />
                      Qabul
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="ml-3 shrink-0 text-xs">
                    Kutilmoqda
                  </Badge>
                )}
              </ListRow>
            </React.Fragment>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
};

export default NotificationsPanel;
