import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";

const invalidateQueryKeys = async (queryClient, queryKeys = []) => {
  const validKeys = queryKeys.filter((queryKey) =>
    Array.isArray(queryKey) ? queryKey.length > 0 : Boolean(queryKey),
  );

  await Promise.all(
    validKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
};

const mergeMutationProps = (baseOnSuccess, mutationProps = {}) => {
  const { onSuccess, ...restMutationProps } = mutationProps;

  return {
    ...restMutationProps,
    onSuccess: async (data, variables, context) => {
      await baseOnSuccess?.(data, variables, context);

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
  };
};

const normalizeDeleteConfig = (attributes, config = {}) => {
  if (attributes === undefined) {
    return config;
  }

  if (
    attributes &&
    typeof attributes === "object" &&
    !Array.isArray(attributes) &&
    ("data" in attributes || "headers" in attributes || "params" in attributes)
  ) {
    return {
      ...attributes,
      ...config,
    };
  }

  return {
    ...config,
    data: attributes,
  };
};

export const createCoachResourceHooks = ({
  baseUrl,
  listQueryKey,
  detailQueryKey,
  extraInvalidateKeys = [],
}) => {
  const useList = (params = {}, queryProps = {}) =>
    useGetQuery({
      url: baseUrl,
      params,
      queryProps: {
        queryKey: [...listQueryKey, params],
        ...queryProps,
      },
    });

  const useDetail = (id, params = {}, queryProps = {}) =>
    useGetQuery({
      url: `${baseUrl}/${id}`,
      params,
      queryProps: {
        queryKey: [...detailQueryKey, id, params],
        enabled: Boolean(id) && (queryProps.enabled ?? true),
        ...queryProps,
      },
    });

  const useMutations = (options = {}) => {
    const queryClient = useQueryClient();
    const invalidateKeys = [detailQueryKey, ...extraInvalidateKeys];

    const buildMutationProps = (mutationProps) =>
      mergeMutationProps(
        async () => invalidateQueryKeys(queryClient, invalidateKeys),
        mutationProps,
      );

    const createMutation = usePostQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.createMutationProps),
    });
    const updateMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.updateMutationProps),
    });
    const removeMutation = useDeleteQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.removeMutationProps),
    });
    const updateStatusMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.updateStatusMutationProps),
    });
    const restoreMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.restoreMutationProps),
    });
    const bulkStatusMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.bulkStatusMutationProps),
    });
    const bulkTrashMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.bulkTrashMutationProps),
    });
    const bulkRestoreMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.bulkRestoreMutationProps),
    });
    const bulkHardDeleteMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.bulkHardDeleteMutationProps),
    });
    const reorderMutation = usePatchQuery({
      queryKey: listQueryKey,
      mutationProps: buildMutationProps(options.reorderMutationProps),
    });

    const createResource = React.useCallback(
      (attributes = {}, config = {}) =>
        createMutation.mutateAsync({
          url: baseUrl,
          attributes,
          config,
        }),
      [createMutation],
    );

    const updateResource = React.useCallback(
      (id, attributes = {}, config = {}) =>
        updateMutation.mutateAsync({
          url: `${baseUrl}/${id}`,
          attributes,
          config,
        }),
      [updateMutation],
    );

    const removeResource = React.useCallback(
      (id, attributes, config = {}) =>
        removeMutation.mutateAsync({
          url: `${baseUrl}/${id}`,
          attributes: normalizeDeleteConfig(attributes, config),
        }),
      [removeMutation],
    );

    const updateResourceStatus = React.useCallback(
      (id, attributes = {}, config = {}) =>
        updateStatusMutation.mutateAsync({
          url: `${baseUrl}/${id}/status`,
          attributes,
          config,
        }),
      [updateStatusMutation],
    );

    const restoreResource = React.useCallback(
      (id, attributes = {}, config = {}) =>
        restoreMutation.mutateAsync({
          url: `${baseUrl}/${id}/restore`,
          attributes,
          config,
        }),
      [restoreMutation],
    );

    const bulkUpdateStatus = React.useCallback(
      (attributes = {}, config = {}) =>
        bulkStatusMutation.mutateAsync({
          url: `${baseUrl}/status`,
          attributes,
          config,
        }),
      [bulkStatusMutation],
    );

    const bulkTrashResources = React.useCallback(
      (attributes = {}, config = {}) =>
        bulkTrashMutation.mutateAsync({
          url: `${baseUrl}/trash`,
          attributes,
          config,
        }),
      [bulkTrashMutation],
    );

    const bulkRestoreResources = React.useCallback(
      (attributes = {}, config = {}) =>
        bulkRestoreMutation.mutateAsync({
          url: `${baseUrl}/restore`,
          attributes,
          config,
        }),
      [bulkRestoreMutation],
    );

    const bulkHardDeleteResources = React.useCallback(
      (attributes = {}, config = {}) =>
        bulkHardDeleteMutation.mutateAsync({
          url: `${baseUrl}/hard-delete`,
          attributes,
          config,
        }),
      [bulkHardDeleteMutation],
    );

    const reorderResources = React.useCallback(
      (attributes = {}, config = {}) =>
        reorderMutation.mutateAsync({
          url: `${baseUrl}/reorder`,
          attributes,
          config,
        }),
      [reorderMutation],
    );

    return {
      createMutation,
      updateMutation,
      removeMutation,
      updateStatusMutation,
      restoreMutation,
      bulkStatusMutation,
      bulkTrashMutation,
      bulkRestoreMutation,
      bulkHardDeleteMutation,
      reorderMutation,
      createResource,
      updateResource,
      removeResource,
      updateResourceStatus,
      restoreResource,
      bulkUpdateStatus,
      bulkTrashResources,
      bulkRestoreResources,
      bulkHardDeleteResources,
      reorderResources,
      isMutating:
        createMutation.isPending ||
        updateMutation.isPending ||
        removeMutation.isPending ||
        updateStatusMutation.isPending ||
        restoreMutation.isPending ||
        bulkStatusMutation.isPending ||
        bulkTrashMutation.isPending ||
        bulkRestoreMutation.isPending ||
        bulkHardDeleteMutation.isPending ||
        reorderMutation.isPending,
    };
  };

  return {
    useList,
    useDetail,
    useMutations,
  };
};

export default createCoachResourceHooks;
