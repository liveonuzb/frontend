import React from "react";
import get from "lodash/get";
import toNumber from "lodash/toNumber";
import { Badge } from "@/components/ui/badge";
import { adminListSkeletons } from "@/modules/admin/components/admin-list-skeletons.jsx";
import ActionsMenu from "./actions-menu.jsx";

const formatPrice = (price) => {
  if (!price && price !== 0) return "-";
  return toNumber(price).toLocaleString("uz-UZ") + " UZS";
};

export const useColumns = ({ canManage, handleToggleActive, onEdit, onDelete }) => {
  return React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nomi",
        size: 260,
        meta: { skeleton: adminListSkeletons.avatarText },
        cell: (info) => {
          const plan = get(info, "row.original");
          return (
            <div className="min-w-0">
              <p className="truncate font-medium">{get(plan, "name")}</p>
              <p className="text-xs text-muted-foreground">
                {get(plan, "slug")}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Turi",
        size: 120,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) => {
          const type = info.getValue();
          return type === "FAMILY" ? (
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-700 dark:text-purple-400"
            >
              Oilaviy
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
            >
              Individual
            </Badge>
          );
        },
      },
      {
        accessorKey: "price",
        header: "Narxi",
        size: 180,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const plan = get(info, "row.original");
          const price = get(plan, "price");
          const originalPrice = get(plan, "originalPrice");

          if (originalPrice && toNumber(originalPrice) > toNumber(price)) {
            return (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="font-medium">{formatPrice(price)}</span>
              </div>
            );
          }

          return <span className="font-medium">{formatPrice(price)}</span>;
        },
      },
      {
        accessorKey: "durationDays",
        header: "Muddat",
        size: 100,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className="text-sm">
              {value ? `${value} kun` : "Cheksiz"}
            </span>
          );
        },
      },
      {
        accessorKey: "trialDays",
        header: "Sinov",
        size: 100,
        meta: { skeleton: adminListSkeletons.text },
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className="text-sm text-muted-foreground">
              {value ? `${value} kun` : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        size: 100,
        meta: { skeleton: adminListSkeletons.badge },
        cell: (info) =>
          info.getValue() ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              Faol
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-slate-500/10 text-slate-700 dark:text-slate-300"
            >
              Nofaol
            </Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        meta: { skeleton: adminListSkeletons.action },
        cell: (info) => (
          <div className="flex justify-end">
            <ActionsMenu
              plan={info.row.original}
              canManage={canManage}
              onEdit={onEdit}
              onToggleActive={handleToggleActive}
              onDelete={onDelete}
            />
          </div>
        ),
      },
    ],
    [canManage, handleToggleActive, onEdit, onDelete],
  );
};
