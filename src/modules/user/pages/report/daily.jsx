import React from "react";
import { Navigate, useParams } from "react-router";
import { getYesterdayKey } from "@/modules/user/containers/report/report-helpers.js";

const DailyReportPage = () => {
  const { date } = useParams();
  const isDateKey = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const dateKey = isDateKey ? date : getYesterdayKey();

  return <Navigate to={`/user/dashboard/report/daily/${dateKey}`} replace />;
};

export default DailyReportPage;
