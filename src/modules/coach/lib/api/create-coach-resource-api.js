import { api } from "@/hooks/api/use-api";

const buildBaseUrl = (resource) =>
  resource.startsWith("/") ? resource : `/coach/${resource}`;

const normalizeDeleteConfig = (attributes, config = {}) => {
  if (attributes === undefined) {
    return config;
  }

  if (
    attributes &&
    typeof attributes === "object" &&
    !Array.isArray(attributes) &&
    ("data" in attributes || "headers" in attributes || "params" in attributes)
  ) {
    return { ...attributes, ...config };
  }

  return {
    ...config,
    data: attributes,
  };
};

export const createCoachResourceApi = ({
  resource,
  queryKeyBase = ["coach", resource],
}) => {
  const baseUrl = buildBaseUrl(resource);
  const LIST_QUERY_KEY = queryKeyBase;
  const DETAIL_QUERY_KEY = [...queryKeyBase, "detail"];

  return {
    resource,
    baseUrl,
    LIST_QUERY_KEY,
    DETAIL_QUERY_KEY,
    getList: (params = {}, config = {}) => api.get(baseUrl, { params, ...config }),
    getById: (id, params = {}, config = {}) =>
      api.get(`${baseUrl}/${id}`, { params, ...config }),
    create: (attributes = {}, config = {}) => api.post(baseUrl, attributes, config),
    update: (id, attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/${id}`, attributes, config),
    remove: (id, attributes, config = {}) =>
      api.delete(`${baseUrl}/${id}`, normalizeDeleteConfig(attributes, config)),
    updateStatus: (id, attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/${id}/status`, attributes, config),
    restore: (id, attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/${id}/restore`, attributes, config),
    bulkStatus: (attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/status`, attributes, config),
    bulkTrash: (attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/trash`, attributes, config),
    bulkRestore: (attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/restore`, attributes, config),
    bulkHardDelete: (attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/hard-delete`, attributes, config),
    reorder: (attributes = {}, config = {}) =>
      api.patch(`${baseUrl}/reorder`, attributes, config),
    exportData: (params = {}, config = {}) =>
      api.get(`${baseUrl}/export`, { params, ...config }),
    importData: (attributes = {}, config = {}) =>
      api.post(`${baseUrl}/import`, attributes, config),
  };
};

export default createCoachResourceApi;
