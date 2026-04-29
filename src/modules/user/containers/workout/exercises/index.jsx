import React from "react";
import { filter, get } from "lodash";
import { SearchIcon } from "lucide-react";
import PageLoader from "@/components/page-loader/index.jsx";
import PageTransition from "@/components/page-transition";
import { TrackingPageHeader } from "@/components/tracking-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkoutLogs } from "@/hooks/app/use-workout-logs";
import {
  useWorkoutExerciseCategories,
  useWorkoutExercises,
} from "@/hooks/app/use-workout-plans";
import { useBreadcrumbStore } from "@/store";
import WorkoutExerciseDetailDrawer from "../workout-exercise-detail-drawer.jsx";

const WorkoutExercisesPage = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [query, setQuery] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(null);
  const [selectedExercise, setSelectedExercise] = React.useState(null);
  const { categories, isLoading: isCategoriesLoading } =
    useWorkoutExerciseCategories();
  const { exercises, isLoading: isExercisesLoading } = useWorkoutExercises({
    categoryId,
    query,
  });
  const { items: logs } = useWorkoutLogs({}, { enabled: Boolean(selectedExercise) });

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/user", title: "Bosh sahifa" },
      { url: "/user/workout/home", title: "Workout" },
      { url: "/user/workout/exercises", title: "Mashqlar" },
    ]);
  }, [setBreadcrumbs]);

  const visibleExercises = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return filter(exercises, (exercise) => {
      if (!normalizedQuery) {
        return true;
      }

      return String(get(exercise, "name", ""))
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [exercises, query]);

  if (isCategoriesLoading || isExercisesLoading) {
    return <PageLoader />;
  }

  return (
    <PageTransition mode="fade">
      <div className="flex flex-col gap-6 pb-4">
        <TrackingPageHeader
          title="Mashqlar kutubxonasi"
          subtitle="Kategoriya, jihoz va instruktsiyalar bilan mashqlarni ko'ring."
          hideTitleOnMobile={false}
        />

        <div className="flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Mashq qidirish..."
              className="h-12 rounded-2xl pl-11"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              variant={categoryId === null ? "default" : "outline"}
              className="shrink-0 rounded-2xl"
              onClick={() => setCategoryId(null)}
            >
              Barchasi
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={categoryId === category.id ? "default" : "outline"}
                className="shrink-0 rounded-2xl"
                onClick={() => setCategoryId(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {visibleExercises.map((exercise) => {
            const equipments = Array.isArray(get(exercise, "equipments"))
              ? get(exercise, "equipments")
              : [];
            const targetMuscles = Array.isArray(get(exercise, "targetMuscles"))
              ? get(exercise, "targetMuscles")
              : [];

            return (
              <Card
                key={exercise.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedExercise(exercise)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedExercise(exercise);
                  }
                }}
                className="overflow-hidden rounded-[1.75rem] border transition-colors hover:bg-accent/30"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {exercise.imageUrl ? (
                      <img
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-2xl">
                        {exercise.emoji || "🏋️"}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black">
                          {exercise.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {exercise.category || "Mashq"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {exercise.trackingType?.replaceAll("_", " ") || "TRACK"}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {equipments.slice(0, 2).map((item) => (
                        <Badge
                          key={`${exercise.id}-eq-${item}`}
                          variant="outline"
                          className="rounded-full"
                        >
                          {item}
                        </Badge>
                      ))}
                      {targetMuscles.slice(0, 2).map((item) => (
                        <Badge
                          key={`${exercise.id}-muscle-${item}`}
                          variant="outline"
                          className="rounded-full"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {visibleExercises.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed p-6 text-sm text-muted-foreground">
              Tanlangan filter bo'yicha mashq topilmadi.
            </div>
          ) : null}
        </div>
      </div>

      <WorkoutExerciseDetailDrawer
        open={Boolean(selectedExercise)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
        exercise={selectedExercise}
        logs={logs}
      />
    </PageTransition>
  );
};

export default WorkoutExercisesPage;
