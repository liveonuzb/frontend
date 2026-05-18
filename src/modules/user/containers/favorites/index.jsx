import React from "react";
import { useNavigate } from "react-router";
import {
  HeartIcon,
  DumbbellIcon,
  UtensilsIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/store";
import PageTransition from "@/components/page-transition";
import { useDeleteQuery, useGetQuery } from "@/hooks/api";

import { map } from "lodash";

const FAVORITES_QUERY_KEY = ["me", "favorites"];

const ENTITY_TYPES = [
  { value: null, label: "Barchasi" },
  { value: "WORKOUT_PLAN", label: "Mashg'ulotlar", Icon: DumbbellIcon },
  { value: "MEAL_PLAN", label: "Ovqat rejalari", Icon: UtensilsIcon },
];

const ENTITY_ROUTES = {
  WORKOUT_PLAN: () => `/user/workout`,
  MEAL_PLAN: () => `/user/nutrition`,
};

const ENTITY_ICONS = {
  WORKOUT_PLAN: DumbbellIcon,
  MEAL_PLAN: UtensilsIcon,
};

const ENTITY_LABELS = {
  WORKOUT_PLAN: "Mashg'ulot rejasi",
  MEAL_PLAN: "Ovqat rejasi",
};

const FavoriteItem = ({ item, onRemove, isRemoving }) => {
  const navigate = useNavigate();
  const Icon = ENTITY_ICONS[item.entityType] ?? HeartIcon;
  const route = ENTITY_ROUTES[item.entityType]?.(item.entityId);

  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3 transition-all hover:border-primary/20">
      <button
        type="button"
        className="flex flex-1 items-center gap-3 min-w-0 text-left"
        onClick={() => route && navigate(route)}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {ENTITY_LABELS[item.entityType] ?? item.entityType}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            ID: {item.entityId.slice(0, 12)}...
          </p>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 size-8 text-muted-foreground hover:text-destructive"
        disabled={isRemoving}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.entityType, item.entityId);
        }}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
};

const FavoritesContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [activeType, setActiveType] = React.useState(null);
  const [removingKey, setRemovingKey] = React.useState(null);

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/favorites", title: "Sevimlilar" },
    ]);
  }, [setBreadcrumbs]);

  const favoriteParams = activeType ? { type: activeType } : {};
  const { data, isLoading } = useGetQuery({
    url: "/users/me/favorites",
    params: favoriteParams,
    queryProps: {
      queryKey: [...FAVORITES_QUERY_KEY, activeType ?? "all"],
    },
  });
  const items = React.useMemo(() => data?.data?.items ?? [], [data]);
  const deleteFavoriteMutation = useDeleteQuery({
    queryKey: FAVORITES_QUERY_KEY,
  });

  const handleRemove = React.useCallback(async (entityType, entityId) => {
    const key = `${entityType}:${entityId}`;
    setRemovingKey(key);
    try {
      await deleteFavoriteMutation.mutateAsync({
        url: `/users/me/favorites/${entityType}/${entityId}`,
      });
      toast.success("Sevimlilardan olib tashlandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setRemovingKey(null);
    }
  }, [deleteFavoriteMutation]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/10">
            <HeartIcon className="size-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sevimlilar</h1>
            <p className="text-sm text-muted-foreground">
              Saqlagan zallar va rejalar
            </p>
          </div>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          {map(ENTITY_TYPES, (t) => (
            <button
              key={String(t.value)}
              type="button"
              onClick={() => setActiveType(t.value)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                activeType === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {map([0, 1, 2], (i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
            <HeartIcon className="size-10 text-muted-foreground/30" />
            <div>
              <p className="font-semibold text-muted-foreground">Sevimlilar yo&apos;q</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
                Reja sahifasida ❤️ tugmasini bosing
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {map(items, (item) => (
              <FavoriteItem
                key={item.id}
                item={item}
                onRemove={handleRemove}
                isRemoving={removingKey === `${item.entityType}:${item.entityId}`}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default FavoritesContainer;
