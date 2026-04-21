import React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REPORT_TYPES } from "./report-utils.js";

const initialValues = {
  type: "business_report_pdf",
  period: "monthly",
  clientId: "",
  dateFrom: "",
  dateTo: "",
};

export const GenerateReportDrawer = ({
  open,
  clients = [],
  onOpenChange,
  onSubmit,
  isGenerating = false,
}) => {
  const [values, setValues] = React.useState(initialValues);

  React.useEffect(() => {
    if (open) setValues(initialValues);
  }, [open]);

  const updateValue = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      type: values.type,
      period: values.period,
      ...(values.clientId ? { clientId: values.clientId } : {}),
      ...(values.dateFrom ? { dateFrom: values.dateFrom } : {}),
      ...(values.dateTo ? { dateTo: values.dateTo } : {}),
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>Yangi report yaratish</DrawerTitle>
          <DrawerDescription>
            Report turi, davr va kerakli filterlarni tanlang.
          </DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report turi</Label>
              <select
                id="report-type"
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                value={values.type}
                onChange={updateValue("type")}
              >
                {REPORT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {values.type === "client_progress_pdf" ? (
              <div className="space-y-2">
                <Label htmlFor="report-client">Client</Label>
                <select
                  id="report-client"
                  className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                  value={values.clientId}
                  onChange={updateValue("clientId")}
                  required
                >
                  <option value="">Client tanlang</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="report-period">Davr</Label>
              <select
                id="report-period"
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                value={values.period}
                onChange={updateValue("period")}
              >
                <option value="weekly">Haftalik</option>
                <option value="monthly">Oylik</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="report-date-from">Boshlanish</Label>
                <Input
                  id="report-date-from"
                  type="date"
                  value={values.dateFrom}
                  onChange={updateValue("dateFrom")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-date-to">Tugash</Label>
                <Input
                  id="report-date-to"
                  type="date"
                  value={values.dateTo}
                  onChange={updateValue("dateTo")}
                />
              </div>
            </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit" disabled={isGenerating}>
              Generate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Bekor qilish
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default GenerateReportDrawer;
