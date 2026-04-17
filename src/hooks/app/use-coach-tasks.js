import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePatchQuery } from "@/hooks/api";

export const USER_COACH_TASKS_QUERY_KEY = ["me", "coach-tasks"];

export const useCoachTasks = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();

  const { data, ...query } = useGetQuery({
    url: "/users/me/coach-tasks",
    queryProps: {
      queryKey: USER_COACH_TASKS_QUERY_KEY,
      enabled,
    },
  });

  const completeMutation = usePatchQuery({
    queryKey: USER_COACH_TASKS_QUERY_KEY,
    mutationProps: {
      onMutate: async ({ url }) => {
        const parts = url.split("/");
        const taskId = parts[parts.length - 2];

        await queryClient.cancelQueries({ queryKey: USER_COACH_TASKS_QUERY_KEY });
        const snapshot = queryClient.getQueryData(USER_COACH_TASKS_QUERY_KEY);

        queryClient.setQueryData(USER_COACH_TASKS_QUERY_KEY, (old) => {
          if (!old) return old;
          const items = get(old, "data.data.items", []);
          return {
            ...old,
            data: {
              ...old.data,
              data: {
                ...old.data.data,
                items: items.map((item) =>
                  item.id === taskId
                    ? { ...item, status: "completed", completedAt: new Date().toISOString() }
                    : item,
                ),
              },
            },
          };
        });

        return { snapshot };
      },
      onError: (_err, _variables, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(USER_COACH_TASKS_QUERY_KEY, context.snapshot);
        }
      },
    },
  });

  const completeTask = React.useCallback(
    async (taskId, payload = {}) =>
      completeMutation.mutateAsync({
        url: `/users/me/coach-tasks/${taskId}/complete`,
        attributes: payload,
      }),
    [completeMutation],
  );

  const items = get(data, "data.data.items", []);

  return {
    ...query,
    items,
    openTasks: items.filter((item) => item.status === "open"),
    completedTasks: items.filter((item) => item.status === "completed"),
    completeTask,
    isCompletingTask: completeMutation.isPending,
  };
};

export default useCoachTasks;
