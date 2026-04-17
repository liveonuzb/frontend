import { useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "./use-api.js";

const usePostFileQuery = ({ queryKey, listKey }) => {
  const { request } = useApi();

  const queryClient = useQueryClient();

  const mutationFn = ({ url, attributes, config = {} }) =>
    request.post(url, attributes, config);

  const { ...rest } = useMutation({
    mutationFn: ({ url, attributes, config = {} }) =>
      mutationFn({ url, attributes, config }),
    onSuccess: () => {
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey }).then(() => {});
        if (listKey) {
          queryClient.invalidateQueries({ queryKey: listKey }).then(() => {});
        }
      }
    },
  });

  return { ...rest };
};

export default usePostFileQuery;
