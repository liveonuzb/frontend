import React from "react";
import { get, map, size } from "lodash";
import EarningsSectionCard from "./EarningsSectionCard.jsx";
import { formatMoney } from "./earnings-utils.js";

export const TopClientsPanel = ({ clients = [] }) => (
  <EarningsSectionCard
    title="Top clientlar"
    description="Eng ko'p daromad keltirgan clientlar."
  >
    {size(clients) ? (
      <div className="space-y-3">
        {map(clients, (client, index) => (
          <div
            key={get(client, "id")}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </div>
              <div>
                <div className="font-semibold">{get(client, "name")}</div>
                <div className="text-xs text-muted-foreground">
                  {get(client, "count")} ta to&apos;lov
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold">
              {formatMoney(get(client, "total"))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Hali to&apos;langan clientlar yo&apos;q
      </div>
    )}
  </EarningsSectionCard>
);

export default TopClientsPanel;
