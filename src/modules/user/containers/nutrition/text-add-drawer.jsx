import React from "react";
import { DrawerBody, DrawerFooter } from "@/components/ui/drawer.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { map, slice } from "lodash";
import { cn } from "@/lib/utils.js";

const TextAddDrawer = ({
  value,
  onChange,
  onContinue,
  isSubmitting = false,
  transcriptHistory = [],
  onUseHistory,
}) => {
  const hasText = Boolean(value.trim());
  const showHistory = !hasText && transcriptHistory.length > 0;

  return (
    <>
      <DrawerBody>
        <Textarea
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nima yedingiz? (masalan: 2 ta tuxum, 1 bo'lak non, 1 avokado)"
          className="min-h-[50vh] resize-none !border-0 !bg-transparent px-0 py-4 text-2xl font-bold leading-tight shadow-none outline-none placeholder:text-muted-foreground/35 focus-visible:border-transparent focus-visible:ring-0 md:text-3xl"
        />
      </DrawerBody>
      <DrawerFooter
        className={cn("h-40  flex flex-col  px-0", {
          "justify-end": !showHistory,
        })}
      >
        {showHistory ? (
          <div>
            <p className="text-sm font-semibold text-muted-foreground px-4">
              Oxirgi loglar
            </p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar p-2 px-5">
              {map(slice(transcriptHistory, 0, 5), (item, index) => (
                <button
                  key={`${item.transcript}-${index}`}
                  type="button"
                  className={"shadow  py-2 px-2 rounded-xl min-w-52"}
                  onClick={() => onUseHistory?.(item)}
                >
                  <p className="line-clamp-2 text-base font-bold text-foreground">
                    {item.transcript}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            disabled={!hasText || isSubmitting}
            aria-hidden={!hasText}
            className={"mx-5 h-12 font-bold text-base"}
          >
            Davom etish
          </Button>
        )}
      </DrawerFooter>
    </>
  );
};

export default TextAddDrawer;
