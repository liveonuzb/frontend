import { useQuery } from "@tanstack/react-query";
import useApi  from "./use-api.js";
import { useOnlineStatus } from "@/hooks/utils";

const useGetQuery = ({ url, params, config, queryProps }) => {
  const { request } = useApi();
  const isOnline = useOnlineStatus();




  const { ...rest } = useQuery({
    queryFn: () => request.get(url, { params, ...config }),
    ...(queryProps ?? {}),
    enabled: Boolean(isOnline && (queryProps?.enabled ?? true)),
  });

  return { ...rest };
};

export default useGetQuery;
