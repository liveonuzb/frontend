import React from "react";
import { getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table";
import { compact, find, get, isArray, join, trim } from "lodash";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GlobeIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import useLanguageStore from "@/store/language-store";
import { useQueryClient } from "@tanstack/react-query";
import { useGetQuery, usePostQuery, usePatchQuery } from "@/hooks/api";
import { cn } from "@/lib/utils";
import {
  getPermissionTranslation,
  normalizePermissionDomain,
  PERMISSION_DOMAIN_OPTIONS,
} from "@/lib/permission-utils";
import {
  DataGrid,
  DataGridContainer,
  DataGridTable,
} from "@/components/reui/data-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PermissionActionsMenu from "../components/permission-actions-menu";
import { useColumns } from "./columns.jsx";
import { Filter } from "./filter.jsx";
import { usePermissionFilters } from "./use-filters.js";

const PERMISSION_LANGUAGES = [
  { code: "uz", label: "UZ", titleKey: "titleUz", descriptionKey: "descriptionUz" },
  { code: "ru", label: "RU", titleKey: "titleRu", descriptionKey: "descriptionRu" },
  { code: "en", label: "EN", titleKey: "titleEn", descriptionKey: "descriptionEn" },
];

const EMPTY_FORM = {
  id: "", domain: "platform", nodeType: "GROUP", key: "", parentId: "", parentCode: "",
  sortOrder: "100", isActive: true, titleUz: "", titleRu: "", titleEn: "",
  descriptionUz: "", descriptionRu: "", descriptionEn: "",
};

const resolvePermissionLanguageConfig = (language) =>
  find(PERMISSION_LANGUAGES, (item) => item.code === language) || PERMISSION_LANGUAGES[0];

const buildNodeForm = (node, domain, parent = null) => ({
  ...EMPTY_FORM,
  id: node?.id || "", domain,
  nodeType: node?.nodeType?.toUpperCase() || "GROUP",
  key: node?.key || "",
  parentId: parent?.id || "", parentCode: parent?.code || "",
  sortOrder: String(node?.sortOrder || 0), isActive: node?.isActive !== false,
  titleUz: node?.titleTranslations?.uz || "", titleRu: node?.titleTranslations?.ru || "",
  titleEn: node?.titleTranslations?.en || "",
  descriptionUz: node?.descriptionTranslations?.uz || "",
  descriptionRu: node?.descriptionTranslations?.ru || "",
  descriptionEn: node?.descriptionTranslations?.en || "",
});

const countFilledTitleTranslations = (node) =>
  PERMISSION_LANGUAGES.filter((language) =>
    trim(getPermissionTranslation(node?.titleTranslations, language.code)),
  ).length;

const resolveNodeSearchText = (node) => {
  const values = [node?.key, node?.code, node?.titleTranslations?.uz, node?.titleTranslations?.ru, node?.titleTranslations?.en, node?.descriptionTranslations?.uz, node?.descriptionTranslations?.ru, node?.descriptionTranslations?.en]
    .map((value) => String(value ?? "").toLowerCase());
  return compact(values).join(" ");
};

const filterPermissionGroups = (groups, search, statusFilter) =>
  groups.reduce((result, group) => {
    const filteredChildren = (group.children || []).filter((child) => {
      const matchesSearch = !search || resolveNodeSearchText(child).includes(search);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? child.isActive : !child.isActive);
      return matchesSearch && matchesStatus;
    });
    const groupMatchesSearch = !search || resolveNodeSearchText(group).includes(search);
    const groupMatchesStatus = statusFilter === "all" || (statusFilter === "active" ? group.isActive : !group.isActive);
    if ((groupMatchesSearch && groupMatchesStatus) || filteredChildren.length) {
      result.push({ ...group, children: filteredChildren });
    }
    return result;
  }, []);

const PermissionStatCard = ({ label, value, hint, icon: Icon }) => (
  <Card className="rounded-[28px] border-border/50 bg-background/75">
    <CardContent className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground">{hint}</div>
    </CardContent>
  </Card>
);

