import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import {
  COACH_CLIENTS_QUERY_KEY,
  COACH_CLIENT_DETAIL_QUERY_KEY,
  COACH_CLIENT_NOTES_QUERY_KEY,
  COACH_CLIENT_REMINDERS_QUERY_KEY,
  COACH_CLIENT_SEGMENTS_QUERY_KEY,
  COACH_CLIENT_SUMMARY_QUERY_KEY,
  COACH_DASHBOARD_QUERY_KEY,
  COACH_PACKAGES_QUERY_KEY,
  COACH_PAYMENTS_QUERY_KEY,
} from "./use-coach-query-keys";

const DEFAULT_COACH_CLIENT_DETAIL = {
  client: null,
  overview: null,
  measurements: [],
  dailyLogs: [],
  assignedTemplates: [],
  weeklyCheckIns: [],
  feedback: [],
  tasks: [],
  payments: [],
};

const createCoachPaymentIdempotencyKey = () => {
  const cryptoApi = typeof window !== "undefined" ? window.crypto : null;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `coach-payment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const resolveCoachClientDetailPayload = (response) => ({
  ...DEFAULT_COACH_CLIENT_DETAIL,
  ...(getApiResponseData(response, DEFAULT_COACH_CLIENT_DETAIL) ?? {}),
});

export const resolveCoachClientSummaryPayload = (response) =>
  getApiResponseData(response, null);

export const resolveCoachPackagesPayload = (response) =>
  get(
    getApiResponseData(response, response),
    "items",
    get(response, "data.items", []),
  );

export const useCoachClients = (params = {}) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/clients",
    params,
    queryProps: {
      queryKey: [...COACH_CLIENTS_QUERY_KEY, params],
    },
  });

  const inviteMutation = usePostQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
        ]);
      },
    },
  });

  const removeMutation = useDeleteQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
          queryClient.invalidateQueries({ queryKey: ["meal-plans", "me"] }),
          queryClient.invalidateQueries({
            queryKey: ["user", "weekly-check-ins"],
          }),
        ]);
      },
    },
  });

  const cancelInvitationMutation = useDeleteQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
        ]);
      },
    },
  });
  const markPaymentMutation = usePostQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });
  const updatePricingMutation = usePatchQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });
  const assignPackageMutation = usePostQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_PACKAGES_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });
  const cancelPaymentMutation = usePostQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });

  const updatePaymentMutation = usePatchQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });

  const refundPaymentMutation = usePostQuery({
    queryKey: COACH_CLIENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });

  const inviteClient = React.useCallback(
    async (payload) =>
      inviteMutation.mutateAsync({
        url: "/coach/clients/invite",
        attributes: payload,
      }),
    [inviteMutation],
  );

  const removeClient = React.useCallback(
    async (clientId) =>
      removeMutation.mutateAsync({
        url: `/coach/clients/${clientId}`,
      }),
    [removeMutation],
  );

  const cancelInvitation = React.useCallback(
    async (invitationId) =>
      cancelInvitationMutation.mutateAsync({
        url: `/coach/clients/invitations/${invitationId}`,
      }),
    [cancelInvitationMutation],
  );

  const markClientPayment = React.useCallback(
    async (clientId, payload) =>
      markPaymentMutation.mutateAsync({
        url: `/coach/clients/${clientId}/payments/mark-paid`,
        attributes: {
          ...payload,
          idempotencyKey:
            payload?.idempotencyKey || createCoachPaymentIdempotencyKey(),
        },
      }),
    [markPaymentMutation],
  );

  const updateClientPricing = React.useCallback(
    async (clientId, payload) =>
      updatePricingMutation.mutateAsync({
        url: `/coach/clients/${clientId}/pricing`,
        attributes: payload,
      }),
    [updatePricingMutation],
  );

  const assignClientPackage = React.useCallback(
    async (clientId, payload) =>
      assignPackageMutation.mutateAsync({
        url: `/coach/clients/${clientId}/package-contract`,
        attributes: payload,
      }),
    [assignPackageMutation],
  );

  const updateClientPayment = React.useCallback(
    async (clientId, paymentId, payload) =>
      updatePaymentMutation.mutateAsync({
        url: `/coach/clients/${clientId}/payments/${paymentId}`,
        attributes: payload,
      }),
    [updatePaymentMutation],
  );

  const cancelClientPayment = React.useCallback(
    async (clientId, paymentId, payload) =>
      cancelPaymentMutation.mutateAsync({
        url: `/coach/clients/${clientId}/payments/${paymentId}/cancel`,
        attributes: payload,
      }),
    [cancelPaymentMutation],
  );

  const refundClientPayment = React.useCallback(
    async (clientId, paymentId, payload) =>
      refundPaymentMutation.mutateAsync({
        url: `/coach/clients/${clientId}/payments/${paymentId}/refund`,
        attributes: payload,
      }),
    [refundPaymentMutation],
  );

  return {
    ...query,
    clients: get(data, "data.data", []),
    pendingInvitations: get(data, "data.meta.pendingInvitations", []),
    inviteClient,
    removeClient,
    cancelInvitation,
    markClientPayment,
    updateClientPricing,
    assignClientPackage,
    updateClientPayment,
    cancelClientPayment,
    refundClientPayment,
    isInviting: inviteMutation.isPending,
    isRemovingClient: removeMutation.isPending,
    isCancellingInvitation: cancelInvitationMutation.isPending,
    isMarkingClientPayment: markPaymentMutation.isPending,
    isUpdatingClientPricing: updatePricingMutation.isPending,
    isAssigningClientPackage: assignPackageMutation.isPending,
    isUpdatingClientPayment: updatePaymentMutation.isPending,
    isCancellingClientPayment: cancelPaymentMutation.isPending,
    isRefundingClientPayment: refundPaymentMutation.isPending,
  };
};

export const useCoachPackages = (params = {}) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/packages",
    params,
    queryProps: {
      queryKey: [...COACH_PACKAGES_QUERY_KEY, params],
    },
  });

  const invalidatePackageScope = React.useCallback(
    async () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: COACH_PACKAGES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_DETAIL_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_SUMMARY_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: COACH_DASHBOARD_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACH_PAYMENTS_QUERY_KEY }),
      ]),
    [queryClient],
  );

  const createMutation = usePostQuery({
    queryKey: COACH_PACKAGES_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidatePackageScope,
    },
  });
  const updateMutation = usePatchQuery({
    queryKey: COACH_PACKAGES_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidatePackageScope,
    },
  });
  const deleteMutation = useDeleteQuery({
    queryKey: COACH_PACKAGES_QUERY_KEY,
    mutationProps: {
      onSuccess: invalidatePackageScope,
    },
  });

  const createPackage = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/coach/packages",
        attributes: payload,
      }),
    [createMutation],
  );
  const updatePackage = React.useCallback(
    async (packageId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/packages/${packageId}`,
        attributes: payload,
      }),
    [updateMutation],
  );
  const deletePackage = React.useCallback(
    async (packageId) =>
      deleteMutation.mutateAsync({
        url: `/coach/packages/${packageId}`,
      }),
    [deleteMutation],
  );

  return {
    ...query,
    packages: resolveCoachPackagesPayload(data),
    createPackage,
    updatePackage,
    deletePackage,
    isCreatingPackage: createMutation.isPending,
    isUpdatingPackage: updateMutation.isPending,
    isDeletingPackage: deleteMutation.isPending,
  };
};

