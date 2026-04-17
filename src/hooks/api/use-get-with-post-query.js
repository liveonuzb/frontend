import { useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "./use-api.js";

const useGetWithPostQuery = ({ queryKey }) => {
  const { request } = useApi();

  const queryClient = useQueryClient();

  const mutationFn = ({ url, params, config = {} }) =>
    request.get(url, { params, ...config });

  const { ...rest } = useMutation({
    mutationFn,
    onError: () => {},
    onSuccess: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey }).then(() => {});
      }
    },
  });

  return { ...rest };
};

export default useGetWithPostQuery;
