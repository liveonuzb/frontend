const WorkoutImageCell = ({ workout }) => {
  if (workout?.imageUrl) {
    return (
      <div className="size-10 overflow-hidden rounded-xl border">
        <img loading="lazy"
          src={workout.imageUrl}
          alt={workout.name}
          className="size-full object-cover"
        />
      </div>
    );
  }

  if (workout?.youtubeUrl) {
    return (
      <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[10px] text-red-500 font-bold border border-red-100">
        YT
      </div>
    );
  }

  return (
    <div className="size-10 rounded-xl bg-muted border flex items-center justify-center text-xs text-muted-foreground">
      No
    </div>
  );
};

export default WorkoutImageCell;
