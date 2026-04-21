import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "all", label: "Barchasi" },
  { value: "proposed", label: "Taklif" },
  { value: "scheduled", label: "Rejalangan" },
  { value: "completed", label: "Tugallangan" },
  { value: "cancelled", label: "Bekor" },
];

export const SessionFilters = ({
  filters,
  clients = [],
  onCreate,
}) => (
  <div className="flex flex-col gap-3 rounded-3xl border bg-card/60 p-4 backdrop-blur-sm xl:flex-row xl:items-center xl:justify-between">
    <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <select
        aria-label="Session status"
        className="h-10 rounded-xl border bg-background px-3 text-sm"
        value={filters.status}
        onChange={(event) => filters.setStatus(event.target.value)}
      >
        {STATUS_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Client"
        className="h-10 rounded-xl border bg-background px-3 text-sm"
        value={filters.clientId}
        onChange={(event) => filters.setClientId(event.target.value)}
      >
        <option value="">Barcha mijozlar</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <Input
        aria-label="Date from"
        type="date"
        value={filters.dateFrom}
        onChange={(event) => filters.setDateFrom(event.target.value)}
      />
      <Input
        aria-label="Date to"
        type="date"
        value={filters.dateTo}
        onChange={(event) => filters.setDateTo(event.target.value)}
      />
    </div>

    <div className="flex shrink-0 flex-wrap gap-2">
      <Button
        type="button"
        variant={filters.view === "list" ? "default" : "outline"}
        onClick={() => filters.setView("list")}
      >
        List
      </Button>
      <Button
        type="button"
        variant={filters.view === "calendar" ? "default" : "outline"}
        onClick={() => filters.setView("calendar")}
      >
        Calendar
      </Button>
      <Button type="button" onClick={onCreate}>
        Yangi sessiya
      </Button>
    </div>
  </div>
);

export default SessionFilters;
