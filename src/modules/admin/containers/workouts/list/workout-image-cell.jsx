import WorkoutMediaFallback from "@/modules/user/containers/workout/workout-media-fallback.jsx";

const WorkoutImageCell = ({ workout }) => {
  if (workout?.imageUrl) {
    return (
      <div className="size-10 overflow-hidden rounded-xl border">
        <WorkoutMediaFallback
          src={workout.imageUrl}
          alt={workout.name}
          compact
          label="Workout media mavjud emas"
        />
      </div>
    );
  }

  if (workout?.youtubeUrl) {
    return (
      <div className="size-10 overflow-hidden rounded-xl border border-red-100 bg-red-50 text-red-500">
        <WorkoutMediaFallback
          variant="video"
          compact
          label="Workout videosi mavjud"
          fallbackClassName="bg-red-50 text-red-500"
        />
      </div>
    );
  }

  return (
    <div className="size-10 overflow-hidden rounded-xl border bg-muted">
      <WorkoutMediaFallback compact label="Workout media mavjud emas" />
    </div>
  );
};

export default WorkoutImageCell;
