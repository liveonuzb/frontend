import get from "lodash/get";
import LocalizedCatalogManager from "@/modules/admin/components/localized-catalog-manager.jsx";
import TaxonomyGovernanceSummary from "@/modules/admin/components/taxonomy-governance-summary.jsx";
import { useDeleteQuery, useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";

const QUERY_KEY = ["admin", "nutrition-preferences"];
const NUTRITION_PREFERENCES_URL = "/admin/nutrition/preferences";

const ListPage = () => {
  const { data, isLoading, isFetching, refetch } = useGetQuery({
    url: NUTRITION_PREFERENCES_URL,
    params: { pageSize: 100 },
    queryProps: { queryKey: QUERY_KEY },
  });
  const postMutation = usePostQuery({ queryKey: QUERY_KEY });
  const patchMutation = usePatchQuery({ queryKey: QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: QUERY_KEY });
  const items = get(data, "data.data", []);

  return (
    <div className="flex flex-col gap-4">
      <TaxonomyGovernanceSummary groupKey="nutritionPreferences" />
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
        showNutritionTagMapping
        refetch={refetch}
        createItem={(payload) =>
          postMutation.mutateAsync({
            url: NUTRITION_PREFERENCES_URL,
            attributes: payload,
          })
        }
        updateItem={(id, payload) =>
          patchMutation.mutateAsync({
            url: `${NUTRITION_PREFERENCES_URL}/${id}`,
            attributes: payload,
          })
        }
        deleteItem={(id) =>
          deleteMutation.mutateAsync({
            url: `${NUTRITION_PREFERENCES_URL}/${id}`,
          })
        }
        getDeletionImpactUrl={(item) =>
          `${NUTRITION_PREFERENCES_URL}/${get(item, "id")}/deletion-impact`
        }
        reorderItems={(payload) =>
          patchMutation.mutateAsync({
            url: `${NUTRITION_PREFERENCES_URL}/reorder`,
            attributes: payload,
          })
        }
      />
    </div>
  );
};

export default ListPage;
