import React from "react";
import { get } from "lodash";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { CalendarPlusIcon, RotateCcwIcon } from "lucide-react";
import SessionCard from "@/components/coach-sessions/session-card.jsx";
import PageTransition from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/store";
import {
  useCoachClients,
  useCoachSessions,
  useCoachSessionsMutations,
} from "@/modules/coach/lib/hooks";
import CompleteSessionDrawer from "../components/CompleteSessionDrawer.jsx";
import SessionBookingDrawer from "../components/SessionBookingDrawer.jsx";
import SessionCalendarPanel from "../components/SessionCalendarPanel.jsx";
import SessionFilters from "../components/SessionFilters.jsx";
import {
  buildSessionPayload,
  resolveListPayload,
  resolveMeta,
} from "../components/session-utils.js";
import { useSessionFilters } from "./use-filters.js";

const ListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((item) => (
      <Card key={item} className="rounded-3xl">
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const CoachSessionsListPage = () => {
  const navigate = useNavigate();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const filters = useSessionFilters();
  const mutations = useCoachSessionsMutations();
  const [bookingState, setBookingState] = React.useState({
    open: false,
    mode: "create",
    session: null,
  });
  const [completeSession, setCompleteSession] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/coach", title: "Coach" },
      { url: "/coach/sessions", title: "Sessions" },
    ]);
  }, [setBreadcrumbs]);

  const queryParams = React.useMemo(
    () => ({
      ...(filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
      ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
      sortBy: "scheduledAt",
      sortDir: "asc",
      page: filters.currentPage,
      pageSize: filters.pageSize,
    }),
    [filters],
  );

  const { data, isLoading, refetch } = useCoachSessions(queryParams);
  const { data: clientsData, isLoading: isClientsLoading } = useCoachClients(
    { status: "active", pageSize: 100 },
    { staleTime: 30000 },
  );
  const sessions = resolveListPayload(data);
  const clients = resolveListPayload(clientsData);
  const meta = resolveMeta(data);

  const openCreate = () =>
    setBookingState({ open: true, mode: "create", session: null });

  const openReschedule = (session) =>
    setBookingState({ open: true, mode: "reschedule", session });

  const closeBooking = (open) =>
    setBookingState((current) => ({ ...current, open }));

  const handleBookingSubmit = async (values) => {
    try {
      const payload = buildSessionPayload(values);
      if (bookingState.mode === "create") {
        await mutations.createSession(values.roomId, {
          title: payload.title,
          date: payload.date,
          slots: payload.slots,
          durationMinutes: payload.durationMinutes,
          note: payload.note,
          timezone: payload.timezone,
        });
        toast.success("Sessiya taklifi yuborildi");
      } else {
        await mutations.rescheduleSession(bookingState.session.id, {
          date: payload.date,
          slot: payload.slot,
          durationMinutes: payload.durationMinutes,
          note: payload.note,
          timezone: payload.timezone,
        });
        toast.success("Sessiya ko'chirildi");
      }
      closeBooking(false);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") || "Sessiya amalini bajarib bo'lmadi",
      );
    }
  };

  const handleCancel = async (session) => {
    try {
      await mutations.cancelSession(session.id, { reason: "Coach cancelled" });
      toast.success("Sessiya bekor qilindi");
    } catch (error) {
      toast.error(get(error, "response.data.message") || "Bekor qilib bo'lmadi");
    }
  };

  const handleComplete = async (payload) => {
    if (!completeSession) return;
    try {
      await mutations.completeSession(completeSession.id, payload);
      toast.success("Sessiya tugatildi");
      setCompleteSession(null);
    } catch (error) {
      toast.error(get(error, "response.data.message") || "Tugatib bo'lmadi");
    }
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <CalendarPlusIcon className="size-3.5" />
            Coach sessions
          </p>
          <h1 className="text-3xl font-black tracking-tight">Sessiyalar</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Session list, calendar, booking takliflari, ko&apos;chirish va
            tugatish oqimlari.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RotateCcwIcon className="mr-2 size-4" />
          Yangilash
        </Button>
      </div>

      <SessionFilters
        filters={filters}
        clients={clients}
        onCreate={openCreate}
      />

      {filters.view === "calendar" ? (
        <SessionCalendarPanel sessions={sessions} />
      ) : isLoading || isClientsLoading ? (
        <ListSkeleton />
      ) : sessions.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <p className="text-sm font-medium">Sessiyalar topilmadi</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Filterlarni o&apos;zgartiring yoki yangi session taklifi yuboring.
            </p>
            <Button type="button" className="mt-4" onClick={openCreate}>
              Yangi sessiya
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              role="coach"
              isBusy={mutations.isMutating}
              onOpenChat={() => navigate(`/coach/chat/${session.roomId}`)}
              onCancel={() => handleCancel(session)}
              onComplete={() => setCompleteSession(session)}
              onReschedule={() => openReschedule(session)}
            />
          ))}
        </div>
      )}

      {meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {meta.page} / {meta.totalPages} sahifa • {meta.total} ta
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={filters.currentPage <= 1}
              onClick={() => filters.setPageQuery(String(filters.currentPage - 1))}
            >
              Oldingi
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={filters.currentPage >= meta.totalPages}
              onClick={() => filters.setPageQuery(String(filters.currentPage + 1))}
            >
              Keyingi
            </Button>
          </div>
        </div>
      ) : null}

      <SessionBookingDrawer
        open={bookingState.open}
        mode={bookingState.mode}
        session={bookingState.session}
        clients={clients}
        onOpenChange={closeBooking}
        onSubmit={handleBookingSubmit}
        isSubmitting={mutations.isMutating}
      />
      <CompleteSessionDrawer
        open={Boolean(completeSession)}
        session={completeSession}
        onOpenChange={(open) => !open && setCompleteSession(null)}
        onSubmit={handleComplete}
        isSubmitting={mutations.isMutating}
      />
    </PageTransition>
  );
};

export default CoachSessionsListPage;
