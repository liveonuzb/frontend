import React from "react";
import { get, map, size, toNumber, trim } from "lodash";
import { toast } from "sonner";
import {
  ArchiveIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PackagePlusIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  UsersRoundIcon,
} from "lucide-react";
import PageTransition from "@/components/page-transition";
import CoachErrorState from "@/modules/coach/components/coach-error-state";
import { useCoachPackages } from "@/hooks/app/use-coach.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const PACKAGE_FORM_DEFAULTS = {
  name: "",
  description: "",
  terms: "",
  priceAmount: "",
  billingCycle: "MONTHLY",
  sessionsPerMonth: "",
  checkInsPerWeek: "",
  mealPlansPerMonth: "",
  workoutPlansPerMonth: "",
  invoiceDueDay: "",
  hasGroupAccess: false,
  isActive: true,
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Math.max(0, Math.round(toNumber(value)));
};

const toPackageForm = (pkg) => ({
  name: get(pkg, "name", ""),
  description: get(pkg, "description", ""),
  terms: get(pkg, "terms", ""),
  priceAmount: String(get(pkg, "priceAmount", "")),
  billingCycle: String(get(pkg, "billingCycle", "monthly")).toUpperCase(),
  sessionsPerMonth:
    get(pkg, "sessionsPerMonth") === null
      ? ""
      : String(get(pkg, "sessionsPerMonth", "")),
  checkInsPerWeek:
    get(pkg, "checkInsPerWeek") === null
      ? ""
      : String(get(pkg, "checkInsPerWeek", "")),
  mealPlansPerMonth:
    get(pkg, "mealPlansPerMonth") === null
      ? ""
      : String(get(pkg, "mealPlansPerMonth", "")),
  workoutPlansPerMonth:
    get(pkg, "workoutPlansPerMonth") === null
      ? ""
      : String(get(pkg, "workoutPlansPerMonth", "")),
  invoiceDueDay:
    get(pkg, "invoiceDueDay") === null
      ? ""
      : String(get(pkg, "invoiceDueDay", "")),
  hasGroupAccess: Boolean(get(pkg, "hasGroupAccess", false)),
  isActive: Boolean(get(pkg, "isActive", true)),
});

const PackageMetric = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
    <div className="flex size-9 items-center justify-center rounded-full bg-muted">
      <Icon />
    </div>
    <div className="min-w-0">
      <div className="text-lg font-semibold">{value}</div>
      <div className="truncate text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

