import React, { memo } from "react";
import { DumbbellIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.jsx";
import { DrawerFooter } from "@/components/ui/drawer.jsx";

const BuilderFooter = memo(({ onSave, isSaving = false, saveLabel = null }) => {
  const { t } = useTranslation();

  return (
    <DrawerFooter>
      <Button onClick={onSave} className="font-bold" disabled={isSaving}>
        {isSaving ? (
          <LoaderCircleIcon className="size-4 mr-2 animate-spin" />
        ) : (
          <DumbbellIcon className="size-4 mr-2" />
        )}
        {saveLabel || t("components.workoutPlanBuilder.footer.savePlan")}
      </Button>
    </DrawerFooter>
  );
});

export default BuilderFooter;
