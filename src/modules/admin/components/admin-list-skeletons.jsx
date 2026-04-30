import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const adminListSkeletons = {
  action: (
    <div className="flex h-[41px] items-center justify-end">
      <Skeleton className="size-8 rounded-md" />
    </div>
  ),
  avatarText: (
    <div className="flex h-[41px] items-center gap-3">
      <Skeleton className="size-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  ),
  badge: (
    <div className="flex h-[41px] items-center">
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  ),
  image: (
    <div className="flex h-[41px] items-center">
      <Skeleton className="size-10 rounded-xl" />
    </div>
  ),
  index: (
    <div className="flex h-[41px] items-center">
      <Skeleton className="h-5 w-8" />
    </div>
  ),
  status: (
    <div className="flex h-[41px] items-center">
      <Skeleton className="h-6 w-10 rounded-full" />
    </div>
  ),
  text: (
    <div className="flex h-[41px] items-center">
      <Skeleton className="h-5 w-24" />
    </div>
  ),
  translations: (
    <div className="flex h-[41px] items-center gap-1">
      <Skeleton className="size-5 rounded" />
      <Skeleton className="size-5 rounded" />
      <Skeleton className="size-5 rounded" />
    </div>
  ),
};
