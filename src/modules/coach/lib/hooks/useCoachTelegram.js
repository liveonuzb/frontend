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

export const useCoachTelegramHealth = (apiBase, queryProps = {}) =>
  useGetQuery({
    url: `${apiBase}/health`,
    queryProps,
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

export const useCoachTelegramTemplates = (apiBase, queryProps = {}) =>
  useGetQuery({
    url: `${apiBase}/templates`,
    queryProps,
  });

export const useCoachTelegramBroadcasts = (apiBase, queryProps = {}) =>
  useGetQuery({
    url: `${apiBase}/broadcasts`,
    queryProps,
  });

export const useCoachTelegramConnect = (queryKey) =>
  usePostQuery({ queryKey });

export const useCoachTelegramSendMessage = () => usePostQuery({ listKey: [] });

export const useCoachTelegramUserUpdate = (queryKey) =>
  usePatchQuery({ queryKey });

export const useCoachTelegramToggle = (queryKey) =>
  usePostQuery({ queryKey });

export const useCoachTelegramDisconnect = (queryKey) =>
  useDeleteQuery({ queryKey });

export const useCoachTelegramSettings = (queryKey) =>
  usePatchQuery({ queryKey });

export const useCoachTelegramTemplateSave = (queryKey) =>
  usePatchQuery({ queryKey });

export const useCoachTelegramTemplatePreview = () =>
  usePostQuery({ listKey: [] });

export const useCoachTelegramTemplateDelete = (queryKey) =>
  useDeleteQuery({ queryKey });

export default coachTelegramHooks;
