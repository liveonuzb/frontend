import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";
import {
  COACH_CLIENTS_QUERY_KEY,
  COACH_CLIENT_DETAIL_QUERY_KEY,
  COACH_CLIENT_NOTES_QUERY_KEY,
  COACH_CLIENT_REMINDERS_QUERY_KEY,
  COACH_CLIENT_SUMMARY_QUERY_KEY,
  COACH_DASHBOARD_QUERY_KEY,
  COACH_PAYMENTS_QUERY_KEY,
} from "./use-coach-query-keys";

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
        attributes: payload,
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
    updateClientPayment,
    cancelClientPayment,
    refundClientPayment,
    isInviting: inviteMutation.isPending,
    isRemovingClient: removeMutation.isPending,
    isCancellingInvitation: cancelInvitationMutation.isPending,
    isMarkingClientPayment: markPaymentMutation.isPending,
    isUpdatingClientPricing: updatePricingMutation.isPending,
    isUpdatingClientPayment: updatePaymentMutation.isPending,
    isCancellingClientPayment: cancelPaymentMutation.isPending,
    isRefundingClientPayment: refundPaymentMutation.isPending,
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
    summary: get(data, "data", null),
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
  const downloadReport = (period = 'weekly') => {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    window.open(`${base}/coach/clients/${clientId}/report/pdf?period=${period}`, '_blank');
  };
  return { downloadReport };
}

export function useExportClientsCsv() {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const download = () => window.open(`${base}/coach/reports/clients.csv`, '_blank');
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
              feedback: [optimistic, ...get(old, "data.feedback", [])],
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
    detail: get(data, "data", {
      client: null,
      overview: null,
      measurements: [],
      dailyLogs: [],
      assignedTemplates: [],
      weeklyCheckIns: [],
      feedback: [],
      tasks: [],
      payments: [],
    }),
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
