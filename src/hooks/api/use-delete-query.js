import { useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "./use-api.js";

const useDeleteQuery = ({ queryKey, listKey, mutationProps = {} } = {}) => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { onSuccess, ...restMutationProps } = mutationProps;

  const mutationFn = ({ url, attributes }) => request.delete(url, attributes);

  const { ...rest } = useMutation({
    ...restMutationProps,
    mutationFn: ({ url, attributes }) => mutationFn({ url, attributes }),
    onSuccess: async (data, variables, context) => {
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey });
        if (listKey) {
          await queryClient.invalidateQueries({ queryKey: listKey });
        }
      }

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
  });

  return { ...rest };
};

export default useDeleteQuery;
