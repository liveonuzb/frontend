import { createCoachResourceApi } from "./create-coach-resource-api";

const coachChallengesApi = createCoachResourceApi({
  resource: "challenges",
  queryKeyBase: ["coach", "challenges"],
});

export const LIST_QUERY_KEY = coachChallengesApi.LIST_QUERY_KEY;
export const DETAIL_QUERY_KEY = coachChallengesApi.DETAIL_QUERY_KEY;
export const getList = coachChallengesApi.getList;
export const getById = coachChallengesApi.getById;
export const create = coachChallengesApi.create;
export const update = coachChallengesApi.update;
export const remove = coachChallengesApi.remove;
export const updateStatus = coachChallengesApi.updateStatus;
export const restore = coachChallengesApi.restore;
export const bulkStatus = coachChallengesApi.bulkStatus;
export const bulkTrash = coachChallengesApi.bulkTrash;
export const bulkRestore = coachChallengesApi.bulkRestore;
export const bulkHardDelete = coachChallengesApi.bulkHardDelete;
export const reorder = coachChallengesApi.reorder;
export const exportData = coachChallengesApi.exportData;
export const importData = coachChallengesApi.importData;

export default coachChallengesApi;
