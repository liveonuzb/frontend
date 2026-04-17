import _ from "lodash";
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePostQuery } from "@/hooks/api";
import { api } from "@/hooks/api/use-api";
import { COACH_PAYMENTS_QUERY_KEY } from "./use-coach-query-keys";

const DEFAULT_PAYMENT_STATS = {
  revenue: {
    total: 0,
    currentMonth: 0,
    lastMonth: 0,
    expectedCurrentMonth: 0,
    collectedCurrentMonth: 0,
    outstandingCurrentMonth: 0,
    collectionRate: 0,
    growth: 0,
  },
  balance: { total: 0, pending: 0, available: 0, withdrawn: 0 },
  counts: {
    completed: 0,
    cancelled: 0,
    refunded: 0,
    pending: 0,
    overdue: 0,
  },
};

export const useCoachPaymentStats = () => {
  const { data, ...query } = useGetQuery({
    url: "/coach/payments/stats",
    queryProps: {
      queryKey: [...COACH_PAYMENTS_QUERY_KEY, "stats"],
    },
  });

  return {
    ...query,
    stats: _.defaultsDeep({}, _.get(data, "data", {}), DEFAULT_PAYMENT_STATS),
  };
};

export const useCoachPayments = (params = {}) => {
  const { data, ...query } = useGetQuery({
    url: "/coach/payments",
    params,
    queryProps: {
      queryKey: [...COACH_PAYMENTS_QUERY_KEY, params],
    },
  });

  return {
    ...query,
    payments: _.get(data, "data.data.payments", []),
    meta: _.get(data, "data.data.meta", {
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    }),
  };
};

export const useCoachPaymentLedger = (params = {}) => {
  const { data, ...query } = useGetQuery({
    url: "/coach/payments/ledger",
    params,
    queryProps: {
      queryKey: [...COACH_PAYMENTS_QUERY_KEY, "ledger", params],
    },
  });

  return {
    ...query,
    ledger: _.get(data, "data.items", _.get(data, "data.data.items", [])),
    meta: _.get(data, "data.meta", _.get(data, "data.data.meta", {
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    })),
  };
};

export const useCoachPaymentActions = () => {
  const queryClient = useQueryClient();
  const syncRemindersMutation = usePostQuery({
    queryKey: COACH_PAYMENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY });
      },
    },
  });

  const syncPaymentReminders = React.useCallback(
    async () =>
      syncRemindersMutation.mutateAsync({
        url: "/coach/payments/reminders/sync",
        attributes: {},
      }),
    [syncRemindersMutation],
  );

  const uploadReceipt = React.useCallback(async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/coach/payments/receipts/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data ?? response.data;
  }, []);

  const exportPaymentsCsv = React.useCallback(async (params = {}) => {
    const response = await api.get("/coach/payments/export.csv", {
      params,
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `coach_payments_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    syncPaymentReminders,
    uploadReceipt,
    exportPaymentsCsv,
    isSyncingPaymentReminders: syncRemindersMutation.isPending,
  };
};
