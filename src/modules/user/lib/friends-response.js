import { get, isArray } from "lodash";
import { getApiResponseData } from "@/lib/api-response";

export const getFriendItems = (response) => {
  const payload = getApiResponseData(response, {});

  if (isArray(payload)) {
    return payload;
  }

  return get(payload, "items", []);
};

export const getFriendRequests = (response) => {
  const payload = getApiResponseData(response, {});

  return {
    incoming: get(payload, "incoming", []),
    outgoing: get(payload, "outgoing", []),
  };
};
