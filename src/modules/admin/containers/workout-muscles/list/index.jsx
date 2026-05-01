import React from "react";
import {
  usePostQuery,
  usePatchQuery,
  useDeleteQuery,
} from "@/hooks/api";
import LocalizedCatalogManager from "@/modules/admin/components/localized-catalog-manager.jsx";
import {
  WORKOUT_MUSCLES_ENDPOINT,
  WORKOUT_MUSCLES_QUERY_KEY,
} from "../api.js";

const Index = () => {
  const { mutateAsync: createMutation, isPending: isCreating } = usePostQuery({
    queryKey: WORKOUT_MUSCLES_QUERY_KEY,
  });
  const { mutateAsync: patchMutation, isPending: isPatchPending } =
    usePatchQuery({ queryKey: WORKOUT_MUSCLES_QUERY_KEY });
  const { mutateAsync: deleteMutation, isPending: isDeleting } =
    useDeleteQuery({ queryKey: WORKOUT_MUSCLES_QUERY_KEY });
  const { mutateAsync: reorderMutation, isPending: isReorderPending } =
    usePatchQuery({ queryKey: WORKOUT_MUSCLES_QUERY_KEY });

  const isUpdating = isPatchPending || isReorderPending;

  const createMuscle = React.useCallback(
    async (payload) =>
      createMutation({ url: WORKOUT_MUSCLES_ENDPOINT, attributes: payload }),
    [createMutation],
  );

  const updateMuscle = React.useCallback(
    async (id, payload) =>
      patchMutation({
        url: `${WORKOUT_MUSCLES_ENDPOINT}/${id}`,
        attributes: payload,
      }),
    [patchMutation],
  );

  const deleteMuscle = React.useCallback(
    async (id) => deleteMutation({ url: `${WORKOUT_MUSCLES_ENDPOINT}/${id}` }),
    [deleteMutation],
  );

  const reorderMuscles = React.useCallback(
    async (payload) =>
      reorderMutation({
        url: `${WORKOUT_MUSCLES_ENDPOINT}/reorder`,
        attributes: payload,
      }),
    [reorderMutation],
  );

  return (
    <LocalizedCatalogManager
      route="/admin/workout-muscles"
      breadcrumbTitle="Mashq muskullari"
      title="Mashq muskullari"
      description="Workoutlar uchun asosiy mushak katalogini va tarjimalarini boshqaring."
      singularLabel="mushak"
      pluralSearchPlaceholder="Mushak qidirish"
      endpoint={WORKOUT_MUSCLES_ENDPOINT}
      queryKey={WORKOUT_MUSCLES_QUERY_KEY}
      createItem={createMuscle}
      updateItem={updateMuscle}
      deleteItem={deleteMuscle}
      reorderItems={reorderMuscles}
      isCreating={isCreating}
      isUpdating={isUpdating}
      isDeleting={isDeleting}
    />
  );
};

export default Index;
