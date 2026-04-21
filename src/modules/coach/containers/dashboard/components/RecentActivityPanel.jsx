import React from "react";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { slice } from "lodash";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clientBadge,
  EmptyState,
  formatMoney,
  getInitials,
  ListRow,
  ListSkeleton,
  SectionCard,
} from "./dashboard-ui.jsx";

export const RecentActivityPanel = ({
  recentClients = [],
  overdueClients = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <SectionCard
        title="Mijozlar"
        description="Eng faol mijozlaringiz"
        action={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-xl text-xs"
            onClick={() => navigate("/coach/clients")}
          >
            Barchasi <ArrowRightIcon className="ml-1.5 size-3.5" />
          </Button>
        }
      >
        {isLoading ? (
          <ListSkeleton />
        ) : recentClients.length === 0 ? (
          <EmptyState text="Hozircha mijozlar yo'q" />
        ) : (
          slice(recentClients, 0, 5).map((client, index) => {
            const badge = clientBadge(client.status);

            return (
              <React.Fragment key={client.id}>
                {index > 0 ? <div className="mx-4 border-t" /> : null}
                <ListRow onClick={() => navigate(`/coach/clients/${client.id}`)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black transition-colors group-hover:text-primary">
                        {client.name}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {client.goal || "Maqsad belgilanmagan"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-bold">
                        {client.progress ?? 0}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Progress
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs", badge.cls)}>
                      {badge.label}
                    </Badge>
                  </div>
                </ListRow>
              </React.Fragment>
            );
          })
        )}
      </SectionCard>

      <SectionCard
        title="Kechikkan to'lovlar"
        badge={overdueClients.length > 0 ? overdueClients.length : null}
        className="border-destructive/20"
      >
        {isLoading ? (
          <ListSkeleton />
        ) : overdueClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2Icon className="size-5" />
            </div>
            <p className="text-sm font-medium">
              Barcha to&apos;lovlar o&apos;z vaqtida
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hozircha hech qanday kechikish yo&apos;q
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y">
            {overdueClients.map((client) => (
              <ListRow
                key={client.id}
                onClick={() => navigate(`/coach/clients/${client.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9 rounded-full">
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback className="bg-muted text-[10px]">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{client.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-destructive">
                        {formatMoney(client.agreedAmount)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        • muhlati o&apos;tgan
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="destructive"
                  className="flex h-5 items-center gap-1 px-1.5 text-[10px]"
                >
                  <AlertCircleIcon className="size-3" />
                  Kechikkan
                </Badge>
              </ListRow>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
};

export default RecentActivityPanel;