export const useCoachClientSummary = (clientId, enabled = true) => {
  const { data, ...query } = useGetQuery({
    url: `/coach/clients/${clientId}/summary`,
    queryProps: {
      queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
      enabled: enabled && Boolean(clientId),
    },
  });

  return {
    ...query,
    summary: resolveCoachClientSummaryPayload(data),
  };
};

export const useCoachClientSegments = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/coach/clients/segments",
    queryProps: {
      queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
    },
  });
  const createMutation = usePostQuery({
    queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
        });
      },
    },
  });
  const updateMutation = usePatchQuery({
    queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        ]);
      },
    },
  });
  const deleteMutation = useDeleteQuery({
    queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
        ]);
      },
    },
  });
  const reminderMutation = usePostQuery({
    queryKey: COACH_CLIENT_SEGMENTS_QUERY_KEY,
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_CLIENT_REMINDERS_QUERY_KEY,
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
        ]);
      },
    },
  });
  const broadcastMutation = usePostQuery({ queryKey: [] });

  const createSegment = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/coach/clients/segments",
        attributes: payload,
      }),
    [createMutation],
  );
  const updateSegment = React.useCallback(
    async (segmentId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/clients/segments/${segmentId}`,
        attributes: payload,
      }),
    [updateMutation],
  );
  const deleteSegment = React.useCallback(
    async (segmentId) =>
      deleteMutation.mutateAsync({
        url: `/coach/clients/segments/${segmentId}`,
      }),
    [deleteMutation],
  );
  const createSegmentReminder = React.useCallback(
    async (segmentId, payload) =>
      reminderMutation.mutateAsync({
        url: `/coach/clients/segments/${segmentId}/reminders`,
        attributes: payload,
      }),
    [reminderMutation],
  );
  const broadcastSegment = React.useCallback(
    async (segmentId, message) =>
      broadcastMutation.mutateAsync({
        url: "/coach/telegram/send-message",
        attributes: {
          message,
          broadcast: {
            clientSegmentId: segmentId,
          },
        },
      }),
    [broadcastMutation],
  );
  const downloadSegmentClientsCsv = React.useCallback((segmentId) => {
    const base = import.meta.env.VITE_API_BASE_URL ?? "";
    const params = new URLSearchParams({
      type: "clients_csv",
      segmentId,
    });
    window.open(`${base}/coach/reports?${params.toString()}`, "_blank");
  }, []);

  return {
    ...query,
    segments: get(data, "data.data.items", get(data, "data.items", [])),
    createSegment,
    updateSegment,
    deleteSegment,
    createSegmentReminder,
    broadcastSegment,
    downloadSegmentClientsCsv,
    isCreatingSegment: createMutation.isPending,
    isUpdatingSegment: updateMutation.isPending,
    isDeletingSegment: deleteMutation.isPending,
    isCreatingSegmentReminder: reminderMutation.isPending,
    isBroadcastingSegment: broadcastMutation.isPending,
  };
};

export const useCoachClientReminders = (clientId, enabled = true) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: `/coach/clients/${clientId}/reminders`,
    queryProps: {
      queryKey: [...COACH_CLIENT_REMINDERS_QUERY_KEY, clientId],
      enabled: enabled && Boolean(clientId),
    },
  });

  const invalidateReminderScope = React.useCallback(
    async () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...COACH_CLIENT_REMINDERS_QUERY_KEY, clientId],
        }),
        queryClient.invalidateQueries({
          queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
        }),
        queryClient.invalidateQueries({
          queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
        }),
        queryClient.invalidateQueries({
          queryKey: COACH_DASHBOARD_QUERY_KEY,
        }),
      ]),
    [clientId, queryClient],
  );

  const createMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_REMINDERS_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: invalidateReminderScope,
    },
  });

  const updateMutation = usePatchQuery({
    queryKey: [...COACH_CLIENT_REMINDERS_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: invalidateReminderScope,
    },
  });

  const deleteMutation = useDeleteQuery({
    queryKey: [...COACH_CLIENT_REMINDERS_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: invalidateReminderScope,
    },
  });

  const createReminder = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: `/coach/clients/${clientId}/reminders`,
        attributes: payload,
      }),
    [clientId, createMutation],
  );

  const updateReminder = React.useCallback(
    async (reminderId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/clients/${clientId}/reminders/${reminderId}`,
        attributes: payload,
      }),
    [clientId, updateMutation],
  );

  const deleteReminder = React.useCallback(
    async (reminderId) =>
      deleteMutation.mutateAsync({
        url: `/coach/clients/${clientId}/reminders/${reminderId}`,
      }),
    [clientId, deleteMutation],
  );

  return {
    ...query,
    reminders: get(data, "data.data.items", get(data, "data.items", [])),
    createReminder,
    updateReminder,
    deleteReminder,
    isCreatingReminder: createMutation.isPending,
    isUpdatingReminder: updateMutation.isPending,
    isDeletingReminder: deleteMutation.isPending,
  };
};

