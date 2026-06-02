import React from "react";
import { useTranslation } from "react-i18next";
import trim from "lodash/trim";
import { toast } from "sonner";
import { SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer.jsx";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const BuilderMetaDrawer = ({
  open,
  onOpenChange,
  name,
  description,
  onSave,
}) => {
  const { t } = useTranslation();
  const [draftName, setDraftName] = React.useState(name || "");
  const [draftDescription, setDraftDescription] = React.useState(
    description || "",
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open) return;

    setDraftName(name || "");
    setDraftDescription(description || "");
  }, [description, name, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = () => {
    const normalizedName = trim(draftName);

    if (!normalizedName) {
      toast.error(t("components.workoutPlanBuilder.toasts.nameRequired"));
      return;
    }

    onSave({
      name: normalizedName,
      description: draftDescription,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:md:max-w-sm">
        <DrawerHeader>
          <DrawerTitle>
            {t("components.workoutPlanBuilder.metaDrawer.title")}
          </DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="builder-plan-name">
                {t("components.workoutPlanBuilder.meta.nameLabel")}
              </FieldLabel>
              <Input
                id="builder-plan-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder={t("components.workoutPlanBuilder.meta.namePlaceholder")}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="builder-plan-description">
                {t("components.workoutPlanBuilder.meta.descriptionLabel")}
              </FieldLabel>
              <Textarea
                id="builder-plan-description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder={t("components.workoutPlanBuilder.metaDrawer.descriptionPlaceholder")}
              />
            </Field>
          </FieldGroup>
        </DrawerBody>
        <DrawerFooter className="sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("components.workoutPlanBuilder.meta.cancel")}
          </Button>
          <Button onClick={handleSave}>
            <SaveIcon data-icon="inline-start" />
            {t("components.workoutPlanBuilder.metaDrawer.save")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default BuilderMetaDrawer;
