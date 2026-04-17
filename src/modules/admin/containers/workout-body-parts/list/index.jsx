import React from "react";
import { get } from "lodash";
import {
  useGetQuery,
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import LocalizedCatalogManager from "@/modules/admin/components/localized-catalog-manager.jsx";
import {
  WORKOUT_BODY_PARTS_ENDPOINT,
  WORKOUT_BODY_PARTS_QUERY_KEY,
} from "../api.js";

const Index = () => {
  const { data, isLoading } = useGetQuery({
    url: WORKOUT_BODY_PARTS_ENDPOINT,
    queryProps: { queryKey: WORKOUT_BODY_PARTS_QUERY_KEY },
  });

  const bodyParts = get(data, "data.data", []);

  const { mutateAsync: createMutation, isPending: isCreating } = usePostQuery({
    queryKey: WORKOUT_BODY_PARTS_QUERY_KEY,
  });
  const { mutateAsync: patchMutation, isPending: isPatchPending } =
    usePatchQuery({ queryKey: WORKOUT_BODY_PARTS_QUERY_KEY });
  const { mutateAsync: deleteMutation, isPending: isDeleting } =
    useDeleteQuery({ queryKey: WORKOUT_BODY_PARTS_QUERY_KEY });
  const { mutateAsync: reorderMutation, isPending: isReorderPending } =
    usePatchQuery({ queryKey: WORKOUT_BODY_PARTS_QUERY_KEY });

  const isUpdating = isPatchPending || isReorderPending;

  const createBodyPart = React.useCallback(
    async (payload) =>
      createMutation({
        url: WORKOUT_BODY_PARTS_ENDPOINT,
        attributes: payload,
      }),
    [createMutation],
  );

  const updateBodyPart = React.useCallback(
    async (id, payload) =>
      patchMutation({
        url: `${WORKOUT_BODY_PARTS_ENDPOINT}/${id}`,
        attributes: payload,
      }),
    [patchMutation],
  );

  const deleteBodyPart = React.useCallback(
    async (id) => deleteMutation({ url: `${WORKOUT_BODY_PARTS_ENDPOINT}/${id}` }),
    [deleteMutation],
  );

  const reorderBodyParts = React.useCallback(
    async (payload) =>
      reorderMutation({
        url: `${WORKOUT_BODY_PARTS_ENDPOINT}/reorder`,
        attributes: payload,
      }),
    [reorderMutation],
  );

  return (
    <LocalizedCatalogManager
      route="/admin/workout-body-parts"
      breadcrumbTitle="Tana qismlari"
      title="Tana qismlari"
      description="Workoutlar uchun tana qismi katalogini va tarjimalarini boshqaring."
      singularLabel="tana qismi"
      pluralSearchPlaceholder="Tana qismi qidirish"
      items={bodyParts}
      createItem={createBodyPart}
      updateItem={updateBodyPart}
      deleteItem={deleteBodyPart}
      reorderItems={reorderBodyParts}
      isLoading={isLoading}
      isCreating={isCreating}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
    />
  );
};

export default Index;