const PermissionActionsPanel = ({ group, currentLanguage, isUpdating, onAddAction, onEdit, onToggleActive, onTranslations }) => (
  <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
    {group.children?.length ? (
      group.children.map((child) => {
        const translationCount = countFilledTitleTranslations(child);
        return (
          <div key={child.id} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{getPermissionTranslation(child.titleTranslations, currentLanguage) || child.key}</p>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">Action</Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">sort {child.sortOrder}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{child.code}</p>
                <p className="mt-2 text-sm text-muted-foreground">{getPermissionTranslation(child.descriptionTranslations, currentLanguage) || "Izoh kiritilmagan"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {PERMISSION_LANGUAGES.map((language) => (
                      <div key={language.code} title={`${language.label}: ${trim(getPermissionTranslation(child.titleTranslations, language.code)) ? "Bor" : "Yo'q"}`}
                        className={cn("flex size-6 items-center justify-center rounded-md border text-[10px]", trim(getPermissionTranslation(child.titleTranslations, language.code)) ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent bg-muted opacity-45")}>
                        {language.label}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{translationCount}/{PERMISSION_LANGUAGES.length} tarjima</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="flex items-center gap-2">
                  <Switch checked={Boolean(child.isActive)} disabled={isUpdating} onCheckedChange={() => onToggleActive(child)} />
                  <span className={cn("text-xs font-medium", child.isActive ? "text-emerald-600" : "text-muted-foreground")}>{child.isActive ? "Faol" : "Nofaol"}</span>
                </div>
                <PermissionActionsMenu node={child} onEdit={(node) => onEdit(node, group)} onTranslations={(node) => onTranslations(node, group)} />
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background px-4 py-5 text-sm text-muted-foreground">Hali action qo&apos;shilmagan.</div>
    )}
    <Button type="button" variant="outline" className="w-full justify-center gap-2 rounded-2xl border-dashed" onClick={() => onAddAction(group)}>
      <PlusIcon className="size-4" />Add Action
    </Button>
  </div>
);

const PermissionsContainer = () => {
  const { setBreadcrumbs } = useBreadcrumbStore();
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const currentLanguageConfig = React.useMemo(() => resolvePermissionLanguageConfig(currentLanguage), [currentLanguage]);
  const queryClient = useQueryClient();

  const { data: permissionNodesData, isLoading, isFetching, refetch } = useGetQuery({
    url: "/admin/permission-nodes",
    queryProps: {
      queryKey: ["admin", "permission-nodes"],
    },
  });

  const domains = get(permissionNodesData, "data.data.domains", []);
  const stats = get(permissionNodesData, "data.data.stats", { groups: 0, actions: 0 });

  const createMutation = usePostQuery({
    queryKey: ["admin", "permission-nodes"],
    listKey: ["admin", "audit-logs"],
  });

  const updateMutation = usePatchQuery({
    queryKey: ["admin", "permission-nodes"],
    listKey: ["admin", "audit-logs"],
  });

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  const createPermissionNode = React.useCallback(
    async (payload) =>
      createMutation.mutateAsync({
        url: "/admin/permission-nodes",
        attributes: payload,
      }),
    [createMutation],
  );

  const updatePermissionNode = React.useCallback(
    async (nodeId, payload) =>
      updateMutation.mutateAsync({
        url: `/admin/permission-nodes/${nodeId}`,
        attributes: payload,
      }),
    [updateMutation],
  );

  const { selectedDomain, search, statusFilter, filterFields, activeFilters, handleFiltersChange } = usePermissionFilters();

  const [drawerMode, setDrawerMode] = React.useState(null);
  const [translationsDrawerOpen, setTranslationsDrawerOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState({});
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [translatingNode, setTranslatingNode] = React.useState(null);
  const [translationForm, setTranslationForm] = React.useState(EMPTY_FORM);
  const deferredSearch = React.useDeferredValue(search);

  React.useEffect(() => {
    setBreadcrumbs([{ url: "/admin", title: "Admin" }, { url: "/admin/permissions", title: "Permissionlar" }]);
  }, [setBreadcrumbs]);

  const currentDomainData = React.useMemo(
    () => find(domains, (item) => normalizePermissionDomain(item.domain) === selectedDomain) || { groups: [] },
    [domains, selectedDomain],
  );

  const hasActiveFilters = Boolean(trim(search)) || statusFilter !== "all";

  const filteredGroups = React.useMemo(
    () => filterPermissionGroups(currentDomainData.groups || [], trim(deferredSearch).toLowerCase(), statusFilter),
    [currentDomainData.groups, deferredSearch, statusFilter],
  );

  const filteredGroupIds = React.useMemo(
    () => filteredGroups.map((g) => g.id).join(","),
    [filteredGroups],
  );

  React.useEffect(() => {
    if (!hasActiveFilters) { setExpanded({}); return; }
    const ids = filteredGroupIds.split(",").filter(Boolean);
    setExpanded(ids.reduce((acc, id) => { acc[id] = true; return acc; }, {}));
  }, [filteredGroupIds, hasActiveFilters]);

  const openCreateGroup = React.useCallback(() => {
    const groups = currentDomainData.groups || [];
    const lastGroup = groups[groups.length - 1];
    setDrawerMode("create");
    setForm({ ...EMPTY_FORM, domain: selectedDomain, nodeType: "GROUP", sortOrder: String((lastGroup?.sortOrder || 0) + 100) });
  }, [currentDomainData.groups, selectedDomain]);

  const openCreateAction = React.useCallback((group) => {
    const lastChild = group.children?.[group.children.length - 1];
    setDrawerMode("create");
    setForm({ ...EMPTY_FORM, domain: selectedDomain, nodeType: "ACTION", parentId: group.id, parentCode: group.code, sortOrder: String((lastChild?.sortOrder || 0) + 100) });
  }, [selectedDomain]);

  const openEditNode = React.useCallback((node, parent = null) => {
    setDrawerMode("edit");
    setForm(buildNodeForm(node, selectedDomain, parent));
  }, [selectedDomain]);

  const openTranslationsDrawer = React.useCallback((node, parent = null) => {
    setTranslatingNode({ ...node, parentId: parent?.id || "", parentCode: parent?.code || "" });
    setTranslationForm(buildNodeForm(node, selectedDomain, parent));
    setTranslationsDrawerOpen(true);
  }, [selectedDomain]);

  const handleSubmit = React.useCallback(async () => {
    const currentTitleValue = trim(String(form[currentLanguageConfig.titleKey] ?? ""));
    const currentDescriptionValue = String(form[currentLanguageConfig.descriptionKey] ?? "");
    if (!currentTitleValue) { toast.error("Joriy til uchun sarlavha kiriting"); return; }

    try {
      const basePayload = { domain: form.domain.toUpperCase(), nodeType: form.nodeType, key: form.key, parentId: form.parentId || undefined, sortOrder: Number(form.sortOrder) || 0, isActive: Boolean(form.isActive) };
      if (drawerMode === "edit") {
        await updatePermissionNode(form.id, { sortOrder: basePayload.sortOrder, isActive: basePayload.isActive, [currentLanguageConfig.titleKey]: currentTitleValue, [currentLanguageConfig.descriptionKey]: currentDescriptionValue });
        toast.success("Permission yangilandi");
      } else {
        await createPermissionNode({
          ...basePayload,
          titleUz: currentLanguageConfig.titleKey === "titleUz" ? currentTitleValue : "",
          titleRu: currentLanguageConfig.titleKey === "titleRu" ? currentTitleValue : "",
          titleEn: currentLanguageConfig.titleKey === "titleEn" ? currentTitleValue : "",
          descriptionUz: currentLanguageConfig.descriptionKey === "descriptionUz" ? currentDescriptionValue : "",
          descriptionRu: currentLanguageConfig.descriptionKey === "descriptionRu" ? currentDescriptionValue : "",
          descriptionEn: currentLanguageConfig.descriptionKey === "descriptionEn" ? currentDescriptionValue : "",
        });
        toast.success("Permission yaratildi");
      }
      setDrawerMode(null); setForm(EMPTY_FORM);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Permissionni saqlab bo'lmadi");
    }
  }, [createPermissionNode, currentLanguageConfig, drawerMode, form, updatePermissionNode]);

  const handleTranslationSave = React.useCallback(async () => {
    if (!translatingNode?.id) return;
    try {
      await updatePermissionNode(translatingNode.id, { titleUz: trim(translationForm.titleUz), titleRu: trim(translationForm.titleRu), titleEn: trim(translationForm.titleEn), descriptionUz: trim(translationForm.descriptionUz), descriptionRu: trim(translationForm.descriptionRu), descriptionEn: trim(translationForm.descriptionEn) });
      toast.success("Tarjimalar yangilandi");
      setTranslationsDrawerOpen(false); setTranslatingNode(null); setTranslationForm(EMPTY_FORM);
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Tarjimalarni saqlab bo'lmadi");
    }
  }, [translationForm, translatingNode, updatePermissionNode]);

  const handleToggleActive = React.useCallback(async (node) => {
    try {
      await updatePermissionNode(node.id, { isActive: !node.isActive });
      toast.success(node.isActive ? "Permission nofaol qilindi" : "Permission faol qilindi");
    } catch (error) {
      const message = get(error, "response.data.message");
      toast.error(isArray(message) ? join(message, ", ") : message || "Permission statusini o'zgartirib bo'lmadi");
    }
  }, [updatePermissionNode]);

  const columns = useColumns({
    currentLanguage, isUpdating, handleToggleActive, openCreateAction, openEditNode, openTranslationsDrawer, PermissionActionsPanel,
  });

  const table = useReactTable({
    data: filteredGroups, columns, state: { expanded }, onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(), getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true, getRowId: (row) => String(row.id),
  });

  const activeDomainLabel = get(find(PERMISSION_DOMAIN_OPTIONS, (item) => item.value === selectedDomain), "label") || selectedDomain;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <SparklesIcon className="size-3.5" />Permission Builder
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Permission katalogi</h1>
            <p className="mt-1 text-sm text-muted-foreground">Platform permission group/action tree ni admin shu yerdan boshqaradi.</p>
          </div>
        </div>
        <Button onClick={openCreateGroup} className="gap-1.5"><PlusIcon className="size-4" />Yangi group</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PermissionStatCard label="Group lar" value={stats.groups} hint="Root permission bo'limlari" icon={ShieldCheckIcon} />
        <PermissionStatCard label="Action lar" value={stats.actions} hint="Group ichidagi action node lar" icon={SparklesIcon} />
        <PermissionStatCard label="Domainlar" value={domains.length} hint="Platform" icon={ShieldCheckIcon} />
        <PermissionStatCard label="Aktiv domain" value={activeDomainLabel} hint="Hozir jadvalda ko'rinayotgan domain" icon={SparklesIcon} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Filter filterFields={filterFields} activeFilters={activeFilters} handleFiltersChange={handleFiltersChange} />
        <Button variant="outline" size="icon" onClick={() => refetch()} className="hidden sm:flex" disabled={isFetching}>
          <RotateCcwIcon className={cn("size-4", isFetching && "animate-spin")} />
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{filteredGroups.length} / {currentDomainData.groups?.length || 0} ta group {"\u2022"} {activeDomainLabel}</p>
        <p>Actionlar group rowni ochganda chiqadi</p>
      </div>

      <DataGridContainer>
        <ScrollArea className="w-full">
          <DataGrid table={table} isLoading={isLoading}><DataGridTable /></DataGrid>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DataGridContainer>

      {!isLoading && !filteredGroups.length ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">Tanlangan filterlar bo&apos;yicha permission topilmadi.</div>
      ) : null}

      {/* Create/Edit Drawer */}
      <Drawer open={Boolean(drawerMode)} onOpenChange={(open) => { if (!open) { setDrawerMode(null); setForm(EMPTY_FORM); } }} direction="bottom">
        <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
          <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">{drawerMode === "edit" ? "Permissionni tahrirlash" : form.nodeType === "ACTION" ? "Yangi action" : "Yangi group"}</DrawerTitle>
              <DrawerDescription>Main drawer faqat joriy locale va asosiy fieldlar uchun. Boshqa tillar alohida translation drawerda tahrirlanadi.</DrawerDescription>
            </DrawerHeader>
            <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">Domain: {activeDomainLabel} {"\u2022"} Type: {form.nodeType}</p>
                <p className="mt-1 text-xs text-muted-foreground">{form.parentCode ? `Parent group: ${form.parentCode}` : "Bu node root darajada saqlanadi."}</p>
                <p className="mt-1 text-xs text-muted-foreground">Joriy til: {currentLanguageConfig.label}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label>Permission key</Label>
                  <Input value={form.key} disabled={drawerMode === "edit"} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} placeholder="masalan: memberships yoki refund" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Sort order</Label>
                  <Input type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/15 px-4 py-3">
                  <div><div className="font-medium">Faol holat</div><div className="text-sm text-muted-foreground">O&apos;chirilsa yangi assignmentlarda ishlatilmaydi.</div></div>
                  <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: Boolean(checked) }))} />
                </div>
                <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4 md:col-span-2">
                  <div className="text-sm font-semibold">{currentLanguageConfig.label} content</div>
                  <Input value={form[currentLanguageConfig.titleKey]} onChange={(event) => setForm((current) => ({ ...current, [currentLanguageConfig.titleKey]: event.target.value }))} placeholder="Sarlavha" />
                  <Textarea value={form[currentLanguageConfig.descriptionKey]} onChange={(event) => setForm((current) => ({ ...current, [currentLanguageConfig.descriptionKey]: event.target.value }))} placeholder="Izoh" rows={4} />
                </div>
              </div>
            </div>
            <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
              <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>{drawerMode === "edit" ? "Saqlash" : "Yaratish"}</Button>
              <DrawerClose asChild><Button variant="outline">Bekor qilish</Button></DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Translations Drawer */}
      <Drawer open={translationsDrawerOpen} onOpenChange={(open) => { setTranslationsDrawerOpen(open); if (!open) { setTranslatingNode(null); setTranslationForm(EMPTY_FORM); } }} direction="bottom">
        <DrawerContent className="mx-auto max-h-[90vh] data-[vaul-drawer-direction=bottom]:md:max-w-2xl">
          <div className="mx-auto flex w-full min-h-0 flex-1 flex-col">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2"><GlobeIcon className="size-5" />Tarjimalarni boshqarish</DrawerTitle>
              <DrawerDescription>Barcha tillar uchun title va description shu drawerda saqlanadi.</DrawerDescription>
            </DrawerHeader>
            <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-medium">{getPermissionTranslation(translatingNode?.titleTranslations, currentLanguage) || translatingNode?.key || "Permission"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{translatingNode?.code || translatingNode?.key}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {PERMISSION_LANGUAGES.map((language) => (
                  <div key={language.code} className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4">
                    <div className="text-sm font-semibold">{language.label}</div>
                    <Input value={translationForm[language.titleKey]} onChange={(event) => setTranslationForm((current) => ({ ...current, [language.titleKey]: event.target.value }))} placeholder="Sarlavha" />
                    <Textarea value={translationForm[language.descriptionKey]} onChange={(event) => setTranslationForm((current) => ({ ...current, [language.descriptionKey]: event.target.value }))} placeholder="Izoh" rows={4} />
                  </div>
                ))}
              </div>
            </div>
            <DrawerFooter className="gap-2 border-t bg-muted/5 px-6 py-4">
              <Button onClick={handleTranslationSave} disabled={isUpdating}>Tarjimalarni saqlash</Button>
              <DrawerClose asChild><Button variant="outline">Bekor qilish</Button></DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PermissionsContainer;
