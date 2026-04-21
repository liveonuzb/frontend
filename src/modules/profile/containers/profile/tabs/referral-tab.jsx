import React from "react";
import { ReferralDashboard } from "@/modules/profile/components/referral";

// Thin wrapper so the settings overlay keeps its current UX while the full
// dashboard lives in the shared component (also used by `/user/referrals`).
export const ReferralTab = () => <ReferralDashboard variant="tab" />;

export default ReferralTab;
