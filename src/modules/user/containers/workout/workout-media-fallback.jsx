import React from "react";
import { DumbbellIcon, ImageIcon, PlayCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const getFallbackIcon = (variant) => {
  if (variant === "video") return PlayCircleIcon;
  if (variant === "exercise") return DumbbellIcon;

  return ImageIcon;
};

const WorkoutMediaFallback = ({
  src,
  alt = "",
  label = "Workout media mavjud emas",
  variant = "image",
  compact = false,
  className,
  imageClassName,
  fallbackClassName,
  loading = "lazy",
}) => {
  const [hasImageError, setHasImageError] = React.useState(false);
  const Icon = getFallbackIcon(variant);

  React.useEffect(() => {
    setHasImageError(false);
  }, [src]);

  if (src && !hasImageError) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("size-full object-cover", className, imageClassName)}
        loading={loading}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2 bg-muted/60 text-center text-muted-foreground",
        compact ? "gap-0 text-[10px] font-bold" : "px-3 py-4 text-sm font-medium",
        className,
        fallbackClassName,
      )}
    >
      <Icon className={cn(compact ? "size-4" : "size-6")} />
      {compact ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </div>
  );
};

export default WorkoutMediaFallback;
