import coachTelegramApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-telegram-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
} from "@/hooks/api";

const coachTelegramHooks = createCoachResourceHooks({
  baseUrl: coachTelegramApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachTelegram = coachTelegramHooks.useList;
export const useCoachTelegramItem = coachTelegramHooks.useDetail;
export const useCoachTelegramMutations = coachTelegramHooks.useMutations;

export const useCoachTelegramBot = (apiBase, queryKey) =>
  useGetQuery({
    url: apiBase,
    queryProps: { queryKey },
  });

export const useCoachTelegramUsers = (
  apiBase,
  params = { page: 1, limit: 200 },
  queryProps = {},
) =>
  useGetQuery({
    url: `${apiBase}/users`,
    params,
    queryProps,
  });

export const useCoachTelegramMessages = (
  apiBase,
  params = { page: 1, limit: 100 },
  queryProps = {},
) =>
  useGetQuery({
    url: `${apiBase}/messages`,
    params,
    queryProps,
  });

export const useCoachTelegramConnect = (queryKey) =>
  usePostQuery({ listKey: queryKey });

export const useCoachTelegramSendMessage = () => usePostQuery({ listKey: [] });

export const useCoachTelegramToggle = (queryKey) =>
  usePostQuery({ listKey: queryKey });

export const useCoachTelegramDisconnect = (queryKey) =>
  useDeleteQuery({ listKey: queryKey });

export const useCoachTelegramSettings = (queryKey) =>
  usePatchQuery({ listKey: queryKey });

export default coachTelegramHooks;
