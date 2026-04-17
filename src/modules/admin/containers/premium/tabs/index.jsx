import { map } from "lodash";
import React, { lazy, Suspense } from "react";
import { Route, Routes, Navigate, NavLink } from "react-router";
import { CreditCardIcon, CrownIcon, TicketIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import PlansListPage from "../plans/list/index.jsx";
import PlansCreatePage from "../plans/create/index.jsx";
import PlansEditPage from "../plans/edit/index.jsx";
import PromoCodesListPage from "../promo-codes/list/index.jsx";
import PromoCodesCreatePage from "../promo-codes/create/index.jsx";
import PromoCodesEditPage from "../promo-codes/edit/index.jsx";
import FamiliesListPage from "../families/list/index.jsx";
import FamilyDetailPage from "../families/detail/index.jsx";

const SubscriptionsListPage = lazy(() => import("../subscriptions/list/index.jsx"));

const tabs = [
  { to: "/admin/premium/plans", label: "Planlar", icon: CrownIcon },
  { to: "/admin/premium/promo-codes", label: "Promo kodlar", icon: TicketIcon },
  { to: "/admin/premium/families", label: "Oilalar", icon: UsersIcon },
  { to: "/admin/premium/subscriptions", label: "Obunalar", icon: CreditCardIcon },
];

const PremiumIndex = () => {
  return (
    <div>
      <div className="mb-6 flex items-center gap-1 border-b">
        {map(tabs, (tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            <tab.icon className="size-4" />
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<Navigate to="plans" replace />} />
        <Route path="plans" element={<PlansListPage />}>
          <Route path="create" element={<PlansCreatePage />} />
          <Route path="edit/:id" element={<PlansEditPage />} />
        </Route>
        <Route path="promo-codes" element={<PromoCodesListPage />}>
          <Route path="create" element={<PromoCodesCreatePage />} />
          <Route path="edit/:id" element={<PromoCodesEditPage />} />
        </Route>
        <Route path="families" element={<FamiliesListPage />} />
        <Route path="families/:id" element={<FamilyDetailPage />} />
        <Route
          path="subscriptions"
          element={
            <Suspense fallback={<div className="text-sm text-muted-foreground">Yuklanmoqda...</div>}>
              <SubscriptionsListPage />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
};

export default PremiumIndex;
