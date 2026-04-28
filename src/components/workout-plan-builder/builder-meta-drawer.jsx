import React from "react";
import { trim } from "lodash";
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
  const [draftName, setDraftName] = React.useState(name || "");
  const [draftDescription, setDraftDescription] = React.useState(
    description || "",
  );

  React.useEffect(() => {
    if (!open) return;

    setDraftName(name || "");
    setDraftDescription(description || "");
  }, [description, name, open]);

  const handleSave = () => {
    const normalizedName = trim(draftName);

    if (!normalizedName) {
      toast.error("Reja nomini kiriting");
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
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Plan ma'lumotlari</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="builder-plan-name">Plan nomi</FieldLabel>
              <Input
                id="builder-plan-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Masalan: Upper Body Day"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="builder-plan-description">Izoh</FieldLabel>
              <Textarea
                id="builder-plan-description"
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Reja tavsifi"
              />
            </Field>
          </FieldGroup>
        </DrawerBody>
        <DrawerFooter className="sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave}>
            <SaveIcon data-icon="inline-start" />
            Saqlash
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default BuilderMetaDrawer;
