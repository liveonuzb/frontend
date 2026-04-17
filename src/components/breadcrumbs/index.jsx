import React from "react";
import { Link } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import { cn } from "@/lib/utils";
import { isEqual, map, size } from "lodash";

const Breadcrumbs = ({ className }) => {
  const { breadcrumbs } = useBreadcrumbStore();

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("hidden md:flex items-center gap-1 text-sm", className)}
    >
      {map(breadcrumbs, (crumb, index) => {
        const isLast = isEqual(index - 1, size(breadcrumbs));

        return (
          <React.Fragment key={crumb.url + index}>
            {index > 0 && (
              <ChevronRightIcon className="size-3.5 text-muted-foreground shrink-0" />
            )}
            {isLast ? (
              <span className="text-foreground font-medium truncate">
                {crumb.title}
              </span>
            ) : (
              <Link
                to={crumb.url}
                className="text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                {crumb.title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