export const useCoachClientNotes = (clientId, enabled = true) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: `/coach/clients/${clientId}/notes`,
    queryProps: {
      queryKey: [...COACH_CLIENT_NOTES_QUERY_KEY, clientId],
      enabled: enabled && Boolean(clientId),
    },
  });

  const invalidateNotesScope = React.useCallback(
    async () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...COACH_CLIENT_NOTES_QUERY_KEY, clientId],
        }),
        queryClient.invalidateQueries({
          queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
        }),
        queryClient.invalidateQueries({
          queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
        }),
      ]),
    [clientId, queryClient],
  );

  const createMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_NOTES_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: invalidateNotesScope,
    },
  });

  const updateMutation = usePatchQuery({
    queryKey: [...COACH_CLIENT_NOTES_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: invalidateNotesScope,
    },
  });

  const deleteMutation = useDeleteQuery({
    queryKey: [...COACH_CLIENT_NOTES_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: invalidateNotesScope,
    },
  });

  const createNote = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: `/coach/clients/${clientId}/notes`,
        attributes: payload,
      }),
    [clientId, createMutation],
  );

  const updateNote = React.useCallback(
    async (noteId, payload) =>
      updateMutation.mutateAsync({
        url: `/coach/clients/${clientId}/notes/${noteId}`,
        attributes: payload,
      }),
    [clientId, updateMutation],
  );

  const deleteNote = React.useCallback(
    async (noteId) =>
      deleteMutation.mutateAsync({
        url: `/coach/clients/${clientId}/notes/${noteId}`,
      }),
    [clientId, deleteMutation],
  );

  return {
    ...query,
    notes: get(data, "data.data.items", get(data, "data.items", [])),
    createNote,
    updateNote,
    deleteNote,
    isCreatingNote: createMutation.isPending,
    isUpdatingNote: updateMutation.isPending,
    isDeletingNote: deleteMutation.isPending,
  };
};

