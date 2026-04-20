import coachTelegramApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-telegram-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachTelegramHooks = createCoachResourceHooks({
  baseUrl: coachTelegramApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachTelegram = coachTelegramHooks.useList;
export const useCoachTelegramItem = coachTelegramHooks.useDetail;
export const useCoachTelegramMutations = coachTelegramHooks.useMutations;

export default coachTelegramHooks;