const PackageFormField = ({ label, htmlFor, children }) => (
  <div className="flex flex-col gap-2">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

const PackagesIndex = () => {
  const packageParams = React.useMemo(() => ({ includeInactive: true }), []);
  const {
    packages,
    createPackage,
    updatePackage,
    deletePackage,
    isLoading,
    isError,
    refetch,
    isCreatingPackage,
    isUpdatingPackage,
    isDeletingPackage,
  } = useCoachPackages(packageParams);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState(null);
  const [archiveTarget, setArchiveTarget] = React.useState(null);
  const [form, setForm] = React.useState(PACKAGE_FORM_DEFAULTS);

  const activeCount = React.useMemo(
    () => packages.filter((pkg) => pkg.isActive).length,
    [packages],
  );
  const monthlyCount = React.useMemo(
    () => packages.filter((pkg) => pkg.billingCycle === "monthly").length,
    [packages],
  );

  const isSubmitting = isCreatingPackage || isUpdatingPackage;

  const patchForm = React.useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const openCreateDialog = React.useCallback(() => {
    setEditingPackage(null);
    setForm(PACKAGE_FORM_DEFAULTS);
    setDialogOpen(true);
  }, []);

  const openEditDialog = React.useCallback((pkg) => {
    setEditingPackage(pkg);
    setForm(toPackageForm(pkg));
    setDialogOpen(true);
  }, []);

  const buildPayload = React.useCallback(
    () => ({
      name: trim(form.name),
      description: trim(form.description),
      terms: trim(form.terms),
      priceAmount: Math.max(0, Math.round(toNumber(form.priceAmount))),
      billingCycle: form.billingCycle,
      sessionsPerMonth: toOptionalNumber(form.sessionsPerMonth),
      checkInsPerWeek: toOptionalNumber(form.checkInsPerWeek),
      mealPlansPerMonth: toOptionalNumber(form.mealPlansPerMonth),
      workoutPlansPerMonth: toOptionalNumber(form.workoutPlansPerMonth),
      invoiceDueDay:
        form.invoiceDueDay === ""
          ? null
          : Math.round(toNumber(form.invoiceDueDay)),
      hasGroupAccess: Boolean(form.hasGroupAccess),
      isActive: Boolean(form.isActive),
    }),
    [form],
  );

  const handleSubmit = React.useCallback(async () => {
    const payload = buildPayload();
    if (!payload.name) {
      toast.error("Paket nomini kiriting");
      return;
    }

    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, payload);
        toast.success("Paket yangilandi");
      } else {
        await createPackage(payload);
        toast.success("Paket yaratildi");
      }
      setDialogOpen(false);
      setEditingPackage(null);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(
        Array.isArray(message)
          ? message[0]
          : message || "Paketni saqlab bo'lmadi",
      );
    }
  }, [buildPayload, createPackage, editingPackage, updatePackage]);

  const handleArchive = React.useCallback(async () => {
    if (!archiveTarget) return;
    try {
      await deletePackage(archiveTarget.id);
      toast.success("Paket arxivlandi");
      setArchiveTarget(null);
    } catch (error) {
      toast.error(
        get(error, "response.data.message") || "Paketni arxivlab bo'lmadi",
      );
    }
  }, [archiveTarget, deletePackage]);

  if (isError) {
    return (
      <PageTransition>
        <CoachErrorState onRetry={refetch} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <PackagePlusIcon className="size-6" /> Paketlar
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Service package, contract terms va billing limitlarni boshqarish.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <PlusIcon data-icon="inline-start" />
            Paket qo'shish
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <PackageMetric
            icon={CheckCircle2Icon}
            label="Aktiv paketlar"
            value={activeCount}
          />
          <PackageMetric
            icon={RepeatIcon}
            label="Monthly billing"
            value={monthlyCount}
          />
          <PackageMetric
            icon={FileTextIcon}
            label="Jami contract templates"
            value={size(packages)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : size(packages) === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 text-center">
            <PackagePlusIcon className="size-10 text-muted-foreground" />
            <div className="text-lg font-semibold">Paket yo'q</div>
            <div className="max-w-md text-sm text-muted-foreground">
              Coach package yaratilgandan keyin u client contract va invoice
              oqimiga ulanadi.
            </div>
            <Button onClick={openCreateDialog}>
              <PlusIcon data-icon="inline-start" />
              Birinchi paket
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {map(packages, (pkg) => (
              <Card key={pkg.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{pkg.name}</span>
                    <Badge variant={pkg.isActive ? "secondary" : "outline"}>
                      {pkg.isActive ? "Aktiv" : "Arxiv"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {pkg.description || "Izoh kiritilmagan"}
                  </CardDescription>
                  <CardAction className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(pkg)}
                    >
                      <PencilIcon data-icon="inline-start" />
                      Tahrirlash
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={!pkg.isActive}
                      onClick={() => setArchiveTarget(pkg)}
                    >
                      <ArchiveIcon data-icon="inline-start" />
                      Arxivlash
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PackageMetric
                      icon={RepeatIcon}
                      label={pkg.billingCycle}
                      value={`${pkg.priceAmount?.toLocaleString("uz-UZ")} UZS`}
                    />
                    <PackageMetric
                      icon={UsersRoundIcon}
                      label="Session / check-in"
                      value={`${pkg.sessionsPerMonth ?? 0} / ${
                        pkg.checkInsPerWeek ?? 0
                      }`}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Meal plan: {pkg.mealPlansPerMonth ?? 0}
                    </Badge>
                    <Badge variant="outline">
                      Workout plan: {pkg.workoutPlansPerMonth ?? 0}
                    </Badge>
                    <Badge variant="outline">
                      Invoice day: {pkg.invoiceDueDay ?? 1}
                    </Badge>
                    {pkg.hasGroupAccess ? (
                      <Badge variant="secondary">Group access</Badge>
                    ) : null}
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <div className="truncate text-sm text-muted-foreground">
                    {pkg.terms || "Terms hali kiritilmagan"}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Paketni tahrirlash" : "Yangi paket"}
              </DialogTitle>
              <DialogDescription>
                Narx, terms va client plan limitlarini belgilang.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <PackageFormField label="Nomi" htmlFor="coach-package-name">
                <Input
                  id="coach-package-name"
                  value={form.name}
                  onChange={(event) => patchForm("name", event.target.value)}
                  placeholder="Premium coaching"
                />
              </PackageFormField>
              <PackageFormField label="Narx" htmlFor="coach-package-price">
                <Input
                  id="coach-package-price"
                  type="number"
                  min="0"
                  value={form.priceAmount}
                  onChange={(event) =>
                    patchForm("priceAmount", event.target.value)
                  }
                  placeholder="900000"
                />
              </PackageFormField>
              <PackageFormField label="Billing cycle" htmlFor="billing-cycle">
                <Select
                  value={form.billingCycle}
                  onValueChange={(value) => patchForm("billingCycle", value)}
                >
                  <SelectTrigger id="billing-cycle" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </PackageFormField>
              <PackageFormField label="Invoice day" htmlFor="invoice-day">
                <Input
                  id="invoice-day"
                  type="number"
                  min="1"
                  max={form.billingCycle === "WEEKLY" ? "7" : "31"}
                  value={form.invoiceDueDay}
                  onChange={(event) =>
                    patchForm("invoiceDueDay", event.target.value)
                  }
                  placeholder={form.billingCycle === "WEEKLY" ? "1" : "5"}
                />
              </PackageFormField>
              <PackageFormField label="Session / oy" htmlFor="sessions-month">
                <Input
                  id="sessions-month"
                  type="number"
                  min="0"
                  value={form.sessionsPerMonth}
                  onChange={(event) =>
                    patchForm("sessionsPerMonth", event.target.value)
                  }
                />
              </PackageFormField>
              <PackageFormField
                label="Check-in / hafta"
                htmlFor="checkins-week"
              >
                <Input
                  id="checkins-week"
                  type="number"
                  min="0"
                  value={form.checkInsPerWeek}
                  onChange={(event) =>
                    patchForm("checkInsPerWeek", event.target.value)
                  }
                />
              </PackageFormField>
              <PackageFormField
                label="Meal plan / oy"
                htmlFor="meal-plan-month"
              >
                <Input
                  id="meal-plan-month"
                  type="number"
                  min="0"
                  value={form.mealPlansPerMonth}
                  onChange={(event) =>
                    patchForm("mealPlansPerMonth", event.target.value)
                  }
                />
              </PackageFormField>
              <PackageFormField
                label="Workout plan / oy"
                htmlFor="workout-plan-month"
              >
                <Input
                  id="workout-plan-month"
                  type="number"
                  min="0"
                  value={form.workoutPlansPerMonth}
                  onChange={(event) =>
                    patchForm("workoutPlansPerMonth", event.target.value)
                  }
                />
              </PackageFormField>
              <PackageFormField label="Izoh" htmlFor="package-description">
                <Textarea
                  id="package-description"
                  value={form.description}
                  onChange={(event) =>
                    patchForm("description", event.target.value)
                  }
                  rows={3}
                />
              </PackageFormField>
              <PackageFormField label="Terms" htmlFor="package-terms">
                <Textarea
                  id="package-terms"
                  value={form.terms}
                  onChange={(event) => patchForm("terms", event.target.value)}
                  rows={3}
                />
              </PackageFormField>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.hasGroupAccess}
                  onCheckedChange={(checked) =>
                    patchForm("hasGroupAccess", Boolean(checked))
                  }
                />
                Group access bor
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    patchForm("isActive", Boolean(checked))
                  }
                />
                Aktiv
              </label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(archiveTarget)}
          onOpenChange={(open) => !open && setArchiveTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Paket arxivlansinmi?</AlertDialogTitle>
              <AlertDialogDescription>
                {archiveTarget?.name} aktiv paketlar ro'yxatidan olinadi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingPackage}>
                Bekor qilish
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void handleArchive()}
                disabled={isDeletingPackage}
              >
                {isDeletingPackage ? "Arxivlanmoqda..." : "Arxivlash"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default PackagesIndex;