export function useExportClientReport(clientId) {
  const downloadReport = (period = "weekly") => {
    const base = import.meta.env.VITE_API_BASE_URL ?? "";
    window.open(
      `${base}/coach/clients/${clientId}/report/pdf?period=${period}`,
      "_blank",
    );
  };
  return { downloadReport };
}

export function useExportClientsCsv() {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  const download = () =>
    window.open(`${base}/coach/reports/clients.csv`, "_blank");
  return { download };
}

export const useCoachClientDetail = (clientId, enabled = true) => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: `/coach/clients/${clientId}`,
    queryProps: {
      queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
      enabled: enabled && Boolean(clientId),
    },
  });

  const createWeeklyCheckInMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: ["user", "weekly-check-ins"],
          }),
        ]);
      },
    },
  });

  const markPaymentMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });
  const updatePricingMutation = usePatchQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });
  const updateLifecycleMutation = usePatchQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
        ]);
      },
    },
  });
  const cancelPaymentMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
        ]);
      },
    },
  });

  const createFeedbackMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onMutate: async ({ attributes }) => {
        const detailKey = [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId];
        await queryClient.cancelQueries({ queryKey: detailKey });
        const snapshot = queryClient.getQueryData(detailKey);

        queryClient.setQueryData(detailKey, (old) => {
          if (!old) return old;
          const currentPayload = resolveCoachClientDetailPayload(old);
          const optimistic = {
            id: `optimistic-${Date.now()}`,
            type: get(attributes, "type", "GENERAL"),
            title: get(attributes, "title", ""),
            message: get(attributes, "message", ""),
            createdAt: new Date().toISOString(),
            _optimistic: true,
          };

          return {
            ...old,
            data: {
              ...get(old, "data", {}),
              data: {
                ...currentPayload,
                feedback: [optimistic, ...get(currentPayload, "feedback", [])],
              },
            },
          };
        });

        return { snapshot };
      },
      onError: (_err, _variables, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(
            [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
            context.snapshot,
          );
        }
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me", "coach-feedback"] }),
        ]);
      },
    },
  });

  const createTaskMutation = usePostQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me", "coach-tasks"] }),
        ]);
      },
    },
  });

  const removeClientMutation = useDeleteQuery({
    queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
    mutationProps: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_DETAIL_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({
            queryKey: [...COACH_CLIENT_SUMMARY_QUERY_KEY, clientId],
          }),
          queryClient.invalidateQueries({ queryKey: COACH_CLIENTS_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: COACH_DASHBOARD_QUERY_KEY,
          }),
          queryClient.invalidateQueries({ queryKey: ["me"] }),
          queryClient.invalidateQueries({ queryKey: ["meal-plans", "me"] }),
          queryClient.invalidateQueries({
            queryKey: ["user", "weekly-check-ins"],
          }),
        ]);
      },
    },
  });

  const createWeeklyCheckIn = React.useCallback(
    async (payload) =>
      createWeeklyCheckInMutation.mutateAsync({
        url: `/coach/clients/${clientId}/check-ins`,
        attributes: payload,
      }),
    [clientId, createWeeklyCheckInMutation],
  );

  const removeClient = React.useCallback(
    async () =>
      removeClientMutation.mutateAsync({
        url: `/coach/clients/${clientId}`,
      }),
    [clientId, removeClientMutation],
  );

  const markPayment = React.useCallback(
    async (payload) =>
      markPaymentMutation.mutateAsync({
        url: `/coach/clients/${clientId}/payments/mark-paid`,
        attributes: payload,
      }),
    [clientId, markPaymentMutation],
  );

  const updateClientPricing = React.useCallback(
    async (payload) =>
      updatePricingMutation.mutateAsync({
        url: `/coach/clients/${clientId}/pricing`,
        attributes: payload,
      }),
    [clientId, updatePricingMutation],
  );

  const updateClientLifecycle = React.useCallback(
    async (lifecycleStage) =>
      updateLifecycleMutation.mutateAsync({
        url: `/coach/clients/${clientId}/lifecycle`,
        attributes: { lifecycleStage },
      }),
    [clientId, updateLifecycleMutation],
  );

  const cancelPayment = React.useCallback(
    async (paymentId, payload) =>
      cancelPaymentMutation.mutateAsync({
        url: `/coach/clients/${clientId}/payments/${paymentId}/cancel`,
        attributes: payload ?? {},
      }),
    [cancelPaymentMutation, clientId],
  );

  const createFeedback = React.useCallback(
    async (payload) =>
      createFeedbackMutation.mutateAsync({
        url: `/coach/clients/${clientId}/feedback`,
        attributes: payload,
      }),
    [clientId, createFeedbackMutation],
  );

  const createTask = React.useCallback(
    async (payload) =>
      createTaskMutation.mutateAsync({
        url: `/coach/clients/${clientId}/tasks`,
        attributes: payload,
      }),
    [clientId, createTaskMutation],
  );

  return {
    ...query,
    detail: resolveCoachClientDetailPayload(data),
    createWeeklyCheckIn,
    markPayment,
    updateClientPricing,
    updateClientLifecycle,
    cancelPayment,
    createFeedback,
    createTask,
    removeClient,
    isCreatingWeeklyCheckIn: createWeeklyCheckInMutation.isPending,
    isMarkingPayment: markPaymentMutation.isPending,
    isUpdatingClientPricing: updatePricingMutation.isPending,
    isUpdatingClientLifecycle: updateLifecycleMutation.isPending,
    isCancellingPayment: cancelPaymentMutation.isPending,
    isCreatingFeedback: createFeedbackMutation.isPending,
    isCreatingTask: createTaskMutation.isPending,
    isRemovingClient: removeClientMutation.isPending,
  };
};
