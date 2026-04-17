import { useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "./use-api.js";
import { isEmpty } from "lodash";

const usePatchQuery = ({ queryKey = [], listKey = [], mutationProps = {} } = {}) => {
  const { request } = useApi();
  const queryClient = useQueryClient();
  const { onSuccess, ...restMutationProps } = mutationProps;

  const mutationFn = ({ url, attributes, config = {} }) =>
    request.patch(url, attributes, config);

  const { ...rest } = useMutation({
    ...restMutationProps,
    mutationFn: ({ url, attributes, config = {} }) =>
      mutationFn({ url, attributes, config }),

    onSuccess: async (data, variables, context) => {
      if (!isEmpty(queryKey)) {
        await queryClient.invalidateQueries({ queryKey: queryKey });
        if (!isEmpty(listKey)) {
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

export default usePatchQuery;
