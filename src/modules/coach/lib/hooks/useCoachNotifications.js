import coachNotificationsApi, {
  DETAIL_QUERY_KEY,
  LIST_QUERY_KEY,
} from "../api/coach-notifications-api";
import { createCoachResourceHooks } from "./create-coach-resource-hooks";

const coachNotificationsHooks = createCoachResourceHooks({
  baseUrl: coachNotificationsApi.baseUrl,
  listQueryKey: LIST_QUERY_KEY,
  detailQueryKey: DETAIL_QUERY_KEY,
});

export const useCoachNotifications = coachNotificationsHooks.useList;
export const useCoachNotification = coachNotificationsHooks.useDetail;
export const useCoachNotificationsMutations = coachNotificationsHooks.useMutations;

export default coachNotificationsHooks;
