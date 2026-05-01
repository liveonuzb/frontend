import { get } from "lodash";
import LocalizedCatalogManager from "@/modules/admin/components/localized-catalog-manager.jsx";
import { useDeleteQuery, useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";

const QUERY_KEY = ["admin", "nutrition-preferences"];

const ListPage = () => {
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/nutrition-preferences",
    params: { pageSize: 100 },
    queryProps: { queryKey: QUERY_KEY },
  });
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });
  const items = get(data, "data.data", []);

  return (
    <LocalizedCatalogManager
      route="/admin/nutrition-preferences/list"
      breadcrumbTitle="Nutrition preferences"
      title="Ovqatlanishda nimalarni hisobga olish muhim?"
      description="Halol, gluten free, sugar free kabi onboarding tanlovlari"
      singularLabel="Nutrition preference"
      pluralSearchPlaceholder="Preference qidirish"
      items={items}
      isLoading={isLoading}
      isFetching={isFetching}
      isCreating={postMutation.isPending}
      isUpdating={patchMutation.isPending}
      isDeleting={deleteMutation.isPending}
      refetch={refetch}
      createItem={(payload) =>
        postMutation.mutateAsync({
          url: "/admin/nutrition-preferences",
          attributes: payload,
        })
      }
      updateItem={(id, payload) =>
        patchMutation.mutateAsync({
          url: `/admin/nutrition-preferences/${id}`,
          attributes: payload,
        })
      }
      deleteItem={(id) =>
        deleteMutation.mutateAsync({
          url: `/admin/nutrition-preferences/${id}`,
        })
      }
      reorderItems={(payload) =>
        patchMutation.mutateAsync({
          url: "/admin/nutrition-preferences/reorder",
          attributes: payload,
        })
      }
    />
  );
};

export default ListPage;
